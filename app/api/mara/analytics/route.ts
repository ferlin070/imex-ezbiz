import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateFeasibility } from '@/lib/feasibility'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Verify role: admin or mara_officer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'mara_officer' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Akses dinafikan. Anda bukan pegawai MARA yang sah.' }, { status: 403 })
    }

    // 3. Fetch all projects that are visible to MARA (mara_visible = true OR entry_type = 'direct')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, category, state, institution, event_id, entry_type, score_source')
      .or('mara_visible.eq.true,entry_type.eq.direct')

    if (projectsError) {
      console.error('Fetch analytics projects error:', projectsError)
      return NextResponse.json({ error: 'Gagal menarik data projek.' }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          tiers: {
            'Sangat Berpotensi': 0,
            'Layak Komersial': 0,
            'Berpotensi Sederhana': 0,
            'Perlu Bimbingan': 0,
          },
          sectors: [],
          top10: [],
        },
      })
    }

    // 4. Fetch all reports to match feasibility scores and tiers
    const projectIds = projects.map((p: any) => p.id)
    const { data: reports } = await supabase
      .from('ai_reports')
      .select('project_id, feasibility_score, feasibility_tier')
      .in('project_id', projectIds)

    const reportsMap = new Map<string, any>((reports || []).map((r: any) => [r.project_id, r]))

    // Fetch all self_assessments for direct projects
    const { data: selfAssessments } = await supabase
      .from('self_assessments')
      .select('project_id, computed_score')
      .in('project_id', projectIds)

    const selfAssessmentsMap = new Map<string, number>((selfAssessments || []).map((sa: any) => [sa.project_id, Number(sa.computed_score)]))

    // 5. Fetch all scores & criteria for fallback score calculation
    const { data: allScores } = await supabase
      .from('scores')
      .select('project_id, judge_id, criteria_id, score')
      .in('project_id', projectIds)

    const { data: allCriteria } = await supabase
      .from('criteria')
      .select('id, event_id, code, label, max_score, weight')

    const scoresByProject = new Map<string, any[]>()
    if (allScores) {
      allScores.forEach((s: any) => {
        if (!scoresByProject.has(s.project_id)) {
          scoresByProject.set(s.project_id, [])
        }
        scoresByProject.get(s.project_id)!.push(s)
      })
    }

    const criteriaByEvent = new Map<string, any[]>()
    if (allCriteria) {
      allCriteria.forEach((c: any) => {
        if (!criteriaByEvent.has(c.event_id)) {
          criteriaByEvent.set(c.event_id, [])
        }
        criteriaByEvent.get(c.event_id)!.push(c)
      })
    }

    // Initialize stats accumulators
    const tiersCount = {
      'Sangat Berpotensi': 0,
      'Layak Komersial': 0,
      'Berpotensi Sederhana': 0,
      'Perlu Bimbingan': 0,
    }

    const sectorsMap = new Map<string, number>()
    const enrichedProjects: any[] = []

    // 6. Map and enrich projects
    projects.forEach((p: any) => {
      const report = reportsMap.get(p.id)
      let score = report?.feasibility_score ? Number(report.feasibility_score) : 0
      let tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan' = report?.feasibility_tier || 'Perlu Bimbingan'

      // Fallback calculation if no AI report exists yet
      if (!report) {
        if (p.entry_type === 'direct') {
          score = selfAssessmentsMap.get(p.id) || 0
          if (score >= 80) tier = 'Sangat Berpotensi'
          else if (score >= 60) tier = 'Layak Komersial'
          else if (score >= 40) tier = 'Berpotensi Sederhana'
          else tier = 'Perlu Bimbingan'
        } else {
          const projScores = scoresByProject.get(p.id) || []
          const eventCriteria = criteriaByEvent.get(p.event_id) || []
          if (projScores.length > 0) {
            const calc = calculateFeasibility(projScores, eventCriteria)
            score = calc.score
            tier = calc.tier as any
          }
        }
      }

      // Ensure tier is a valid key
      if (tier in tiersCount) {
        tiersCount[tier]++
      } else {
        tiersCount['Perlu Bimbingan']++
      }

      // Sectors count
      const sector = p.category || 'Lain-lain'
      sectorsMap.set(sector, (sectorsMap.get(sector) || 0) + 1)

      enrichedProjects.push({
        id: p.id,
        title: p.title,
        category: sector,
        state: p.state || 'Tidak Dinyatakan',
        institution: p.institution || 'Tidak Dinyatakan',
        score,
        tier,
        score_source: p.score_source,
      })
    })

    // Format sectors list
    const sectors = Array.from(sectorsMap.entries()).map(([name, value]) => ({
      name,
      value,
    }))
    // Sort sectors by count descending
    sectors.sort((a, b) => b.value - a.value)

    // Leaderboard (Top 10 by score descending)
    const top10 = [...enrichedProjects]
    top10.sort((a: any, b: any) => b.score - a.score)
    const slicedTop10 = top10.slice(0, 10)

    return NextResponse.json({
      success: true,
      stats: {
        tiers: tiersCount,
        sectors,
        top10: slicedTop10,
      },
    })
  } catch (error: any) {
    console.error('Analytics GET API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memproses analitis.' }, { status: 500 })
  }
}
