'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Search, Award, MapPin, Loader2, ArrowRight, BookOpen, LogOut, MessageSquare, ClipboardList } from 'lucide-react'
import ExportButton from '@/components/ExportButton'
import SelfDeclaredBadge from '@/components/SelfDeclaredBadge'

interface ShortlistCandidate {
  id: string
  officer_id: string
  project_id: string
  status: 'berpotensi' | 'dihubungi' | 'ditolak' | 'diluluskan'
  notes: string
  created_at: string
  updated_at: string
  project_title: string
  project_description: string
  project_category: string
  project_state: string
  project_institution: string
  feasibility_score: number
  feasibility_tier: string
  score_source?: string
}

export default function ShortlistPage() {
  const router = useRouter()
  const supabase = createClient()

  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [userName, setUserName] = useState('Pegawai MARA')

  // Get current user profile
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single()
        if (profile?.name) {
          setUserName(profile.name)
        }
      }
    }
    getProfile()
  }, [])

  // Fetch shortlisted candidates
  const fetchShortlist = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/mara/shortlist')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuatkan senarai pendek.')
      }
      setCandidates(data.shortlist || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa memuatkan data senarai pendek.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShortlist()
  }, [])

  const handleLogout = async () => {
    document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await supabase.auth.signOut()
    router.push('/mara/login')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'berpotensi':
        return { text: 'Berpotensi', style: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' }
      case 'dihubungi':
        return { text: 'Dihubungi', style: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' }
      case 'ditolak':
        return { text: 'Tidak Layak', style: 'bg-red-500/10 border-red-500/20 text-red-400' }
      case 'diluluskan':
        return { text: 'Diluluskan', style: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' }
      default:
        return { text: 'Berpotensi', style: 'bg-slate-500/10 border-slate-500/20 text-slate-400' }
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white">MARA Talent Scout</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Konsol Pemantauan & Pencarian Prospek</p>
          </div>
        </div>

        {/* Portal Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/search" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Carian Calon
          </a>
          <a href="/shortlist" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider">
            Senarai Pendek
          </a>
          <a href="/analytics" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Analitis Prospek
          </a>
          <a href="/inbox" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Permohonan Pinjaman
          </a>
        </nav>

        {/* User profile & logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200">{userName}</p>
            <p className="text-[9px] text-slate-500 font-semibold uppercase">Pegawai MARA</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Log Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-lg font-black text-white">Senarai Pendek Pegawai</h2>
          <p className="text-xs text-slate-400 mt-1">
            Menguruskan senarai calon Bumiputera terpilih bagi saringan tawaran skim geran dan dana MARA.
          </p>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <p>
            Menguruskan <span className="font-black text-amber-400">{candidates.length}</span> usahawan Bumiputera dalam senarai peribadi anda.
          </p>
          {candidates.length > 0 && <ExportButton />}
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Memuatkan senarai pendek...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/5 p-16 text-center flex flex-col items-center gap-4 bg-navy-950/10">
            <ClipboardList className="w-12 h-12 text-slate-600" />
            <div>
              <h3 className="font-bold text-slate-300">Tiada Calon Senarai Pendek</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Anda belum menyenarai pendek mana-mana calon lagi. Sila layari konsol **Carian Calon** untuk menyemak dan menambah calon.
              </p>
            </div>
            <button
              onClick={() => router.push('/search')}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-[#020617] text-xs font-bold uppercase rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
            >
              Cari Calon Sekarang
            </button>
          </div>
        ) : (
          // Grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidates.map((c) => {
              const badge = getStatusBadge(c.status)
              return (
                <div
                  key={c.id}
                  onClick={() => router.push(`/candidate/${c.project_id}`)}
                  className="glass-card rounded-2xl border border-white/5 hover:border-amber-500/40 p-6 flex flex-col gap-4 relative overflow-hidden transition-all hover:scale-[1.01] cursor-pointer"
                >
                  {/* Status Badge */}
                  <div className="flex justify-between items-start gap-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-amber-500/90 uppercase tracking-wider">
                      {c.project_category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${badge.style}`}>
                      {badge.text}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <h3 className="font-black text-sm text-white hover:text-amber-400 transition-colors leading-snug">
                      {c.project_title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {c.project_description}
                    </p>
                  </div>

                  {/* Internal Notes Quote */}
                  {c.notes && (
                    <div className="bg-[#0b0f19]/60 p-3 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase">
                        <MessageSquare className="w-3 h-3 text-amber-500/60" />
                        <span>Nota Pegawai (Rahsia)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 italic leading-relaxed">
                        "{c.notes}"
                      </p>
                    </div>
                  )}

                  {/* State & Institution */}
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-auto pt-2 border-t border-white/5 font-bold uppercase">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                      <span>{c.project_institution}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span>{c.project_state}</span>
                    </div>
                  </div>

                  {/* Feasibility score preview */}
                  <div className="bg-[#0b0f19]/80 p-3 rounded-xl border border-white/5 flex items-center justify-between mt-1">
                    <div>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Skor Kebolehsanaan</p>
                      <p className="text-[10px] text-slate-300 font-black mt-0.5 flex items-center gap-1.5">
                        <span>{c.feasibility_tier}</span>
                        {c.score_source === 'self_declared' && (
                          <SelfDeclaredBadge />
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-white">{c.feasibility_score}</span>
                      <span className="text-[10px] text-slate-500 font-normal"> /100</span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="flex items-center justify-end text-[10px] font-black text-amber-500 uppercase tracking-wider gap-1 hover:text-amber-400">
                    <span>Lihat Profil & Padanan Geran</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
