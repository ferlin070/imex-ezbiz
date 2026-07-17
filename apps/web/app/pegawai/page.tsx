import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Landmark, ShieldAlert, CheckCircle, AlertTriangle, XCircle, LogOut } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PegawaiDashboard() {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'mara_officer' && profile.role !== 'admin')) {
    redirect('/login')
  }

  // 3. Fetch all loan applications
  const { data: applications } = await supabase
    .from('loan_applications')
    .select(`
      id,
      requested_amount_myr,
      requested_tenure_months,
      status,
      created_at,
      eligibility_status,
      eligibility_output,
      ai_action_plan,
      was_blocked_by_guardrail,
      loan_product:loan_product_id ( name ),
      project:project_id (
        title,
        owner:owner_user_id ( name, email ),
        business_profile:business_profiles (
          business_name,
          ssm_number,
          owner_age,
          is_bumiputera,
          operating_since
        )
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Landmark className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Konsol Pegawai MARA</h1>
              <p className="text-xs text-slate-400">Penyemakan permohonan pembiayaan usahawan & laporan kelayakan AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Pegawai: {profile.name}</span>
              <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">MARA Officer</span>
            </div>
            <Link 
              href="/login" 
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Jumlah Permohonan</span>
            <span className="text-2xl font-extrabold text-white">{applications?.length || 0}</span>
          </div>
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Status LULUS</span>
            <span className="text-2xl font-extrabold text-teal-400">
              {applications?.filter((a: any) => a.eligibility_status === 'LULUS').length || 0}
            </span>
          </div>
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Status PERLU TINDAKAN</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {applications?.filter((a: any) => a.eligibility_status === 'PERLU_TINDAKAN').length || 0}
            </span>
          </div>
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Blocked By Guardrail</span>
            <span className="text-2xl font-extrabold text-rose-400">
              {applications?.filter((a: any) => a.was_blocked_by_guardrail).length || 0}
            </span>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-200">Senarai Permohonan Pembiayaan</h2>

          {!applications || applications.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950/40 border border-slate-905 text-slate-500 text-sm">
              Tiada permohonan pembiayaan usahawan dikemukakan setakat ini.
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((app: any) => {
                const project = app.project || {}
                const bizProfile = project.business_profile || {}
                const owner = project.owner || {}
                const checks = app.eligibility_output || {}

                return (
                  <div 
                    key={app.id} 
                    className="p-6 bg-slate-900/20 border border-slate-850 rounded-2xl space-y-6 hover:border-slate-800 transition"
                  >
                    {/* Main Row */}
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-850">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-base text-white">
                            {bizProfile.business_name || project.title || 'Syarikat Belum Dinamakan'}
                          </h3>
                          <span className="text-xs bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            SSM: {bizProfile.ssm_number || 'Tiada'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Pemohon: {bizProfile.owner_full_name || owner.name} ({owner.email})
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Skim Diminta</span>
                          <span className="text-sm font-extrabold text-slate-200">{app.loan_product?.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">Amaun & Tenure</span>
                          <span className="text-sm font-extrabold text-slate-200">
                            RM{Number(app.requested_amount_myr).toLocaleString()} ({app.requested_tenure_months} Bulan)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                          {app.eligibility_status === 'LULUS' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-teal-400" />
                              <span className="text-xs font-black text-teal-400">LULUS RULES</span>
                            </>
                          )}
                          {app.eligibility_status === 'TIDAK_LULUS' && (
                            <>
                              <XCircle className="w-4 h-4 text-rose-400" />
                              <span className="text-xs font-black text-rose-400">TIDAK LULUS</span>
                            </>
                          )}
                          {app.eligibility_status === 'PERLU_TINDAKAN' && (
                            <>
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                              <span className="text-xs font-black text-amber-400">PERLU TINDAKAN</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Breakdown & Recommendations Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Rules Engine Output */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hasil Semakan Rules Engine</h4>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-2.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Had Umur Pemilik (18 - 60):</span>
                            <span className={checks.agePassed ? "text-teal-400 font-bold" : "text-rose-400 font-bold"}>
                              {bizProfile.owner_age || '-'} Tahun ({checks.agePassed ? "Lepas" : "Gagal"})
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Status Bumiputera:</span>
                            <span className={checks.bumiputeraPassed ? "text-teal-400 font-bold" : "text-rose-400 font-bold"}>
                              {bizProfile.is_bumiputera ? 'Ya' : 'Bukan'} ({checks.bumiputeraPassed ? "Lepas" : "Gagal"})
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Pendaftaran SSM (Aktif):</span>
                            <span className={checks.ssmActivePassed ? "text-teal-400 font-bold" : "text-rose-400 font-bold"}>
                              {checks.ssmActivePassed ? "Aktif" : "Tidak Aktif/Gagal"}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Tempoh Matang Bisnes (Haul):</span>
                            <span className={checks.haulPassed ? "text-teal-400 font-bold" : "text-rose-400 font-bold"}>
                              {checks.haulDurationMonths !== undefined ? `${checks.haulDurationMonths} Bulan` : 'Gagal'} ({checks.haulPassed ? "Lepas" : "Gagal"})
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Dokumen Wajib Dimuat Naik:</span>
                            <span className={checks.documentsPassed ? "text-teal-400 font-bold" : "text-amber-400 font-bold"}>
                              {checks.documentsPassed ? "Lengkap" : "Tidak Lengkap"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Advisor Plan */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syor & Pelan Tindakan AI</h4>
                          {app.was_blocked_by_guardrail && (
                            <span className="flex items-center gap-1 text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-black">
                              <ShieldAlert className="w-3 h-3" />
                              Guardrail Blocked competitor leakage
                            </span>
                          )}
                        </div>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 text-xs text-slate-300 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                          {app.ai_action_plan || 'Tiada pelan tindakan AI dihasilkan.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
