import Link from 'next/link'
import { Sparkles, Trophy, FileText, ChevronRight, BookOpen, Layers } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      {/* Main hero section */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center text-center gap-8 relative z-10">
        
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
          <p className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Menghubungkan inovasi teknikal dengan potensi komersial. Kami menukar markah penilaian juri festival kepada laporan perniagaan sedia-geran secara automatik.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 font-black rounded-xl transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.5)] text-sm uppercase tracking-wider cursor-pointer"
          >
            <span>Log Masuk Portal</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/ranking/ikm-besut-2026"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-navy-900 border border-white/10 hover:border-teal-neon text-teal-neon rounded-xl text-sm font-semibold transition-all hover:bg-teal-neon/5 cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
            <span>Keputusan Live (Ranking)</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-10">
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
            <div className="inline-block p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-neon">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-gray-200">Analisis SWOT & Pitch</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Penjanaan SWOT, 3-seksyen blueprint komersial, dan skrip pitching 60-saat (Hook-Problem-Solution-CTA) menggunakan Gemini AI.
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
