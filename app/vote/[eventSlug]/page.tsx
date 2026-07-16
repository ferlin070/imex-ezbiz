import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VoteForm from './VoteForm'

interface PageProps {
  params: Promise<{ eventSlug: string }>
}

export default async function VotePage({ params }: PageProps) {
  const { eventSlug } = await params
  const supabase = await createClient()

  // Get current logged-in user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin/events')
  } else if (profile?.role !== 'judge') {
    redirect('/login')
  }

  // Get event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, slug')
    .eq('slug', eventSlug)
    .limit(1)
    .maybeSingle()

  if (eventError || !event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-navy-950 text-gray-100 min-h-screen">
        <h2 className="text-xl font-bold text-red-400">Acara Tidak Dijumpai</h2>
        <p className="text-gray-400 mt-2">Sila semak slug URL acara anda.</p>
      </div>
    )
  }

  // Get judge profile
  const { data: judge, error: judgeError } = await supabase
    .from('judges')
    .select('id, name, panel_label')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (judgeError || !judge) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-navy-950 text-gray-100 min-h-screen">
        <h2 className="text-xl font-bold text-red-400">Juri Tidak Berdaftar</h2>
        <p className="text-gray-400 mt-2">Akaun anda tidak dikaitkan dengan mana-mana panel juri untuk acara ini.</p>
      </div>
    )
  }

  // Get criteria
  const { data: criteria } = await supabase
    .from('criteria')
    .select('id, code, label, max_score, weight')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true })

  // Get projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, description, category, team_members')
    .eq('event_id', event.id)
    .order('title', { ascending: true })

  // Get existing scores by this judge to pre-populate
  const { data: existingScores } = await supabase
    .from('scores')
    .select('project_id, criteria_id, score')
    .eq('judge_id', judge.id)

  return (
    <VoteForm
      event={event}
      judge={judge}
      criteria={criteria || []}
      projects={projects || []}
      initialScores={existingScores || []}
    />
  )
}
