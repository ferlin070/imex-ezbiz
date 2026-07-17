import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateFeasibility } from '@/lib/feasibility'
import ProjectDashboardClient from './ProjectDashboardClient'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch project metadata
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, category, team_members, event_id, owner_user_id, mara_visible, state, institution, entry_type, score_source, application_status')
    .eq('id', projectId)
    .limit(1)
    .maybeSingle()

  if (projectError || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-navy-950 text-gray-100 min-h-screen">
        <h2 className="text-xl font-bold text-red-400">Projek Tidak Dijumpai</h2>
        <p className="text-gray-400 mt-2">Sila hubungi urus setia acara jika ini adalah satu ralat.</p>
      </div>
    )
  }

  // 3. Authorization check: must be owner of the project, a judge, or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const isOwner = project.owner_user_id === user.id
  const isAdmin = profile?.role === 'admin'
  
  let isJudge = false
  if (profile?.role === 'judge') {
    const { data: judge } = await supabase
      .from('judges')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', project.event_id)
      .limit(1)
      .maybeSingle()
    if (judge) isJudge = true
  }

  if (!isOwner && !isAdmin && !isJudge) {
    // If entrepreneur logs in but doesn't own this project
    redirect('/login')
  }

  // 4. Fetch criteria & scores to calculate feasibility score server-side
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
    const { data: criteria } = await supabase
      .from('criteria')
      .select('id, code, label, max_score, weight')
      .eq('event_id', project.event_id)

    const { data: scores } = await supabase
      .from('scores')
      .select('project_id, judge_id, criteria_id, score')
      .eq('project_id', projectId)

    feasibilityResult = calculateFeasibility(scores || [], criteria || [])
  }

  // 5. Fetch existing cached AI report (if it exists)
  const { data: report } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('project_id', projectId)
    .limit(1)
    .maybeSingle()

  return (
    <ProjectDashboardClient
      project={project}
      feasibilityResult={feasibilityResult}
      initialReport={report}
      userName={profile?.name || user.email || ''}
    />
  )
}
