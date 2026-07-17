'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Loader2, LogOut, TrendingUp, BarChart2, Award, Award as Ribbon, BookOpen, MapPin, ChevronRight, PieChart } from 'lucide-react'
import SelfDeclaredBadge from '@/components/SelfDeclaredBadge'

interface Stats {
  tiers: {
    'Sangat Berpotensi': number
    'Layak Komersial': number
    'Berpotensi Sederhana': number
    'Perlu Bimbingan': number
  }
  sectors: { name: string; value: number }[]
  top10: {
    id: string
    title: string
    category: string
    state: string
    institution: string
    score: number
    tier: string
    score_source?: string
  }[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [userName, setUserName] = useState('Pegawai MARA')

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

  const fetchStats = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/mara/analytics')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuatkan analitis.')
      }
      setStats(data.stats)
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa menarik data analitis.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleLogout = async () => {
    document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await supabase.auth.signOut()
    router.push('/mara/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
        {/* Simple Header */}
        <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span className="text-sm font-black tracking-wider uppercase text-white">MARA Talent Scout</span>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Menyusun statistik prospek...</p>
        </div>
      </div>
    )
  }

  if (errorMsg || !stats) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
        <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span className="text-sm font-black tracking-wider uppercase text-white">MARA Talent Scout</span>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-400 font-bold">Gagal Mengumpulkan Data Analitis</p>
          <p className="text-slate-500 text-xs mt-1">{errorMsg}</p>
          <button onClick={fetchStats} className="mt-4 px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-slate-300 hover:text-white">
            Cuba Semula
          </button>
        </div>
      </div>
    )
  }

  // Calculate totals
  const totalProjects = Object.values(stats.tiers).reduce((a, b) => a + b, 0)
  const topProspectsCount = stats.tiers['Sangat Berpotensi'] || 0
  const topSector = stats.sectors[0]?.name || 'Tiada Sektor'

  // Get percentage for donut simulation
  const getPercentage = (count: number) => {
    if (totalProjects === 0) return 0
    return Math.round((count / totalProjects) * 100)
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
          <a href="/shortlist" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Senarai Pendek
          </a>
          <a href="/analytics" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider">
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
          <h2 className="text-lg font-black text-white">Analitis Prospek Usahawan</h2>
          <p className="text-xs text-slate-400 mt-1">
            Paparan agregat data kebolehsanaan perniagaan Bumiputera merentasi semua kategori inovasi i-MARATeCH 2021.
          </p>
        </div>

        {/* Stats Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Card 1: Total Candidates */}
          <div className="glass-card rounded-2xl border border-white/5 p-5 bg-gradient-to-br from-amber-500/[0.01] to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Jumlah Calon MARA</p>
                <p className="text-3xl font-black text-white mt-1.5">{totalProjects}</p>
              </div>
              <span className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <BarChart2 className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-3 font-medium uppercase">Calon yang bersetuju berkongsi profil</p>
          </div>

          {/* Card 2: Sangat Berpotensi */}
          <div className="glass-card rounded-2xl border border-white/5 p-5 bg-gradient-to-br from-emerald-500/[0.01] to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Calon Sangat Berpotensi</p>
                <p className="text-3xl font-black text-emerald-400 mt-1.5">{topProspectsCount}</p>
              </div>
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-3 font-medium uppercase">Biz-Feasibility Score ≥ 80%</p>
          </div>

          {/* Card 3: Top Sector */}
          <div className="glass-card rounded-2xl border border-white/5 p-5 bg-gradient-to-br from-cyan-500/[0.01] to-transparent">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Sektor Terbanyak</p>
                <p className="text-base font-black text-cyan-400 mt-3 line-clamp-1">{topSector}</p>
              </div>
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-3.5 font-medium uppercase">Kategori dengan projek terbanyak</p>
          </div>
        </div>

        {/* Charts Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Donut Simulation: Tier Distribution using Circular Rings */}
          <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Taburan Tier Kebolehsanaan</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase">Mengikut Peratusan</span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              {/* Ring 1: Sangat Berpotensi */}
              <div className="bg-[#0b0f19]/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-12 h-12 shrink-0" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-emerald-400" strokeDasharray={`${getPercentage(stats.tiers['Sangat Berpotensi'])}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="21.5" className="fill-white font-black text-[9px] text-anchor-middle" textAnchor="middle">
                    {getPercentage(stats.tiers['Sangat Berpotensi'])}%
                  </text>
                </svg>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Sangat Berpotensi</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">{stats.tiers['Sangat Berpotensi']} Calon</p>
                </div>
              </div>

              {/* Ring 2: Layak Komersial */}
              <div className="bg-[#0b0f19]/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-12 h-12 shrink-0" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-cyan-400" strokeDasharray={`${getPercentage(stats.tiers['Layak Komersial'])}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="21.5" className="fill-white font-black text-[9px] text-anchor-middle" textAnchor="middle">
                    {getPercentage(stats.tiers['Layak Komersial'])}%
                  </text>
                </svg>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Layak Komersial</p>
                  <p className="text-sm font-black text-cyan-400 mt-0.5">{stats.tiers['Layak Komersial']} Calon</p>
                </div>
              </div>

              {/* Ring 3: Berpotensi Sederhana */}
              <div className="bg-[#0b0f19]/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-12 h-12 shrink-0" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-yellow-500" strokeDasharray={`${getPercentage(stats.tiers['Berpotensi Sederhana'])}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="21.5" className="fill-white font-black text-[9px] text-anchor-middle" textAnchor="middle">
                    {getPercentage(stats.tiers['Berpotensi Sederhana'])}%
                  </text>
                </svg>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Berpotensi Sederhana</p>
                  <p className="text-sm font-black text-yellow-500 mt-0.5">{stats.tiers['Berpotensi Sederhana']} Calon</p>
                </div>
              </div>

              {/* Ring 4: Perlu Bimbingan */}
              <div className="bg-[#0b0f19]/40 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                <svg className="w-12 h-12 shrink-0" viewBox="0 0 36 36">
                  <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-red-500" strokeDasharray={`${getPercentage(stats.tiers['Perlu Bimbingan'])}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <text x="18" y="21.5" className="fill-white font-black text-[9px] text-anchor-middle" textAnchor="middle">
                    {getPercentage(stats.tiers['Perlu Bimbingan'])}%
                  </text>
                </svg>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">Perlu Bimbingan</p>
                  <p className="text-sm font-black text-red-500 mt-0.5">{stats.tiers['Perlu Bimbingan']} Calon</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart: Sector Distribution */}
          <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Taburan Sektor Teratas</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase">Projek Terbanyak</span>
            </div>

            {stats.sectors.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-12 text-center">Tiada data sektor ditemui.</p>
            ) : (
              <div className="space-y-4">
                {stats.sectors.slice(0, 5).map((s) => {
                  const maxCount = stats.sectors[0]?.value || 1
                  const widthPercent = (s.value / maxCount) * 100

                  return (
                    <div key={s.name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-300">{s.name}</span>
                        <span className="font-black text-amber-500">{s.value} <span className="text-slate-600 font-normal text-[9px]">Projek</span></span>
                      </div>
                      <div className="w-full bg-white/5 rounded-lg h-2.5 overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-lg transition-all duration-1000"
                          style={{ width: `${widthPercent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Leaderboard (Top 10 overall prospects) */}
          <div className="lg:col-span-2 glass-card rounded-2xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Top 10 Prospek Terbaik Kebangsaan</h3>
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase">Mengikut Skor</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                    <th className="py-3 px-2">Kedudukan</th>
                    <th className="py-3 px-3">Nama Projek</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Institusi</th>
                    <th className="py-3 px-3">Negeri</th>
                    <th className="py-3 px-3 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.top10.map((p, idx) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/candidate/${p.id}`)}
                      className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-2 font-black text-amber-500">#{idx + 1}</td>
                      <td className="py-3.5 px-3 font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        <span>{p.title}</span>
                        {p.score_source === 'self_declared' && (
                          <SelfDeclaredBadge />
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">{p.category}</td>
                      <td className="py-3.5 px-3 text-slate-400 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-600" />
                        <span>{p.institution}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-600" />
                          <span>{p.state}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-white">{p.score}%</td>
                    </tr>
                  ))}
                  {stats.top10.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        Tiada projek berdaftar ditemui.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
