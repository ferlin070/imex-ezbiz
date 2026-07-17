import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trophy } from 'lucide-react'
import EvaluateForm from './EvaluateForm'

export const dynamic = 'force-dynamic'

export default async function JurorEvaluateProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const supabase = await createClient()
  const { projectId } = await params

  // 1. Resolve user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch Project Details
  const { data: project, error } = await supabase
    .from('projects')
    .select('*, events:event_id(name)')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    notFound()
  }

  // 3. Fetch Existing Evaluation by this juror
  const { data: existingEval } = await supabase
    .from('evaluations')
    .select('*')
    .eq('project_id', projectId)
    .eq('jury_id', user.id)
    .maybeSingle()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <div>
        <Link
          href="/juror"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Konsol Penilaian
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-teal-400" />
        <div>
          <h1 className="text-2xl font-extrabold text-slate-200">Penilaian Inovasi</h1>
          <p className="text-xs text-slate-400 mt-1">Urus pemberian markah dan ulasan juri penilai.</p>
        </div>
      </div>

      {/* Project details card */}
      <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400 uppercase">
            {project.category}
          </span>
          <span className="text-[10px] text-slate-500">Event: {project.events?.name}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">{project.title}</h2>
        <p className="text-sm text-slate-400">{project.description}</p>
        {project.team_members && project.team_members.length > 0 && (
          <div className="text-[11px] text-slate-500">
            Ahli Kumpulan: {project.team_members.join(', ')}
          </div>
        )}
      </div>

      <EvaluateForm
        projectId={projectId}
        initialScore={existingEval?.score !== undefined ? Number(existingEval.score) : 50}
        initialComment={existingEval?.comment || ''}
      />
    </div>
  )
}
