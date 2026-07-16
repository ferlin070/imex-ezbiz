'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, FileText, ArrowRight, RefreshCw, AlertCircle, LogOut, CheckCircle2, ChevronRight, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
  event_id: string
}

interface Report {
  id: string
  project_id: string
  feasibility_score: number
  feasibility_tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan'
  swot: any
  blueprint: any
  pitch_script: string
  grant_notes: any
  generated_at: string
}

interface ProjectDashboardClientProps {
  project: Project
  feasibilityResult: { score: number; tier: any }
  initialReport: Report | null
  userName: string
}

export default function ProjectDashboardClient({
  project,
  feasibilityResult,
  initialReport,
  userName,
}: ProjectDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [report, setReport] = useState<Report | null>(initialReport)
  const [generating, setGenerating] = useState(false)
  const [genStep, setGenStep] = useState(0) // 0 to 4 steps of progress
  const [errorMsg, setErrorMsg] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Track rate limit countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Progress simulation for Gemini generation
  useEffect(() => {
    if (generating) {
      const interval = setInterval(() => {
        setGenStep((prev) => {
          if (prev < 4) return prev + 1
          return prev
        })
      }, 2500) // increment every 2.5 seconds to match ~10-12s Gemini call
      return () => clearInterval(interval)
    } else {
      setGenStep(0)
    }
  }, [generating])

  const handleGenerateReport = async () => {
    setGenerating(true)
    setGenStep(0)
    setErrorMsg('')

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId: project.id }),
      })

      if (res.status === 429) {
        const data = await res.json()
        setCountdown(data.secondsLeft || 300)
        throw new Error(data.error || 'Had kadar terlampau.')
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Gagal menjana laporan.')
      }

      const data = await res.json()
      setReport(data.report)
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat penjanaan laporan AI.')
    } finally {
      setGenerating(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Grant names map for localized presentation
  const grantMapping = [
    { key: 'mara', title: 'MARA (Skim PUTRA / SPIKE)', desc: report?.grant_notes?.mara },
    { key: 'tekun', title: 'TEKUN Nasional / PUNB', desc: report?.grant_notes?.tekun },
    { key: 'mdec', title: 'MDEC (SME Digital Grant) / Cradle', desc: report?.grant_notes?.mdec },
  ]

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
          <Sparkles className="w-5 h-5 text-teal-neon" />
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-teal-neon to-cyan-neon bg-clip-text text-transparent">
              IMEX AI-Biz
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
          <div className="absolute top-0 left-0 w-32 h-32 bg-teal-neon/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 text-[10px] text-cyan-400 font-extrabold uppercase mb-2">
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
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 font-bold rounded-lg transition-all shadow-[0_0_15px_rgba(0,242,254,0.2)] hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] cursor-pointer text-sm"
                >
                  <Download className="w-4 h-4" />
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
              <span className="w-12 h-12 border-4 border-teal-neon/20 border-t-teal-neon rounded-full animate-spin absolute" />
              <Sparkles className="w-5 h-5 text-teal-neon animate-pulse" />
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
                      <span className="w-4 h-4 border-2 border-teal-neon border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-gray-600 shrink-0" />
                    )}
                    <span className={`text-xs font-semibold ${isActive ? 'text-teal-neon font-black' : 'text-gray-400'}`}>
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
            <div className="md:col-span-1">
              <FeasibilityGauge score={feasibilityResult.score} tier={feasibilityResult.tier} />
            </div>
            
            <div className="md:col-span-2 glass-card rounded-xl border border-white/5 p-8 flex flex-col justify-center items-center text-center gap-6">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-white">Jana Analisis SWOT & Blueprint Perniagaan</h3>
                <p className="text-xs text-gray-400 max-w-md leading-relaxed mx-auto">
                  Tukarkan markah juri pertandingan anda menjadi rancangan perniagaan lengkap dengan SWOT, blueprint tindakan komersial, skrip pitch pelabur, dan nota kelayakan geran MARA/TEKUN.
                </p>
              </div>

              <button
                onClick={handleGenerateReport}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 font-black rounded-xl transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.5)] cursor-pointer text-sm uppercase tracking-wider"
              >
                <span>Jana Laporan AI Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Main Dashboard Layout (Gauge + SWOT + Blueprint + Pitch + Grants) */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Gauge + Grants */}
            <div className="md:col-span-1 flex flex-col gap-6">
              <FeasibilityGauge score={feasibilityResult.score} tier={feasibilityResult.tier} />

              {/* Grant notes card */}
              <div className="glass-card rounded-xl border border-white/5 p-5 flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Kelayakan Pembiayaan & Geran</h3>
                <div className="space-y-4">
                  {grantMapping.map((g) => (
                    <div key={g.key} className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-teal-neon block">{g.title}</span>
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
