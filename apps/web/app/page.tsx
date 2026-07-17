import Link from 'next/link'
import { Sparkles, Trophy, FileText, ChevronRight, ShieldCheck, Briefcase, Settings } from 'lucide-react'

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
          <span>Sistem Agentic AI Penyemak & Penasihat Kelayakan Usahawan</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-teal-neon via-cyan-neon to-white bg-clip-text text-transparent">
            MARA AI-Advisor
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Menghubungkan perniagaan Bumiputera dengan geran dan skim pembiayaan MARA. Sistem deterministik menilai kelayakan SSM dan dokumen secara telus, disokong oleh AI Penasihat untuk langkah tindakan susulan.
          </p>
        </div>

        {/* Centralised Portals Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
          
          {/* Portal 1: Usahawan */}
          <div className="glass-card rounded-2xl border border-white/5 p-6 text-left flex flex-col gap-4 bg-gradient-to-br from-cyan-500/[0.01] to-transparent hover:border-cyan-500/30 transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Briefcase className="w-5 h-5" />
              </span>
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30">
                USAHAWAN MARA
              </span>
            </div>
            
            <div>
              <h3 className="font-black text-base text-white">Portal Usahawan</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Log masuk sebagai usahawan untuk mendaftar profil, memohon skim pembiayaan MARA, dan menyemak laporan kelayakan AI serta pelan tindakan.
              </p>
            </div>

            <div className="mt-auto pt-4">
              <Link
                href="/login"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-navy-950 font-black rounded-lg hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>Log Masuk Usahawan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Portal 2: Pegawai MARA (Scout Console) */}
          <div className="glass-card rounded-2xl border border-amber-500/20 p-6 text-left flex flex-col gap-4 bg-gradient-to-br from-amber-500/[0.02] to-transparent hover:border-amber-500/40 transition-all hover:scale-[1.01] relative">
            <div className="absolute top-0 right-4 -translate-y-1/2 px-2.5 py-0.5 bg-amber-500 text-[#020617] text-[8px] font-black uppercase tracking-wider rounded-full shadow">
              PEGAWAI
            </div>

            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/30">
                PEGAWAI MARA / PMN
              </span>
            </div>

            <div>
              <h3 className="font-black text-base text-white">Konsol Pegawai MARA</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Akses khas pegawai MARA daerah dan negeri untuk menyemak permohonan pembiayaan usahawan, status kelayakan, dan audit keputusan AI.
              </p>
            </div>

            <div className="mt-auto pt-4">
              <Link
                href="/mara/login"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-navy-950 font-black rounded-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>Log Masuk Pegawai</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Portal 3: Pentadbir Sistem (Admin Console) */}
          <div className="glass-card rounded-2xl border border-white/5 p-6 text-left flex flex-col gap-4 bg-gradient-to-br from-white/[0.01] to-transparent hover:border-white/20 transition-all hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <span className="p-2.5 rounded-xl bg-gray-500/10 border border-gray-500/20 text-gray-400">
                <Settings className="w-5 h-5" />
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                PENTADBIR
              </span>
            </div>

            <div>
              <h3 className="font-black text-base text-white">Urus Skim & Konfigurasi</h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Log masuk sebagai admin untuk mengemas kini kriteria rules kelayakan (JSON rules), menambah produk skim pembiayaan baru, dan mengakses audit logs.
              </p>
            </div>

            <div className="mt-auto pt-4">
              <Link
                href="/login"
                className="w-full py-2.5 bg-slate-900 border border-white/10 hover:border-white/30 text-white font-black rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider cursor-pointer"
              >
                <span>Akses Admin</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-white/5 text-center text-[10px] text-gray-600 relative z-10 bg-navy-950/80">
        &copy; 2026 MARA AI-Advisor. Hak Cipta Terpelihara.
      </footer>
    </div>
  )
}
