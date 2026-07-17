import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import EventManageClient from './EventManageClient'

export const dynamic = 'force-dynamic'

export default async function AdminEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Fetch Event Details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (eventError || !event) {
    notFound()
  }

  // 2. Fetch Projects registered under this event
  const { data: projects } = await supabase
    .from('projects')
    .select('*, profiles:owner_user_id(name, email)')
    .eq('event_id', id)

  // 3. Fetch Jury Assignments for this event
  const { data: assignments } = await supabase
    .from('jury_assignments')
    .select('*, profiles:user_id(id, name, email)')
    .eq('event_id', id)

  // 4. Fetch all available Judge Profiles in the system
  const { data: availableJudges } = await supabase
    .from('profiles')
    .select('id, name, email')
    .eq('role', 'judge')

  // 5. Fetch evaluations for these projects to display score averages
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*')

  const mappedAssignments = (assignments || []).map((a: any) => ({
    id: a.id,
    user_id: a.user_id,
    role: a.role,
    assigned_at: a.assigned_at,
    name: a.profiles?.name || 'Juri Tanpa Nama',
    email: a.profiles?.email || '',
  }))

  const mappedProjects = (projects || []).map((p: any) => {
    const projEvals = (evaluations || []).filter((e) => e.project_id === p.id)
    const evalCount = projEvals.length
    const avgScore = evalCount > 0 
      ? Math.round(projEvals.reduce((acc, curr) => acc + Number(curr.score), 0) / evalCount)
      : null

    return {
      ...p,
      owner_name: p.profiles?.name || 'Usahawan Tanpa Nama',
      owner_email: p.profiles?.email || '',
      avg_score: avgScore,
      eval_count: evalCount
    }
  })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/admin/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Pengurusan Event
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-teal-400" />
        <div>
          <h1 className="text-2xl font-extrabold text-slate-200">{event.name}</h1>
          <p className="text-xs text-slate-400 mt-1">Urus status, lantikan juri, dan senarai pendek projek.</p>
        </div>
      </div>

      <EventManageClient
        event={event}
        projects={mappedProjects}
        assignments={mappedAssignments}
        availableJudges={availableJudges || []}
      />
    </div>
  )
}
