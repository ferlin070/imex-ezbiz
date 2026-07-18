import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
  const { data: rawProject, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, category, team_members, owner_user_id, mara_visible, entry_type')
    .eq('id', projectId)
    .limit(1)
    .maybeSingle()

  const project = rawProject ? {
    ...rawProject,
    event_id: null,
    state: '',
    institution: '',
    score_source: 'direct',
    application_status: 'submitted'
  } : null

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

  // 4. Fetch latest loan application to display rule engine results on project dashboard
  const { data: latestApp } = await supabase
    .from('loan_applications')
    .select('eligibility_status, eligibility_output')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let feasibilityResult: {
    score: number
    tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan'
    criteriaBreakdown: any[]
  } = {
    score: 0,
    tier: 'Perlu Bimbingan',
    criteriaBreakdown: []
  }

  if (latestApp && latestApp.eligibility_output && (latestApp.eligibility_output as any).criteria) {
    const criteriaList = (latestApp.eligibility_output as any).criteria as any[]
    const passedCount = criteriaList.filter(c => c.passed).length
    const totalCount = criteriaList.length || 5
    const score = Math.round((passedCount / totalCount) * 100)
    
    let tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan' = 'Perlu Bimbingan'
    if (score >= 80) tier = 'Sangat Berpotensi'
    else if (score >= 60) tier = 'Layak Komersial'
    else if (score >= 40) tier = 'Berpotensi Sederhana'

    feasibilityResult = {
      score,
      tier,
      criteriaBreakdown: criteriaList.map(c => ({
        criteriaId: c.name,
        code: c.name,
        label: c.name,
        average: c.passed ? 10 : 0,
        percentage: c.passed ? 100 : 0,
        max_score: 10
      }))
    }
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
