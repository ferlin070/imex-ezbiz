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

  // 2. Fetch user role first (needed for authorization)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const isMara = profile?.role === 'mara_officer' || profile?.role === 'admin'

  // 3. Fetch project — RLS allows: owner OR mara_officer OR admin
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, description, category, team_members, owner_user_id, mara_visible')
    .eq('id', projectId)
    .limit(1)
    .maybeSingle()

  if (projectError || !project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-gray-100 min-h-screen">
        <h2 className="text-xl font-bold text-red-400">Projek Tidak Dijumpai</h2>
        <p className="text-gray-400 mt-2">
          Projek ini tidak wujud atau anda tidak mempunyai akses.
        </p>
        <a href={isMara ? '/pegawai' : '/usahawan'} className="mt-4 text-xs text-slate-400 underline">
          ← Kembali ke Dashboard
        </a>
      </div>
    )
  }

  // 4. Authorization: owner OR mara_officer OR admin only
  const isOwner = project.owner_user_id === user.id
  if (!isOwner && !isMara) {
    redirect(isMara ? '/pegawai' : '/usahawan')
  }

  // 5. Fetch latest loan application for eligibility/feasibility display
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

  if (latestApp?.eligibility_output && (latestApp.eligibility_output as any).criteria) {
    const criteriaList = (latestApp.eligibility_output as any).criteria as any[]
    const passedCount = criteriaList.filter((c: any) => c.passed).length
    const totalCount = criteriaList.length || 5
    const score = Math.round((passedCount / totalCount) * 100)

    let tier: typeof feasibilityResult['tier'] = 'Perlu Bimbingan'
    if (score >= 80) tier = 'Sangat Berpotensi'
    else if (score >= 60) tier = 'Layak Komersial'
    else if (score >= 40) tier = 'Berpotensi Sederhana'

    feasibilityResult = {
      score,
      tier,
      criteriaBreakdown: criteriaList.map((c: any) => ({
        criteriaId: c.name,
        code: c.name,
        label: c.name,
        average: c.passed ? 10 : 0,
        percentage: c.passed ? 100 : 0,
        max_score: 10,
      })),
    }
  }

  // 6. Fetch existing cached AI report
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
