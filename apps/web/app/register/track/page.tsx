'use client'

import { useRouter } from 'next/navigation'
import { Award, Landmark, ArrowRight, ShieldCheck } from 'lucide-react'

export default function RegisterTrackPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-sm text-blue-400 mb-4">
            <ShieldCheck className="w-4 h-4" />
            Sistem Pendaftaran Pintar IMEX-EzBiz
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
            Pilih Laluan Pendaftaran Anda
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Sila pilih mod pendaftaran yang sesuai untuk memulakan profil usahawan anda di platform kami.
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Track A: Competition */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 p-8 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Laluan A: Sertai Pertandingan</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Pendaftaran untuk menyertai festival inovasi atau pertandingan IKM Besut 2026. Projek anda akan dinilai secara rasmi oleh panel juri profesional untuk memperoleh skor kebolehsanaan pertandingan.
              </p>
              <ul className="space-y-2 text-sm text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Skor Kebolehsanaan disahkan oleh Juri
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Layak menyertai ranking & anugerah festival
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Automatik sedia untuk saringan MARA selepas tamat acara
                </li>
              </ul>
            </div>
            <button
              onClick={() => router.push('/login')} // Redirect to login/signup for standard flow
              className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 group-hover:border-blue-500/30"
            >
              Mulai Laluan Pertandingan
              <ArrowRight className="w-4 h-4 text-blue-400" />
            </button>
          </div>

          {/* Track B: Direct Application */}
          <div className="group relative rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-500/50 p-8 transition-all duration-300 flex flex-col justify-between backdrop-blur-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-400/5 rounded-full blur-2xl group-hover:bg-slate-400/10 transition-all pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-6">
                <Landmark className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Laluan B: Mohon Terus ke MARA</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Sesuai untuk usahawan yang tidak menyertai sebarang pertandingan tetapi ingin memohon skim geran dan bantuan pembiayaan pinjaman MARA secara terus dengan mengisi profil perniagaan yang lengkap.
              </p>
              <ul className="space-y-2 text-sm text-slate-400 mb-8">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Skor Kebolehsanaan berasaskan Penilaian Kendiri
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Penyimpanan profil perniagaan & dokumen SSM lengkap
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Terus dihantar ke peti masuk saringan Pegawai MARA
                </li>
              </ul>
            </div>
            <button
              onClick={() => router.push('/register/direct')}
              className="w-full py-3.5 px-4 bg-slate-200 hover:bg-white text-slate-950 font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              Mulai Laluan Terus MARA
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-slate-500">
          <p>Mempunyai akaun? <a href="/login" className="text-blue-400 hover:underline">Log Masuk di sini</a></p>
        </div>
      </div>
    </div>
  )
}
