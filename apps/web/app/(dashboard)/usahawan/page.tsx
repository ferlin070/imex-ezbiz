import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Landmark, AlertCircle, FileText, ArrowRight, ShieldAlert, CheckCircle, HelpCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function UsahawanDashboard() {
  const supabase = await createClient()

  // 1. Resolve user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch projects (Business profiles)
  const { data: projects } = await supabase
    .from('projects')
    .select('*, business_profiles(*)')
    .eq('owner_user_id', user.id)

  const hasProfile = projects && projects.length > 0
  const project = hasProfile ? projects[0] : null

  // 3. Fetch loan applications
  let applications: any[] = []
  if (project) {
    const { data } = await supabase
      .from('loan_applications')
      .select('*, loan_products(name, profit_rate_percent)')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false })
    applications = data || []
  }

  const eligibilityStatusMap: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    LULUS: {
      label: 'LULUS KELAYAKAN ASAS',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-400',
      icon: CheckCircle
    },
    TIDAK_LULUS: {
      label: 'TIDAK MELEPASI SYARAT',
      bg: 'bg-rose-500/10 border-rose-500/20',
      text: 'text-rose-400',
      icon: AlertCircle
    },
    PERLU_TINDAKAN: {
      label: 'PERLU TINDAKAN',
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-400',
      icon: HelpCircle
    }
  }

  const officerStatusMap: Record<string, { label: string; color: string }> = {
    submitted: { label: 'Baharu (Dihantar)', color: 'text-slate-400' },
    under_review: { label: 'Dalam Semakan Pegawai', color: 'text-blue-400' },
    approved: { label: 'Pembiayaan Diluluskan', color: 'text-emerald-400' },
    rejected: { label: 'Ditolak Pegawai', color: 'text-rose-400' }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Konsol Kelayakan Usahawan
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Urus profil syarikat, semak kelayakan pembiayaan, dan terima cadangan pelan tindakan AI.
          </p>
        </div>

        {hasProfile ? (
          <Link
            href="/loans"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition shadow-lg shadow-teal-500/25 active:scale-95"
          >
            <Landmark className="h-4.5 w-4.5 text-slate-900" />
            Mohon Skim Pembiayaan
          </Link>
        ) : (
          <Link
            href="/register/direct"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition shadow-lg shadow-teal-500/25 active:scale-95"
          >
            <Plus className="h-5 w-5 text-slate-900" />
            Daftar Profil Syarikat (SSM)
          </Link>
        )}
      </div>

      {/* Business profile info block */}
      {project && project.business_profiles && (
        <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 backdrop-blur-sm space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                Profil SSM Aktif
              </span>
              <h2 className="text-xl font-bold text-slate-200 mt-2">{project.business_profiles.business_name}</h2>
              <p className="text-xs text-slate-400 mt-1">No. Pendaftaran SSM: {project.business_profiles.ssm_number}</p>
            </div>
            <Link
              href={`/project/${project.id}`}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
            >
              Urus Profil & Dokumen
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Applications list */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-200">Permohonan & Semakan Kelayakan MARA</h2>

        {!hasProfile ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
            Sila daftar profil syarikat/SSM anda terlebih dahulu sebelum memulakan semakan kelayakan pembiayaan.
          </div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
            Tiada permohonan skim dikemukakan lagi. Sila klik &quot;Mohon Skim Pembiayaan&quot; di atas untuk menyemak kelayakan anda secara automatik.
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              const eligConfig = eligibilityStatusMap[app.eligibility_status || 'TIDAK_LULUS'] || eligibilityStatusMap.TIDAK_LULUS
              const EligIcon = eligConfig.icon
              const officerConfig = officerStatusMap[app.status || 'submitted'] || officerStatusMap.submitted
              
              return (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-6 hover:border-slate-700/80 transition-all duration-300"
                >
                  {/* Top Header Card */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-200">{app.loan_products?.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Jumlah Dimohon: <span className="font-semibold text-slate-200">RM{Number(app.requested_amount_myr).toLocaleString()}</span> | 
                        Tempoh: <span className="font-semibold text-slate-200"> {app.requested_tenure_months} Bulan</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${eligConfig.bg} ${eligConfig.text}`}>
                        <EligIcon className="h-4 w-4" />
                        {eligConfig.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        Status Pegawai: <span className={`font-bold ${officerConfig.color}`}>{officerConfig.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Criteria details table/blocks if not LULUS */}
                  {app.eligibility_output && app.eligibility_output.criteria && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pecahan Semakan Kriteria Automatik:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {app.eligibility_output.criteria.map((c: any, index: number) => (
                          <div
                            key={index}
                            className={`p-3 rounded-xl border text-xs flex flex-col justify-between min-h-[80px] ${
                              c.passed
                                ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-300'
                                : 'bg-rose-500/5 border-rose-500/10 text-slate-300'
                            }`}
                          >
                            <span className="font-semibold text-slate-400 block truncate">{c.name}</span>
                            <div className="mt-2 flex justify-between items-center">
                              <span className="text-[10px] text-slate-500">{c.actual}</span>
                              <span className={`font-bold ${c.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {c.passed ? 'PASSED' : 'FAILED'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Action plan section */}
                  {app.ai_action_plan && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-850 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-teal-400" />
                        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Pelan Tindakan AI Penasihat (Action Plan):
                        </h4>
                      </div>
                      
                      {app.was_blocked_by_guardrail && (
                        <div className="p-3 mb-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                          Nota: Penapisan keselamatan domain (guardrails) telah diaplikasikan bagi memastikan cadangan kekal terhad dalam portfolio MARA.
                        </div>
                      )}

                      <div className="text-sm text-slate-350 leading-relaxed whitespace-pre-wrap font-sans">
                        {app.ai_action_plan}
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
