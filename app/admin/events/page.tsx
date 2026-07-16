import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Role check - must be admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    // If not admin, redirect based on their role
    if (profile?.role === 'judge') {
      redirect('/ranking/ikm-besut-2026')
    } else {
      // Find project they own
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1)
        .maybeSingle()
      if (project) {
        redirect(`/project/${project.id}`)
      } else {
        redirect('/login')
      }
    }
  }

  // 3. Fetch data for stats and list
  // Fetch active event (we assume ikm-besut-2026 for the MVP)
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('slug', 'ikm-besut-2026')
    .single()

  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-navy-950 text-gray-100 min-h-screen">
        <h2 className="text-xl font-bold text-red-400">Pangkalan data tidak bersedia</h2>
        <p className="text-gray-400 mt-2">Sila jalankan migration SQL dahulu untuk membuat struktur pangkalan data.</p>
      </div>
    )
  }

  // Fetch all judges
  const { data: judges } = await supabase
    .from('judges')
    .select('*')
    .eq('event_id', event.id)

  // Fetch all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles(email)')
    .eq('event_id', event.id)
    .order('created_at', { ascending: false })

  // Fetch all scores
  const { data: scores } = await supabase
    .from('scores')
    .select('*')

  // Fetch all AI reports
  const { data: reports } = await supabase
    .from('ai_reports')
    .select('id, project_id, feasibility_score, feasibility_tier, generated_at')

  return (
    <AdminDashboardClient
      event={event}
      judges={judges || []}
      projects={projects || []}
      scores={scores || []}
      reports={reports || []}
      adminName={profile?.name || user.email || ''}
    />
  )
}
