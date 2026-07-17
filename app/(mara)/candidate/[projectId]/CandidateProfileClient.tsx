'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Loader2, Award, FileText, CheckCircle2, ChevronRight, Briefcase, Plus, Save, Clock, Trash2, Calendar, RefreshCw } from 'lucide-react'
import FeasibilityGauge from '@/components/FeasibilityGauge'
import SwotTabs from '@/components/SwotTabs'
import BlueprintCard from '@/components/BlueprintCard'

interface Project {
  id: string
  title: string
  description: string
  category: string
  team_members: string[]
  event_id: string
  owner_user_id: string | null
  state?: string
  institution?: string
}

interface Scheme {
  id: string
  name: string
  agency: string
  description: string
  eligibility_criteria: string
  sector_tags: string[]
  max_amount_myr: number
}

interface Match {
  id: string
  scheme_id: string
  match_score: number
  match_reasoning: string
  generated_at: string
  scheme_name: string
  scheme_agency: string
  scheme_max_amount: number
}

interface ShortlistEntry {
  id: string
  status: 'berpotensi' | 'dihubungi' | 'ditolak' | 'diluluskan'
  notes: string
}

interface CandidateProfileClientProps {
  project: Project
  feasibilityResult: {
    score: number
    tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan'
    criteriaBreakdown: {
      criteriaId: string
      code: string
      label: string
      average: number
      percentage: number
      max_score: number
    }[]
  }
  initialReport: any | null
  initialMatches: Match[]
  shortlistEntry: ShortlistEntry | null
  schemes: Scheme[]
  userName: string
}

