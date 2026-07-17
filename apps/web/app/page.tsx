import Link from 'next/link'
import {
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Brain,
  FileSearch,
  CheckCircle2,
} from 'lucide-react'

const FEATURES = [
  {
    icon: FileSearch,
    title: 'Semakan Kelayakan Automatik',
    desc: 'Enjin peraturan deterministik menilai status SSM, haul perniagaan & dokumen secara telus tanpa campur tangan manual.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    icon: Brain,
    title: 'Penasihat AI MARA',
    desc: 'AI Gemini memberikan cadangan skim pembiayaan yang paling sesuai, pelan tindakan, dan penerangan keputusan dalam Bahasa Melayu.',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
  },
  {
    icon: ShieldCheck,
    title: 'Guardrail & Keselamatan',
    desc: 'Setiap cadangan AI disahkan oleh lapisan guardrail — halang respons luar skop, pastikan kepatuhan kepada dasar MARA.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
]

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-15%] right-[-12%] w-[55%] h-[55%] rounded-full bg-cyan-500/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[30%] h-[30%] rounded-full bg-cyan-400/3 blur-[100px] pointer-events-none" />

      {/* Main content */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-16 flex flex-col justify-center items-center text-center gap-10 relative z-10">

        {/* System badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/25 text-cyan-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Sistem Agentic AI — Penyemak &amp; Penasihat Kelayakan MARA</span>
        </div>

        {/* Hero title */}
        <div className="space-y-5">
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none bg-gradient-to-r from-teal-neon via-cyan-neon to-white bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,242,254,0.15)]">
            MARA AI-Advisor
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            Platform digital bersepadu untuk menilai kelayakan pinjaman dan geran MARA secara
            automatik — telus, adil, dan disokong oleh kecerdasan buatan.
          </p>
        </div>

        {/* Single CTA */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/login"
            id="btn-login"
            className="neon-border inline-flex items-center gap-2.5 px-10 py-3.5 bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 font-black text-sm uppercase tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(0,242,254,0.4)] transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            <span>Log Masuk</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <p className="text-[11px] text-gray-600">
            Satu log masuk untuk semua peranan — usahawan, pegawai &amp; pentadbir
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full mt-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`glass-card rounded-2xl border ${f.border} p-5 text-left flex flex-col gap-3 hover:scale-[1.01] transition-all`}
            >
              <span className={`p-2.5 rounded-xl ${f.bg} border ${f.border} ${f.color} self-start`}>
                <f.icon className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-white">{f.title}</h3>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
          {[
            'Rules Engine Deterministik',
            'Dipacu Gemini AI',
            'Selamat & Dienkripsi',
          ].map((label) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] text-gray-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-5 border-t border-white/5 text-center text-[10px] text-gray-700 relative z-10 bg-navy-950/80">
        &copy; 2026 MARA AI-Advisor. Hak Cipta Terpelihara. Dibangunkan untuk Korporat MARA Berhad.
      </footer>
    </div>
  )
}
