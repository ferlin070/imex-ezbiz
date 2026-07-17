import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateFeasibility } from '@/lib/feasibility'
import CandidateProfileClient from './CandidateProfileClient'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function CandidatePage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  // 1. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/mara/login')
  }

  // 2. Verify role: admin or mara_officer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'mara_officer' && profile.role !== 'admin')) {
    redirect('/mara/login')
  }

  // 3. Fetch project details (must be mara_visible = true OR entry_type = 'direct')
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, category, team_members, event_id, owner_user_id, mara_visible, state, institution, entry_type, score_source, application_status')
    .eq('id', projectId)
    .limit(1)
    .maybeSingle()

  if (projectError || !project || (!project.mara_visible && project.entry_type !== 'direct')) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#020617] text-gray-100 min-h-screen">
        <h2 className="text-xl font-bold text-red-400">Profil Calon Tidak Dijumpai</h2>
        <p className="text-gray-400 mt-2">Usahawan ini mungkin tidak membenarkan perkongsian profil, atau projek telah dipadamkan.</p>
        <a href="/search" className="mt-4 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-slate-300 hover:text-white">
          Kembali ke Carian
        </a>
      </div>
    )
  }

  // 4. Log the access in audit log
  const { error: logError } = await supabase
    .from('mara_access_log')
    .insert({
      officer_id: user.id,
      project_id: projectId,
      resource_type: 'project'
    })

  if (logError) {
    console.warn('Gagal merekod log audit akses pegawai MARA:', logError)
  }

  // 5. Fetch scores and criteria to calculate feasibility
  let feasibilityResult = null
  if (project.entry_type === 'direct') {
    const { data: selfAss } = await supabase
      .from('self_assessments')
      .select('*')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle()

    if (selfAss) {
      const { calculateSelfAssessment } = require('@/lib/selfAssessment')
      const calc = calculateSelfAssessment(selfAss.responses)
      feasibilityResult = {
        score: calc.score,
        tier: calc.tier,
        criteriaBreakdown: calc.breakdown.map((b: any) => ({
          criteriaId: b.criteriaCode,
          code: b.criteriaCode,
          label: b.label,
          average: b.score,
          percentage: (b.score / b.maxScore) * 100,
          max_score: b.maxScore
        }))
      }
    } else {
      feasibilityResult = {
        score: 0,
        tier: 'Perlu Bimbingan',
        criteriaBreakdown: []
      }
    }
  } else {
    const { data: scores } = await supabase
      .from('scores')
      .select('*')
      .eq('project_id', projectId)

    const { data: criteria } = await supabase
      .from('criteria')
      .select('*')
      .eq('event_id', project.event_id)

    feasibilityResult = calculateFeasibility(scores || [], criteria || [])
  }

  // 6. Fetch existing AI report
  const { data: initialReport } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle()

  // 7. Fetch active grant schemes
  const { data: schemes } = await supabase
    .from('grant_schemes')
    .select('*')
    .eq('active', true)

  // 8. Fetch existing grant matches
  const { data: initialMatches } = await supabase
    .from('grant_matches')
    .select('*')
    .eq('project_id', projectId)

  // Enrich initial matches with scheme details
  const schemesMap = new Map<string, any>((schemes || []).map((s: any) => [s.id, s]))
  const enrichedMatches = (initialMatches || []).map((m: any) => {
    const scheme = schemesMap.get(m.scheme_id)
    return {
      ...m,
      scheme_name: scheme?.name || 'Skim Geran',
      scheme_agency: scheme?.agency || 'MARA',
      scheme_max_amount: scheme?.max_amount_myr || 0,
    }
  })

  // Sort by score descending
  enrichedMatches.sort((a: any, b: any) => b.match_score - a.match_score)

  // 9. Fetch officer's shortlist status & notes for this candidate
  const { data: shortlistEntry } = await supabase
    .from('mara_shortlist')
    .select('*')
    .eq('officer_id', user.id)
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle()

  return (
    <CandidateProfileClient
      project={project}
      feasibilityResult={feasibilityResult}
      initialReport={initialReport}
      initialMatches={enrichedMatches}
      shortlistEntry={shortlistEntry || null}
      schemes={schemes || []}
      userName={profile.name}
    />
  )
}
