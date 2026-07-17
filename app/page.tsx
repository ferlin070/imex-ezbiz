import Link from 'next/link'
import { Sparkles, Trophy, FileText, ChevronRight, BookOpen, Layers, ShieldCheck, Briefcase, Settings } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Main hero section */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center text-center gap-8 relative z-10">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Sistem Penilaian & Laporan AI TVET/IKM</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-teal-neon via-cyan-neon to-white bg-clip-text text-transparent">
            IMEX AI-Biz
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Menghubungkan inovasi teknikal usahawan TVET dengan pembiayaan geran kerajaan. Kami menukar keputusan festival kepada kertas cadangan perniagaan sedia-geran secara automatik.
          </p>
        </div>

        {/* Centralised Portals Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
          
          {/* Portal 1: Usahawan & Juri */}
          <div className="glass-card rounded-2xl border border-white/5 p-6 text-left flex flex-col gap-4 bg-gradient-to-br from-cyan-500/[0.01] to-transparent hover:border-cyan-500/30 transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Trophy className="w-5 h-5" />
              </span>
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30">
                Usahawan & Juri
              </span>
            </div>
            
            <div>
              <h3 className="font-black text-base text-white">Portal Usahawan & Juri</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Log masuk sebagai usahawan untuk urus projek, jana laporan SWOT/blueprint AI, atau sebagai juri untuk menilai projek secara digital.
              </p>
            </div>

            <div className="mt-auto pt-4 space-y-2.5">
              <Link
                href="/login"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-navy-950 font-black rounded-lg hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>Log Masuk Portal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/ranking/ikm-besut-2026"
                className="w-full py-2 bg-navy-900/60 border border-white/10 hover:border-cyan-500 text-cyan-400 rounded-lg text-xs font-semibold transition-all text-center block cursor-pointer"
              >
                Keputusan Live (Ranking)
              </Link>
            </div>
          </div>

          {/* Portal 2: Pegawai MARA (Scout Console) */}
          <div className="glass-card rounded-2xl border border-amber-500/20 p-6 text-left flex flex-col gap-4 bg-gradient-to-br from-amber-500/[0.02] to-transparent hover:border-amber-500/40 transition-all hover:scale-[1.01] relative">
            {/* Top Badge for VIP status */}
            <div className="absolute top-0 right-4 -translate-y-1/2 px-2.5 py-0.5 bg-amber-500 text-[#020617] text-[8px] font-black uppercase tracking-wider rounded-full shadow">
              UTAMA
            </div>

            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/30">
                Agensi Kerajaan
              </span>
            </div>

            <div>
              <h3 className="font-black text-base text-white">Portal Pegawai MARA</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Konsol khas pencarian prospek usahawan Bumiputera. Tapis mengikut tier kebolehsanaan, padankan skim geran mikro AI, dan urus senarai pendek pegawai.
              </p>
            </div>

            <div className="mt-auto pt-4">
              <Link
                href="/mara/login"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-[#020617] font-black rounded-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>Log Masuk Pegawai</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Portal 3: Pentadbir (Admin Console) */}
          <div className="glass-card rounded-2xl border border-white/5 p-6 text-left flex flex-col gap-4 bg-gradient-to-br from-purple-500/[0.01] to-transparent hover:border-purple-500/30 transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Settings className="w-5 h-5" />
              </span>
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/30">
                Sistem Urus Setia
              </span>
            </div>

            <div>
              <h3 className="font-black text-base text-white">Konsol Pentadbir IMEX</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Urus setian penilaian acara. Daftar maklumat juri/usahawan baharu, konfigurasi prompt sistem AI, dan urus rekod skim geran aktif.
              </p>
            </div>

            <div className="mt-auto pt-4 space-y-2.5">
              <Link
                href="/login"
                className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black rounded-lg hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>Urus Setia Pentadbir</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/admin/grant-schemes"
                className="w-full py-2 bg-navy-900/60 border border-white/10 hover:border-purple-500 text-purple-400 rounded-lg text-xs font-semibold transition-all text-center block cursor-pointer"
              >
                Urus Skim Geran (Admin)
              </Link>
            </div>
          </div>

        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-6">
          <div className="glass-card rounded-xl border border-white/5 p-5 text-left space-y-2">
            <div className="inline-block p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Trophy className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-200">100% Integriti Skor</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Skor kebolehsanaan dikira secara tulen daripada purata penilaian juri pakar, bukan rekaan atau anggaran AI.
            </p>
          </div>

          <div className="glass-card rounded-xl border border-white/5 p-5 text-left space-y-2">
            <div className="inline-block p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-200">Enjin Padanan Geran AI</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Pegawai MARA boleh menjana skor padanan usahawan dengan skim geran agensi secara automatik mengikut log audit keselamatan.
            </p>
          </div>

          <div className="glass-card rounded-xl border border-white/5 p-5 text-left space-y-2">
            <div className="inline-block p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-200">Laporan PDF Sedia Cetak</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Muat turun laporan komersial rasmi bersaiz A4 yang mesra format permohonan geran MARA, TEKUN, dan MDEC.
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-gray-600 font-semibold mt-auto relative z-10">
        <p>© 2026 IMEX AI-Biz. Hak Cipta Terpelihara.</p>
      </footer>
    </div>
  )
}
