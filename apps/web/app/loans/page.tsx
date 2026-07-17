import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Landmark, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import LoanCalculatorWidget from '@/components/LoanCalculatorWidget'
import Link from 'next/link'

export default async function LoansPage() {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Role check - must be entrepreneur
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

  // 4. Fetch the entrepreneur's project to link to loan applications
  const { data: project } = await supabase
    .from('projects')
    .select('id, title, category')
    .eq('owner_user_id', user.id)
    .limit(1)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-teal-neon/5 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full z-10 space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            {project ? (
              <Link 
                href={`/project/${project.id}`}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            ) : null}
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Landmark className="w-6 h-6 text-teal-neon" />
                Skim Pembiayaan & Pinjaman MARA
              </h1>
              <p className="text-xs text-slate-400">Pilih skim pembiayaan dan simulasi jadual amortisasi bayaran balik anda</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Usahawan: {profile.name}</span>
            <span className="text-[10px] text-teal-neon font-bold block uppercase tracking-wider">Akaun Bumiputera</span>
          </div>
        </div>

        {/* Project Required Banner */}
        {!project && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
            ⚠️ Anda belum mendaftar perniagaan (projek) anda. Sila daftar profil perniagaan anda terlebih dahulu di menu utama sebelum membuat permohonan pinjaman MARA.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Left / Center: Calculator Widget */}
          <div className="md:col-span-2 space-y-6">
            <LoanCalculatorWidget 
              products={products || []} 
              onApply={project ? (productId, amount, tenure) => {
                // We'll redirect to the apply form page
                redirect(`/loans/apply/${productId}?amount=${amount}&tenure=${tenure}`)
              } : undefined}
            />
          </div>

          {/* Right: Schemes Listing Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="glass-card rounded-xl border border-white/5 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Kelebihan Pembiayaan MARA</h3>
              <ul className="text-xs text-slate-400 space-y-2.5 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-neon shrink-0 mt-0.5" />
                  <span>Kadar keuntungan rendah (3.5% - 4% setahun).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-neon shrink-0 mt-0.5" />
                  <span>Jadual anjal dengan tempoh bayaran balik sehingga 7 tahun.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-neon shrink-0 mt-0.5" />
                  <span>Tiada penjamin diperlukan untuk skim mikro (PUTRA).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Full Loan Schemes Details Section */}
        <div className="space-y-4 pt-4">
          <h2 className="text-lg font-bold text-white">Butiran Skim Pembiayaan Aktif</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products?.map((p: any) => (
              <div key={p.id} className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-extrabold text-sm text-white">{p.name}</h3>
                    <span className="text-[10px] bg-teal-neon/10 border border-teal-neon/20 text-teal-neon px-2 py-0.5 rounded font-black">
                      {p.profit_rate_percent}% Setahun
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/60 mt-auto">
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold uppercase">
                    <div>
                      Had Amaun: <span className="text-slate-300 block">RM{p.min_amount_myr.toLocaleString()} - RM{p.max_amount_myr.toLocaleString()}</span>
                    </div>
                    <div>
                      Tempoh Bayaran: <span className="text-slate-300 block">{p.min_tenure_months} - {p.max_tenure_months} Bulan</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {p.sector_tags.map((tag: string) => (
                      <span key={tag} className="text-[8px] bg-slate-950 border border-slate-800 text-slate-400 font-black uppercase px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {project && (
                    <Link
                      href={`/loans/apply/${p.id}`}
                      className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Pilih Skim ini</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
