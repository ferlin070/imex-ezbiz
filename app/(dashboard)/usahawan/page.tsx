import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Award, Loader2, ClipboardCheck, ArrowRight, ShieldAlert } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UsahawanDashboard() {
  const supabase = await createClient()

  // Resolve user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch entrepreneur projects
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch all evaluations
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*')

  const statusMap: Record<string, { label: string; bg: string; text: string; desc: string }> = {
    draft: {
      label: 'Draf',
      bg: 'bg-amber-500/10 border-amber-500/30',
      text: 'text-amber-400',
      desc: 'Projek masih dalam penyuntingan dan belum dihantar.',
    },
    submitted: {
      label: 'Dihantar',
      bg: 'bg-blue-500/10 border-blue-500/30',
      text: 'text-blue-400',
      desc: 'Projek telah dihantar dan sedang disemak oleh urus setia.',
    },
    shortlisted: {
      label: 'Senarai Pendek',
      bg: 'bg-purple-500/10 border-purple-500/30',
      text: 'text-purple-400',
      desc: 'Projek disenarai pendek dan sedia dinilai oleh juri.',
    },
    approved: {
      label: 'Diluluskan',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      text: 'text-emerald-400',
      desc: 'Projek telah berjaya dinilai dan diluluskan!',
    },
    rejected: {
      label: 'Ditolak',
      bg: 'bg-rose-500/10 border-rose-500/30',
      text: 'text-rose-400',
      desc: 'Projek ditolak atau memerlukan bimbingan tambahan.',
    },
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Projek & Inovasi Saya
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Urus pendaftaran inovasi anda dan pantau keputusan penilaian juri di sini.
          </p>
        </div>
        <Link
          href="/usahawan/projek/daftar"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 active:scale-95"
        >
          <Plus className="h-5 w-5 text-slate-900" />
          Daftar Projek Baru
        </Link>
      </div>

      {/* Projects List Grid */}
      {error ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <ShieldAlert className="h-5 w-5" />
          <span>Gagal memuatkan senarai projek. Sila cuba lagi.</span>
        </div>
      ) : !projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 rounded-3xl bg-slate-950/40 border border-slate-800/80 backdrop-blur-sm">
          <Award className="h-16 w-16 text-slate-600 mb-4 stroke-1 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-300">Tiada Projek Didaftarkan</h3>
          <p className="text-slate-500 text-sm max-w-sm mt-2">
            Anda belum mendaftarkan sebarang projek perniagaan atau inovasi lagi. Mulakan dengan menekan butang daftar di atas.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {projects.map((proj: any) => {
            const statusConfig = statusMap[proj.status || 'submitted'] || statusMap.submitted
            
            // Calculate evaluations count and score average for this project
            const projEvals = (evaluations || []).filter((e: any) => e.project_id === proj.id)
            const evalCount = projEvals.length
            const avgScore = evalCount > 0 
              ? Math.round(projEvals.reduce((acc: number, curr: any) => acc + Number(curr.score), 0) / evalCount)
              : null

            return (
              <div
                key={proj.id}
                className="flex flex-col p-6 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 transition-all duration-300 relative group overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-teal-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-125"></div>
                
                {/* Top Details */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                    {proj.category || 'Inovasi'}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-400 transition-colors mb-2 line-clamp-1">
                  {proj.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1">
                  {proj.description || 'Tiada keterangan projek.'}
                </p>

                {/* Evaluations Section */}
                <div className="mt-auto pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-slate-500" />
                    <span className="text-xs text-slate-400">
                      {evalCount > 0 ? `${evalCount} Penilaian Juri` : 'Belum dinilai juri'}
                    </span>
                  </div>
                  {avgScore !== null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">Purata Skor:</span>
                      <span className="text-sm font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                        {avgScore}%
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Actions / Info */}
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/project/${proj.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-slate-100 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-xl transition-all duration-200"
                  >
                    Buka Dashboard Projek
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
