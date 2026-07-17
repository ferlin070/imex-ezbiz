'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Search, Filter, Briefcase, MapPin, Award, LogOut, Loader2, ArrowRight, BookOpen } from 'lucide-react'

interface Candidate {
  id: string
  title: string
  description: string
  category: string
  state: string
  institution: string
  feasibility_score: number
  feasibility_tier: string
}

export default function SearchPage() {
  const router = useRouter()
  const supabase = createClient()

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  const [selectedTier, setSelectedTier] = useState('all')
  const [selectedState, setSelectedState] = useState('all')

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

  // Fetch candidates based on filters
  const fetchCandidates = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/mara/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          sector: selectedSector,
          tier: selectedTier,
          state: selectedState,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencari calon.')
      }

      setCandidates(data.projects || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa memuatkan data carian.')
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on filter/query change
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCandidates()
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, selectedSector, selectedTier, selectedState])

  const handleLogout = async () => {
    document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await supabase.auth.signOut()
    router.push('/mara/login')
  }

  // Sectors, Tiers, and States list
  const sectors = [
    { value: 'all', label: 'Semua Sektor' },
    { value: 'Automotif & IoT', label: 'Automotif & IoT' },
    { value: 'Teknologi Makanan', label: 'Teknologi Makanan' },
    { value: 'Mekanikal & Robotik', label: 'Mekanikal & Robotik' },
    { value: 'Pertanian Pintar', label: 'Pertanian Pintar' },
  ]

  const tiers = [
    { value: 'all', label: 'Semua Tahap' },
    { value: 'Sangat Berpotensi', label: 'Sangat Berpotensi (Tier 1)' },
    { value: 'Layak Komersial', label: 'Layak Komersial (Tier 2)' },
    { value: 'Berpotensi Sederhana', label: 'Berpotensi Sederhana' },
    { value: 'Perlu Bimbingan', label: 'Perlu Bimbingan' },
  ]

  const states = [
    { value: 'all', label: 'Semua Negeri' },
    { value: 'Terengganu', label: 'Terengganu' },
    { value: 'Kelantan', label: 'Kelantan' },
    { value: 'Pahang', label: 'Pahang' },
    { value: 'Kedah', label: 'Kedah' },
  ]

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Premium Header */}
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
          <a href="/search" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider">
            Carian Calon
          </a>
          <a href="/shortlist" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Senarai Pendek
          </a>
          <a href="/analytics" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Analitis Prospek
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

      {/* Main content grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Filter Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl border border-white/5 p-5 bg-navy-950/20 space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Filter className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Penapis Carian</h2>
            </div>

            {/* Filter Sektor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sektor / Kategori</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors"
              >
                {sectors.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Filter Tier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tahap Kebolehsanaan</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors"
              >
                {tiers.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Filter Negeri */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Negeri</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors"
              >
                {states.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedSector('all')
                setSelectedTier('all')
                setSelectedState('all')
              }}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Set Semula Semua
            </button>
          </div>
        </aside>

        {/* Right Side: Candidates Grid */}
        <section className="lg:col-span-3 space-y-6">
          {/* Top Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari kata kunci projek, tajuk, institusi (e.g. IKM Besut)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950/30 border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all shadow-xl"
            />
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <p>
              Menjumpai <span className="font-black text-amber-400">{candidates.length}</span> usahawan Bumiputera yang membenarkan perkongsian profil.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Skeleton/Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Menyaring pangkalan data...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="glass-card rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center gap-4 bg-navy-950/10">
              <Briefcase className="w-10 h-10 text-slate-600" />
              <div>
                <h3 className="font-bold text-slate-300">Tiada Calon Dijumpai</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Tiada usahawan yang bertepatan dengan kriteria carian anda atau tiada projek yang membenarkan akses perkongsian profil MARA buat masa ini.
                </p>
              </div>
            </div>
          ) : (
            // Candidates list
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map((c) => {
                const isTopProspect = c.feasibility_score >= 80
                return (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/candidate/${c.id}`)}
                    className={`glass-card rounded-2xl border transition-all hover:scale-[1.01] hover:border-amber-500/40 p-6 flex flex-col gap-4 relative overflow-hidden cursor-pointer ${
                      isTopProspect
                        ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent shadow-[0_0_20px_rgba(245,158,11,0.03)]'
                        : 'border-white/5 hover:bg-white/[0.01]'
                    }`}
                  >
                    {/* Corner badge for top prospects */}
                    {isTopProspect && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-[#020617] text-[8px] font-black uppercase px-2.5 py-1 rounded-bl-lg tracking-wider flex items-center gap-1 shadow-md">
                        <Award className="w-3 h-3" />
                        <span>Prospek Utama</span>
                      </div>
                    )}

                    {/* Category Tag */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-amber-500/90 uppercase tracking-wider">
                        {c.category}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-black text-sm text-white group-hover:text-amber-400 transition-colors leading-snug">
                        {c.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    </div>

                    {/* Institution & State */}
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-auto pt-2 border-t border-white/5">
                      <div className="flex items-center gap-1 font-bold uppercase">
                        <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                        <span>{c.institution}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold uppercase ml-auto">
                        <MapPin className="w-3.5 h-3.5 text-slate-600" />
                        <span>{c.state}</span>
                      </div>
                    </div>

                    {/* Feasibility score preview */}
                    <div className="bg-[#0b0f19]/80 p-3 rounded-xl border border-white/5 flex items-center justify-between mt-1">
                      <div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Skor Kebolehsanaan</p>
                        <p className="text-[10px] text-slate-300 font-black mt-0.5">{c.feasibility_tier}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-white">{c.feasibility_score}</span>
                        <span className="text-[10px] text-slate-500 font-normal"> /100</span>
                      </div>
                    </div>

                    {/* Action Indicator */}
                    <div className="flex items-center justify-end text-[10px] font-black text-amber-500 uppercase tracking-wider gap-1 hover:text-amber-400">
                      <span>Lihat Analisis SWOT</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
