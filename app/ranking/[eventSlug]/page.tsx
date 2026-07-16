import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RankingView from './RankingView'

interface PageProps {
  params: Promise<{ eventSlug: string }>
}

export default async function RankingPage({ params }: PageProps) {
  const { eventSlug } = await params
  const supabase = await createClient()

  // Get current logged-in user session
  const { data: { user } } = await supabase.auth.getUser()

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

  // Get criteria
  const { data: criteria } = await supabase
    .from('criteria')
    .select('id, code, label, max_score, weight')
    .eq('event_id', event.id)
    .order('sort_order', { ascending: true })

  // Get all projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, category, team_members, owner_user_id')
    .eq('event_id', event.id)

  // Get all scores for this event (via projects)
  const projectIds = (projects || []).map((p: any) => p.id)
  let scores: any[] = []
  if (projectIds.length > 0) {
    const { data: scoresData } = await supabase
      .from('scores')
      .select('project_id, judge_id, criteria_id, score')
      .in('project_id', projectIds)
    scores = scoresData || []
  }

  // Get the total count of judges for this event to display "Panel Penilai voted"
  const { count: totalJudgesCount } = await supabase
    .from('judges')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', event.id)

  return (
    <RankingView
      event={event}
      criteria={criteria || []}
      projects={projects || []}
      initialScores={scores}
      totalJudges={totalJudgesCount || 0}
      userRole={user ? 'authenticated' : 'anonymous'}
    />
  )
}
