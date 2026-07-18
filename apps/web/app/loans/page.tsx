import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Landmark, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LoansPage() {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'entrepreneur' && profile.role !== 'admin')) {
    redirect('/login')
  }

  // 3. Fetch active loan products
  const { data: products } = await supabase
    .from('loan_products')
    .select('*')
    .eq('active', true)

  // 4. Fetch the entrepreneur's project/business profile
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, category')
    .eq('owner_user_id', user.id)
    .limit(1)
    .maybeSingle()

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Navigation / Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/usahawan"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Landmark className="w-6 h-6 text-mara-red" />
              Skim Pembiayaan & Pinjaman MARA
            </h1>
            <p className="text-xs text-slate-400">Pilih skim pembiayaan MARA yang bersesuaian dengan profil perniagaan anda.</p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-xs text-slate-400 block font-medium">Usahawan: {profile.name}</span>
          <span className="text-[10px] text-mara-gold font-bold block uppercase tracking-wider">Akaun Bumiputera</span>
        </div>
      </div>

      {/* Project Required Banner */}
      {!project && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm leading-relaxed space-y-3">
          <p>
            ⚠️ Anda belum mendaftar profil perniagaan syarikat anda. Sila lengkapkan pendaftaran profil syarikat/SSM terlebih dahulu sebelum membuat semakan permohonan pembiayaan MARA.
          </p>
          <Link
            href="/usahawan"
            className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Daftar Profil Syarikat Sekarang
          </Link>
        </div>
      )}

      {/* Main Grid: Info + List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left: Product List */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-200">Butiran Skim Pembiayaan Aktif</h2>
          
          {!products || products.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
              Tiada skim pembiayaan ditawarkan buat masa ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {products.map((p: any) => (
                <div
                  key={p.id}
                  className="p-6 bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-700/80 transition"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-extrabold text-base text-slate-200">{p.name}</h3>
                      <span className="text-xs bg-mara-red/10 border border-mara-red/20 text-mara-red px-2.5 py-1 rounded-lg font-bold shrink-0">
                        {p.profit_rate_percent}% Kadar Keuntungan
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">{p.description}</p>
                  </div>

                  <div className="space-y-4 pt-3 border-t border-slate-900 mt-auto">
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 font-bold uppercase">
                      <div>
                        Had Amaun: 
                        <span className="text-slate-300 block font-semibold mt-1">
                          RM{Number(p.min_amount_myr).toLocaleString()} - RM{Number(p.max_amount_myr).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        Tempoh Bayaran: 
                        <span className="text-slate-300 block font-semibold mt-1">
                          {p.min_tenure_months} - {p.max_tenure_months} Bulan
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {p.sector_tags?.map((tag: string) => (
                        <span key={tag} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase px-2 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {project ? (
                      <Link
                        href={`/loans/apply/${p.id}`}
                        className="w-full mt-2 py-3 bg-gradient-to-r from-mara-red to-mara-gold hover:from-mara-red/80 hover:to-mara-gold/80 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-mara-red/10"
                      >
                        <span>Pilih Skim & Semak Kelayakan</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full mt-2 py-3 bg-slate-900 border border-slate-850 text-slate-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        Daftar Profil Untuk Memohon
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info Panels */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl border border-white/5 p-6 bg-slate-950/20 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kelebihan Pembiayaan MARA</h3>
            <ul className="text-xs text-slate-400 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-mara-red shrink-0 mt-0.5" />
                <span>Kadar keuntungan rendah (3.5% - 4% setahun).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-mara-red shrink-0 mt-0.5" />
                <span>Jadual anjal dengan tempoh bayaran balik sehingga 7 tahun.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-mara-red shrink-0 mt-0.5" />
                <span>Tiada penjamin diperlukan untuk skim pembiayaan mikro.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
