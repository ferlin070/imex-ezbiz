'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Sparkles,
  LogOut,
  ArrowRight,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import FeasibilityGauge from '@/components/FeasibilityGauge'
import SwotTabs from '@/components/SwotTabs'
import BlueprintCard from '@/components/BlueprintCard'
import PitchGenerator from '@/components/PitchGenerator'

interface Project {
  id: string
  title: string
  description: string
  category: string
  team_members: string[]
  score_source?: string
  mara_visible: boolean
}

interface Report {
  swot: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  blueprint: {
    technical: string[]
    marketing: string[]
    financial: string[]
  }
  pitch_script: string
  feasibility_score: number
  feasibility_tier: string
}

interface CriteriaBreakdown {
  criteriaId: string
  code: string
  label: string
  average: number
  max_score: number
  percentage: number
}

interface FeasibilityResult {
  score: number
  tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan'
  criteriaBreakdown: CriteriaBreakdown[]
}

interface ProjectDashboardClientProps {
  project: Project
  userName: string
  initialReport: Report | null
  feasibilityResult: FeasibilityResult
}

export default function ProjectDashboardClient({
  project,
  userName,
  initialReport,
  feasibilityResult,
}: ProjectDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [report, setReport] = useState<Report | null>(initialReport)
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  // Consent state
  const [maraVisible, setMaraVisible] = useState(project.mara_visible)
  const [updatingConsent, setUpdatingConsent] = useState(false)

  // Countdown timer for rate limiting
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleLogout = async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleToggleConsent = async () => {
    setUpdatingConsent(true)
    setErrorMsg('')
    try {
      const { error } = await supabase
        .from('projects')
        .update({ mara_visible: !maraVisible })
        .eq('id', project.id)

      if (error) throw error
      setMaraVisible(!maraVisible)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengemaskini tetapan kebenaran.')
    } finally {
      setUpdatingConsent(false)
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    setGenStep(0)
    setErrorMsg('')

    // Simulated step transitions for better UX feel
    const stepInterval = setInterval(() => {
      setGenStep((prev) => {
        if (prev >= 4) {
          clearInterval(stepInterval)
          return 4
        }
        return prev + 1
      })
    }, 2000)

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menjana laporan.')

      setReport(data.report)
      setCountdown(30) // Limit to once every 30 seconds
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat berlaku semasa menjana laporan.')
    } finally {
      clearInterval(stepInterval)
      setGenerating(false)
    }
  }

  // Safe helper to map feasibility status for MARA focus
  const getGrantMapping = () => {
    const score = feasibilityResult.score

    if (score >= 80) {
      return [
        {
          key: 'mara_spiim',
          title: 'Skim Pembiayaan Kontrak MARA (SPIIM)',
          desc: 'Sangat Disyorkan. Projek anda melepasi kelayakan teknikal/komersial peringkat tinggi MARA. Anda layak memohon pembiayaan projek sehingga RM500,000.',
        },
        {
          key: 'mara_express',
          title: 'Skim Pembiayaan Express MARA',
          desc: 'Kelayakan tinggi. Kelulusan pembiayaan segera sehingga RM50,000 untuk meningkatkan kapasiti operasi perniagaan TVET/Inovasi.',
        },
      ]
    } else if (score >= 50) {
      return [
        {
          key: 'mara_pemasaran',
          title: 'Geran Pembangunan Pemasaran MARA',
          desc: 'Layak Komersial. Bantuan kewangan pengiklanan & pameran sehingga RM10,000 untuk meningkatkan keterlihatan produk inovasi.',
        },
        {
          key: 'mara_micro',
          title: 'Skim Pembiayaan Mikro MARA',
          desc: 'Perniagaan anda layak memohon pembiayaan mikro modal kerja sehingga RM20,000 dengan dokumen sedia ada.',
        },
      ]
    } else {
      return [
        {
          key: 'mara_tvet',
          title: 'Skim Keusahawanan TVET MARA',
          desc: 'Berpotensi. Disyorkan menjalani bimbingan inkubator MARA sebelum permohonan pembiayaan berskala penuh dilakukan.',
        },
        {
          key: 'mara_bimbingan',
          title: 'Khidmat Nasihat Keusahawanan (IPD MARA)',
          desc: 'Bimbingan pembangunan produk, pembungkusan dan pendaftaran SSM untuk melayakkan skim pembiayaan pada masa hadapan.',
        },
      ]
    }
  }

  const grantMapping = getGrantMapping()

  const renderCriteriaBreakdown = () => (
    <div className="glass-card rounded-xl border border-white/5 p-5 flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Pecahan Markah i-MARATeCH 2021</h3>
      <div className="space-y-4">
        {feasibilityResult.criteriaBreakdown?.map((c) => (
          <div key={c.criteriaId}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span className="font-bold text-gray-300">{c.code}: {c.label}</span>
              <span className="font-black text-white">{c.average} <span className="text-gray-500 font-normal">/ {c.max_score}</span></span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5 p-0.5">
              <div 
                className="bg-gradient-to-r from-mara-red to-mara-red/80 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${c.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderConsentCard = () => (
    <div className="glass-card rounded-xl border border-amber-500/20 p-5 flex flex-col gap-4 relative overflow-hidden bg-gradient-to-br from-amber-500/5 to-transparent shadow-[0_0_15px_rgba(245,158,11,0.02)]">
      {/* Decorative corner glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 text-amber-400">
        <ShieldCheck className="w-5 h-5" />
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-gray-200">Peluang Geran & Pembiayaan MARA</h3>
          <p className="text-[9px] text-gray-500 font-bold uppercase">Sistem Pencarian Talent Scout</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Dengan membenarkan akses, projek anda, skor juri, dan analisis AI akan didedahkan kepada pegawai MARA untuk pertimbangan geran/pembiayaan.
      </p>

      <div className="flex items-center justify-between bg-navy-950/60 p-3 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
          {maraVisible ? (
            <Eye className="w-4 h-4 text-green-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-xs font-bold text-gray-300">
            {maraVisible ? 'Akses MARA: DIBENARKAN' : 'Akses MARA: DISEKAT'}
          </span>
        </div>

        <button
          onClick={handleToggleConsent}
          disabled={updatingConsent}
          className={`px-3 py-1.5 rounded text-xs font-extrabold transition-all cursor-pointer ${
            maraVisible
              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
          }`}
        >
          {updatingConsent ? 'Memproses...' : maraVisible ? 'Tarik Balik' : 'Benarkan'}
        </button>
      </div>
    </div>
  )

  // Render generator steps
  const steps = [
    'Menganalisis Skor Kebolehsanaan Juri...',
    'Menilai Kekuatan & Kelemahan SWOT...',
    'Merangka Blueprint Tindakan Komersial...',
    'Menjana Skrip Elevator Pitch Pelabur...',
    'Menyusun Nota Kelayakan Geran...',
  ]

  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen pb-16">
      {/* Header bar */}
      <header className="sticky top-0 bg-navy-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-mara-red" />
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-mara-red to-mara-gold bg-clip-text text-transparent">
              MARA AI-Advisor
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Dashboard Usahawan</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold block text-gray-300">Log Masuk: {userName}</span>
            <span className="text-[9px] text-gray-500 font-bold block uppercase">Pemilik Projek</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Log Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="max-w-5xl w-full mx-auto px-4 pt-6 flex flex-col gap-6">
        
        {/* Project Header Card */}
        <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Neon background light */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-mara-red/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-mara-red/10 border border-mara-red/20 text-[10px] text-mara-gold font-extrabold uppercase mb-2">
              <span>{project.category || 'Inovasi TVET'}</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">{project.title}</h2>
            <p className="text-xs text-gray-400 mt-2 max-w-2xl leading-relaxed">{project.description}</p>
            {project.team_members && project.team_members.length > 0 && (
              <p className="text-[10px] text-gray-500 mt-3 font-semibold">
                Ahli Kumpulan: <span className="text-gray-300">{project.team_members.join(', ')}</span>
              </p>
            )}
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            {report ? (
              <>
                <button
                  onClick={() => window.open(`/api/pdf/${project.id}`)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-mara-red to-mara-gold text-white font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(194,14,26,0.2)] hover:shadow-[0_0_20px_rgba(194,14,26,0.4)] cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Muat Turun PDF Laporan</span>
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={generating || countdown > 0}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-navy-900 border border-white/10 hover:border-white/20 text-gray-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                  <span>
                    {countdown > 0 ? `Regenerate (${countdown}s)` : 'Jana Semula Laporan'}
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Error alert */}
        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 text-sm rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* AI report generation state OR layout */}
        {generating ? (
          <div className="glass-card rounded-xl border border-white/5 p-12 text-center flex flex-col items-center justify-center gap-6">
            {/* Pulsing indicator */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <span className="w-12 h-12 border-4 border-mara-red/20 border-t-mara-red rounded-full animate-spin absolute" />
              <Sparkles className="w-5 h-5 text-mara-red animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-lg text-white">Menjana Laporan Komersial AI</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Gemini sedang memproses data penilaian juri pakar anda untuk menyusun kertas kerja perniagaan.
              </p>
            </div>

            {/* Steps Progress Indicator */}
            <div className="w-full max-w-md bg-navy-900/60 rounded-xl p-4 border border-white/5 space-y-3 text-left">
              {steps.map((step, idx) => {
                const isDone = genStep > idx
                const isActive = genStep === idx
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 transition-opacity ${
                      isDone || isActive ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    ) : isActive ? (
                      <span className="w-4 h-4 border-2 border-mara-red border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                    )}
                    <span className={`text-xs font-semibold ${isActive ? 'text-mara-red font-black' : 'text-gray-400'}`}>
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : !report ? (
          /* Empty state - CTA to generate report */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 flex flex-col gap-6">
              <FeasibilityGauge score={feasibilityResult.score} tier={feasibilityResult.tier} scoreSource={project.score_source} />
              {renderCriteriaBreakdown()}
              {renderConsentCard()}
            </div>
            
            <div className="md:col-span-2 glass-card rounded-xl border border-white/5 p-8 flex flex-col justify-center items-center text-center gap-6">
              <div className="p-3 bg-mara-gold/10 border border-mara-gold/20 rounded-full text-mara-gold">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">Jana Analisis SWOT & Blueprint Perniagaan</h3>
                <p className="text-xs text-gray-400 max-w-md leading-relaxed mx-auto">
                  Tukarkan markah juri pertandingan anda menjadi rancangan perniagaan lengkap dengan SWOT, blueprint tindakan komersial, skrip pitch pelabur, dan nota kelayakan geran MARA.
                </p>
              </div>

              <button
                onClick={handleGenerateReport}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-mara-red to-mara-gold text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(194,14,26,0.3)] hover:shadow-[0_0_20px_rgba(194,14,26,0.5)] cursor-pointer text-sm uppercase tracking-wider"
              >
                <span>Jana Laporan AI Sekarang</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          /* Main Dashboard Layout (Gauge + SWOT + Blueprint + Pitch + Grants) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Gauge + Grants */}
            <div className="md:col-span-1 flex flex-col gap-6">
              <FeasibilityGauge score={feasibilityResult.score} tier={feasibilityResult.tier} scoreSource={project.score_source} />
              {renderCriteriaBreakdown()}
              {renderConsentCard()}

              {/* Grant notes card */}
              <div className="glass-card rounded-xl border border-white/5 p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Kelayakan Pembiayaan & Geran</h3>
                <div className="space-y-4">
                  {grantMapping.map((g) => (
                    <div key={g.key} className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-mara-red block">{g.title}</span>
                      <p className="text-[11px] text-gray-400 leading-relaxed bg-navy-950/60 p-2.5 rounded border border-white/5">{g.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: SWOT + Blueprint + Pitch */}
            <div className="md:col-span-2 flex flex-col gap-6">
              <SwotTabs swot={report.swot} />
              
              <BlueprintCard blueprint={report.blueprint} />

              <PitchGenerator pitchScript={report.pitch_script} />
            </div>

          </div>
        )}

      </main>
    </div>
  )
}