export default function CandidateProfileClient({
  project,
  feasibilityResult,
  initialReport,
  initialMatches,
  shortlistEntry,
  schemes,
  userName,
}: CandidateProfileClientProps) {
  const router = useRouter()

  const [matches, setMatches] = useState<Match[]>(initialMatches)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [matchingError, setMatchingError] = useState('')

  // Shortlist state
  const [status, setStatus] = useState<'berpotensi' | 'dihubungi' | 'ditolak' | 'diluluskan' | ''>(
    shortlistEntry?.status || ''
  )
  const [notes, setNotes] = useState(shortlistEntry?.notes || '')
  const [savingShortlist, setSavingShortlist] = useState(false)
  const [shortlistSuccess, setShortlistSuccess] = useState(false)
  const [shortlistError, setShortlistError] = useState('')

  const handleLogout = async () => {
    document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.push('/mara/login')
  }

  // Trigger AI Matching Engine
  const handleTriggerMatch = async () => {
    setLoadingMatches(true)
    setMatchingError('')
    try {
      const res = await fetch(`/api/mara/grant-match/${project.id}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menjana padanan geran.')
      }
      setMatches(data.matches || [])
    } catch (err: any) {
      setMatchingError(err.message || 'Ralat semasa menjana padanan geran.')
    } finally {
      setLoadingMatches(false)
    }
  }

  // Save/Update shortlist status and notes
  const handleSaveShortlist = async () => {
    setSavingShortlist(true)
    setShortlistSuccess(false)
    setShortlistError('')
    try {
      if (!status) {
        throw new Error('Sila pilih status senarai pendek.')
      }

      const res = await fetch('/api/mara/shortlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          status,
          notes,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan senarai pendek.')
      }

      setShortlistSuccess(true)
      setTimeout(() => setShortlistSuccess(false), 3000)
    } catch (err: any) {
      setShortlistError(err.message || 'Ralat semasa menyimpan status.')
    } finally {
      setSavingShortlist(false)
    }
  }

  const renderShortlistPanel = () => (
    <div className="glass-card rounded-xl border border-amber-500/20 p-5 bg-gradient-to-br from-amber-500/[0.02] to-transparent flex flex-col gap-4 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Urus Senarai Pendek Pegawai</h3>
        </div>
        {shortlistEntry && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold uppercase">
            Disenarai Pendek
          </span>
        )}
      </div>

      {shortlistError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
          {shortlistError}
        </div>
      )}

      {shortlistSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-1.5 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Status senarai pendek berjaya disimpan!</span>
        </div>
      )}

      {/* Select Status */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status Penilaian</label>
        <select
          value={status}
          onChange={(e: any) => setStatus(e.target.value)}
          className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors"
        >
          <option value="">-- Tiada Status (Bukan Shortlist) --</option>
          <option value="berpotensi">Berpotensi Tinggi (Kaji Semula)</option>
          <option value="dihubungi">Dihubungi Untuk Sesi Temuduga</option>
          <option value="ditolak">Tidak Memenuhi Syarat Geran</option>
          <option value="diluluskan">Diluluskan Untuk Pembiayaan</option>
        </select>
      </div>

      {/* Textarea Notes */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nota Semakan Dalaman (Rahsia)</label>
        <textarea
          rows={4}
          placeholder="Tulis ulasan sulit agensi, kelayakan pembiayaan, tindakan susulan atau arahan mesyuarat di sini..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-[#0b0f19] border border-white/5 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-colors placeholder-slate-700 leading-relaxed"
        />
      </div>

      {/* Action Buttons */}
      <button
        onClick={handleSaveShortlist}
        disabled={savingShortlist}
        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-[#020617] font-black rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
      >
        {savingShortlist ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Menyimpan Rekod...</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>Simpan Nota & Status</span>
          </>
        )}
      </button>
    </div>
  )

  const renderGrantMatchPanel = () => (
    <div className="glass-card rounded-xl border border-white/5 p-6 bg-navy-950/20 space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ulasan Padanan Geran AI</h3>
          <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Analisis Keserasian Skim Geran Aktif</p>
        </div>
        <button
          onClick={handleTriggerMatch}
          disabled={loadingMatches}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-[#020617] text-[10px] font-black uppercase rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          {loadingMatches ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Memproses...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Jana Padanan Geran AI</span>
            </>
          )}
        </button>
      </div>

      {matchingError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
          {matchingError}
        </div>
      )}

      {loadingMatches ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Menilai kriteria kelayakan...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-8 bg-[#0b0f19]/40 border border-white/5 rounded-xl p-6">
          <Briefcase className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h4 className="text-xs font-bold text-slate-300">Belum Ada Analisis Padanan</h4>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs mx-auto">
            Sila klik butang di atas untuk memulakan enjin padanan AI berasaskan kriteria kelayakan MARA.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const isHighMatch = m.match_score >= 80
            const progressColor = isHighMatch ? 'bg-amber-500' : m.match_score >= 50 ? 'bg-yellow-600' : 'bg-red-500/70'

            return (
              <div
                key={m.scheme_id}
                className={`p-4 rounded-xl border flex flex-col gap-3 relative overflow-hidden ${
                  isHighMatch
                    ? 'border-amber-500/20 bg-amber-500/[0.02]'
                    : 'border-white/5 bg-[#0b0f19]/40'
                }`}
              >
                {/* Score badge */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                      {m.scheme_agency}
                    </span>
                    <h4 className="font-bold text-xs text-white mt-1.5">{m.scheme_name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-white">{m.match_score}%</span>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">Kesesuaian</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div
                    className={`${progressColor} h-full rounded-full transition-all duration-1000`}
                    style={{ width: `${m.match_score}%` }}
                  />
                </div>

                {/* Match Reasoning */}
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {m.match_reasoning}
                </p>

                {/* Siling tag */}
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-white/5 mt-1 font-bold">
                  <span>ANGGARAN DANA</span>
                  <span className="text-amber-500/90 uppercase">SEHINGGA RM{m.scheme_max_amount.toLocaleString()}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderScoringBreakdown = () => (
    <div className="glass-card rounded-xl border border-white/5 p-5 flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Pecahan Markah i-MARATeCH 2021</h3>
      <div className="space-y-4">
        {feasibilityResult.criteriaBreakdown?.map((c) => (
          <div key={c.criteriaId}>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span className="font-bold text-slate-300">{c.code}: {c.label}</span>
              <span className="font-black text-white">{c.average} <span className="text-slate-600 font-normal">/ {c.max_score}</span></span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 p-0.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-1000"
                style={{ width: `${c.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/search')}
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Carian"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-white">Profil Calon Usahawan</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Konsol Pemantauan & Padanan Geran</p>
            </div>
          </div>
        </div>

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
            <Loader2 className="w-4 h-4 hidden" />
            <span>Log Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Profile Header Card */}
        <div className="lg:col-span-3 glass-card rounded-2xl border border-white/5 p-6 flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden bg-gradient-to-br from-amber-500/[0.01] to-transparent">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/30 text-[9px] text-amber-400 font-extrabold uppercase mb-3 tracking-wider">
              <span>{project.category}</span>
            </div>
            <h2 className="text-2xl font-black text-white leading-snug">{project.title}</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">{project.description}</p>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[10px] text-slate-500 pt-3 border-t border-white/5 font-bold uppercase">
              <div>
                INSTITUSI: <span className="text-slate-300">{project.institution || 'Tidak Dinyatakan'}</span>
              </div>
              <div>
                NEGERI: <span className="text-slate-300">{project.state || 'Tidak Dinyatakan'}</span>
              </div>
              {project.team_members && project.team_members.length > 0 && (
                <div>
                  KUMPULAN: <span className="text-slate-300">{project.team_members.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Column: Feasibility & Shortlist */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Feasibility Gauge */}
          <FeasibilityGauge score={feasibilityResult.score} tier={feasibilityResult.tier} />
          
          {/* K1-K5 Scoring breakdown */}
          {renderScoringBreakdown()}

          {/* Shortlist Panel */}
          {renderShortlistPanel()}
        </div>

        {/* Right Column: AI business report & Grant matching */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI business report check */}
          {initialReport ? (
            <div className="space-y-6">
              {/* SWOT Analysis */}
              <SwotTabs swot={initialReport.swot} />
              
              {/* Actionable Blueprint */}
              <BlueprintCard blueprint={initialReport.blueprint} />
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-white/5 p-8 text-center bg-[#0b0f19]/20">
              <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-300">Laporan AI Belum Dijana</h4>
              <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Usahawan ini belum menekan butang "Jana Laporan AI" daripada dashboard peribadi mereka. Pihak MARA boleh menasihati usahawan untuk menjana laporan bagi menyediakan analisis SWOT dan Blueprint tindakan yang komprehensif.
              </p>
            </div>
          )}

          {/* Grant Match Panel */}
          {renderGrantMatchPanel()}
        </div>
      </main>
    </div>
  )
}
