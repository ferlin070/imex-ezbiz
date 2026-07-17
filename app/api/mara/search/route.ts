import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { calculateFeasibility } from '@/lib/feasibility'

const searchSchema = z.object({
  tier: z.string().optional(),
  sector: z.string().optional(),
  state: z.string().optional(),
  query: z.string().optional(),
})

export async function POST(request: Request) {
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

    // 3. Parse and validate filters
    const body = await request.json().catch(() => ({}))
    const parsed = searchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input tapisan.', details: parsed.error.format() }, { status: 400 })
    }

    const { tier, sector, state, query } = parsed.data

    // 4. Fetch all projects where mara_visible = true OR entry_type = 'direct'
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .or('mara_visible.eq.true,entry_type.eq.direct')

    if (projectsError) {
      console.error('Fetch projects error:', projectsError)
      return NextResponse.json({ error: 'Gagal menarik data projek.' }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ success: true, projects: [] })
    }

    // 5. Fetch all reports to match feasibility scores and tiers
    const projectIds = projects.map((p: any) => p.id)
    const { data: reports } = await supabase
      .from('ai_reports')
      .select('*')
      .in('project_id', projectIds)

    const reportsMap = new Map()
    reports?.forEach((r: any) => {
      reportsMap.set(r.project_id, r)
    })

    // Fetch all self_assessments for direct projects
    const { data: selfAssessments } = await supabase
      .from('self_assessments')
      .select('project_id, computed_score')
      .in('project_id', projectIds)

    const selfAssessmentsMap = new Map()
    selfAssessments?.forEach((sa: any) => {
      selfAssessmentsMap.set(sa.project_id, Number(sa.computed_score))
    })

    // Fetch all scores for the projects to calculate feasibility score in case reports are missing
    const { data: allScores } = await supabase
      .from('scores')
      .select('*')
      .in('project_id', projectIds)

    const { data: allCriteria } = await supabase
      .from('criteria')
      .select('*')

    const scoresByProject = new Map()
    allScores?.forEach((s: any) => {
      if (!scoresByProject.has(s.project_id)) {
        scoresByProject.set(s.project_id, [])
      }
      scoresByProject.get(s.project_id).push(s)
    })

    // 6. Map and Filter results
    let results = projects.map((p: any) => {
      const report = reportsMap.get(p.id)
      let score = report?.feasibility_score ? Number(report.feasibility_score) : 0
      let tier = report?.feasibility_tier || 'Perlu Bimbingan'

      // Fallback calculation if no AI report generated yet
      if (!report) {
        if (p.entry_type === 'direct') {
          score = selfAssessmentsMap.get(p.id) || 0
          if (score >= 80) tier = 'Sangat Berpotensi'
          else if (score >= 60) tier = 'Layak Komersial'
          else if (score >= 40) tier = 'Berpotensi Sederhana'
          else tier = 'Perlu Bimbingan'
        } else {
          const projScores = scoresByProject.get(p.id) || []
          const projCriteria = allCriteria || []
          if (projScores.length > 0) {
            const calc = calculateFeasibility(projScores, projCriteria)
            score = calc.score
            tier = calc.tier
          }
        }
      }

      return {
        id: p.id,
        event_id: p.event_id,
        title: p.title,
        description: p.description || '',
        category: p.category || 'Lain-lain',
        state: p.state || 'Tidak Dinyatakan',
        institution: p.institution || 'Tidak Dinyatakan',
        feasibility_score: score,
        feasibility_tier: tier,
        entry_type: p.entry_type,
        score_source: p.score_source
      }
    })

    // Apply filters in memory for consistent behavior on both mock and real db
    if (sector && sector !== 'all') {
      results = results.filter((r: any) => r.category.toLowerCase() === sector.toLowerCase())
    }

    if (state && state !== 'all') {
      results = results.filter((r: any) => r.state.toLowerCase() === state.toLowerCase())
    }

    if (tier && tier !== 'all') {
      results = results.filter((r: any) => r.feasibility_tier.toLowerCase() === tier.toLowerCase())
    }

    if (query) {
      const q = query.toLowerCase()
      results = results.filter((r: any) => 
        r.title.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) ||
        r.institution.toLowerCase().includes(q)
      )
    }

    // Sort by feasibility_score descending
    results.sort((a: any, b: any) => b.feasibility_score - a.feasibility_score)

    return NextResponse.json({ success: true, projects: results })
  } catch (error: any) {
    console.error('Search API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memproses carian.' }, { status: 500 })
  }
}
