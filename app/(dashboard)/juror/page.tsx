import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Trophy, Award, ClipboardCheck, ArrowRight, ShieldAlert, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function JurorDashboardPage() {
  const supabase = await createClient()

  // 1. Resolve user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch events assigned to this juror
  const { data: assignments } = await supabase
    .from('jury_assignments')
    .select('*, events:event_id(id, name, status)')
    .eq('user_id', user.id)

  const assignedEventIds = (assignments || []).map((a: any) => a.event_id)

  if (assignedEventIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-slate-950/40 border border-slate-800 backdrop-blur-sm">
        <Trophy className="h-16 w-16 text-slate-600 mb-4 stroke-1 animate-pulse" />
        <h3 className="text-lg font-bold text-slate-300">Belum Dilantik</h3>
        <p className="text-slate-500 text-sm max-w-sm mt-2">
          Anda belum dilantik sebagai juri untuk sebarang event aktif. Hubungi admin untuk mendapatkan lantikan juri.
          </p>
      </div>
    )
  }

  // 3. Fetch projects belonging to these events
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, events:event_id(name)')
    .in('event_id', assignedEventIds)
    .order('created_at', { ascending: false })

  // 4. Fetch evaluations submitted by this juror
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*')
    .eq('jury_id', user.id)

  const evaluationMap = new Map((evaluations || []).map((e: any) => [e.project_id, e]))

  const projStatusLabels: Record<string, string> = {
    draft: 'Draf',
    submitted: 'Dihantar',
    shortlisted: 'Senarai Pendek',
    approved: 'Diluluskan',
    rejected: 'Ditolak',
  }

  const projStatusClasses: Record<string, string> = {
    draft: 'bg-slate-850 text-slate-400 border-slate-700',
    submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    shortlisted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-8 w-8 text-teal-400" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Konsol Penilaian Juri
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Urus penilaian inovasi projek usahawan bagi event yang anda dipertanggungjawabkan.
          </p>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <ShieldAlert className="h-5 w-5" />
          <span>Gagal memuatkan senarai projek penilaian.</span>
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
          Tiada projek yang didaftarkan untuk event lantikan anda lagi.
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-200">Projek Sedia Dinilai</h2>
          
          <div className="grid gap-4">
            {projects.map((proj: any) => {
              const userEval = evaluationMap.get(proj.id) as any
              const hasEvaluated = !!userEval
              const isShortlisted = proj.status === 'shortlisted'

              return (
                <div
                  key={proj.id}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    hasEvaluated 
                      ? 'bg-slate-950/20 border-slate-850'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-200 text-md">{proj.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${projStatusClasses[proj.status || 'submitted']}`}>
                        {projStatusLabels[proj.status || 'submitted']}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{proj.description}</p>
                    <div className="flex flex-wrap gap-4 text-[10px] text-slate-500">
                      <span>Event: {proj.events?.name || 'IMEX Event'}</span>
                      <span>Kategori: {proj.category}</span>
                    </div>
                  </div>

                  {/* Actions / Evaluation status */}
                  <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
                    {hasEvaluated ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400">Telah Dinilai: {userEval.score}%</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Menunggu Penilaian</span>
                    )}

                    <Link
                      href={`/juror/evaluate/${proj.id}`}
                      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl transition duration-200 ${
                        hasEvaluated
                          ? 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-850'
                          : 'text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-md shadow-teal-500/10'
                      }`}
                    >
                      {hasEvaluated ? 'Kemaskini Markah' : 'Nilai Inovasi'}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
