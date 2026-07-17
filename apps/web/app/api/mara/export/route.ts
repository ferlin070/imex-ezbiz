import { logger } from '@/lib/logger'
import { requireRole } from '@/lib/auth/requireRole'
import { NextResponse } from 'next/server'
import { calculateFeasibility } from '@/lib/feasibility'

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['mara_officer', 'admin'])
    if (auth.error) {
      const status = auth.error.status
      const msg = status === 401 ? 'Tidak dibenarkan. Sila log masuk.' : 'Akses dinafikan. Anda bukan pegawai MARA yang sah.'
      return new Response(msg, { status })
    }
    const { user, supabase } = auth

    // 3. Fetch current officer shortlist
    const { data: shortlist, error: shortlistError } = await supabase
      .from('mara_shortlist')
      .select('*')
      .eq('officer_id', user.id)

    if (shortlistError) {
      logger.error('Export shortlist error:', shortlistError)
      return new Response('Gagal menarik data senarai pendek.', { status: 500 })
    }

    // Header row
    const headers = [
      'Nama Projek',
      'Sektor',
      'Negeri',
      'Institusi',
      'Skor Kebolehsanaan',
      'Tahap Kebolehsanaan',
      'Padanan Geran Terbaik',
      'Status Shortlist',
      'Nota Pegawai (Rahsia)',
      'Tarikh Kemaskini',
    ]

    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`
    const csvRows = [headers.map(escape).join(',')]

    if (shortlist && shortlist.length > 0) {
      const projectIds = shortlist.map((s: any) => s.project_id)

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, category, state, institution, event_id')
        .in('id', projectIds)

      // Fetch reports
      const { data: reports } = await supabase
        .from('ai_reports')
        .select('project_id, feasibility_score, feasibility_tier')
        .in('project_id', projectIds)

      // Fetch scores & criteria for fallback
      const { data: allScores } = await supabase
        .from('scores')
        .select('project_id, judge_id, criteria_id, score')
        .in('project_id', projectIds)

      const { data: allCriteria } = await supabase
        .from('criteria')
        .select('id, event_id, code, label, max_score, weight')

      // Fetch matches and schemes
      const { data: matches } = await supabase
        .from('grant_matches')
        .select('*')
        .in('project_id', projectIds)

      const { data: schemes } = await supabase
        .from('grant_schemes')
        .select('*')

      const projectsMap = new Map<string, any>((projects || []).map((p: any) => [p.id, p]))
      const reportsMap = new Map<string, any>((reports || []).map((r: any) => [r.project_id, r]))
      const schemesMap = new Map<string, any>((schemes || []).map((s: any) => [s.id, s]))

      // Group scores by project
      const scoresByProject = new Map<string, any[]>()
      if (allScores) {
        allScores.forEach((s: any) => {
          if (!scoresByProject.has(s.project_id)) {
            scoresByProject.set(s.project_id, [])
          }
          scoresByProject.get(s.project_id)!.push(s)
        })
      }

      // Group criteria by event
      const criteriaByEvent = new Map<string, any[]>()
      if (allCriteria) {
        allCriteria.forEach((c: any) => {
          if (!criteriaByEvent.has(c.event_id)) {
            criteriaByEvent.set(c.event_id, [])
          }
          criteriaByEvent.get(c.event_id)!.push(c)
        })
      }

      // Group matches by project to find the highest matching scheme
      const bestMatchByProject = new Map<string, any>()
      if (matches) {
        matches.forEach((m: any) => {
          const prevBest = bestMatchByProject.get(m.project_id)
          if (!prevBest || m.match_score > prevBest.match_score) {
            bestMatchByProject.set(m.project_id, m)
          }
        })
      }

      shortlist.forEach((item: any) => {
        const p = projectsMap.get(item.project_id)
        if (!p) return

        const r = reportsMap.get(item.project_id)
        let score = r?.feasibility_score ? Number(r.feasibility_score) : 0
        let tier = r?.feasibility_tier || 'Perlu Bimbingan'

        // Fallback score
        if (!r) {
          const projScores = scoresByProject.get(p.id) || []
          const eventCriteria = criteriaByEvent.get(p.event_id) || []
          if (projScores.length > 0) {
            const calc = calculateFeasibility(projScores, eventCriteria)
            score = calc.score
            tier = calc.tier
          }
        }

        // Best match details
        const bestMatch = bestMatchByProject.get(p.id)
        const bestScheme = bestMatch ? schemesMap.get(bestMatch.scheme_id) : null
        const matchText = bestScheme
          ? `${bestScheme.name} (${bestMatch.match_score}%)`
          : 'Tiada Padanan'

        // Format status to human-readable text
        let statusText = 'Berpotensi'
        if (item.status === 'dihubungi') statusText = 'Dihubungi'
        if (item.status === 'ditolak') statusText = 'Tidak Layak'
        if (item.status === 'diluluskan') statusText = 'Diluluskan'

        const row = [
          p.title,
          p.category || 'Lain-lain',
          p.state || 'Tidak Dinyatakan',
          p.institution || 'Tidak Dinyatakan',
          `${score}%`,
          tier,
          matchText,
          statusText,
          item.notes || '',
          new Date(item.updated_at || item.created_at).toLocaleDateString('ms-MY'),
        ]

        csvRows.push(row.map(escape).join(','))
      })
    }

    // Byte Order Mark (BOM) for Excel UTF-8 support
    const bom = '\uFEFF'
    const csvContent = bom + csvRows.join('\r\n')

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="senarai_pendek_mara.csv"',
      },
    })
  } catch (error: any) {
    logger.error('Export GET API exception:', error)
    return new Response('Ralat semasa mengeksport senarai pendek.', { status: 500 })
  }
}
