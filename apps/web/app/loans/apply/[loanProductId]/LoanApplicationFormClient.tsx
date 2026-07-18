'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { calculateLoan, LoanCalculationResult } from '@/lib/loanCalculator'
import {
  Landmark, ArrowLeft, Save, AlertCircle, CheckCircle2,
  XCircle, Clock, Loader2, Sparkles, ShieldCheck
} from 'lucide-react'

interface LoanProduct {
  id: string
  name: string
  description: string
  min_amount_myr: number
  max_amount_myr: number
  profit_rate_percent: number
  min_tenure_months: number
  max_tenure_months: number
  sector_tags: string[]
}

interface Project {
  id: string
  title: string
  category: string
}

interface LoanApplicationFormClientProps {
  product: LoanProduct
  project: Project
  initialAmount?: number
  initialTenure?: number
}

// A4 Opsyen B: Step-by-step state machine
type AppStep =
  | 'form'            // Initial form entry
  | 'submitting'      // Waiting for /api/loans/apply (eligibility, fast)
  | 'eligibility'     // Eligibility result shown; triggering AI plan in background
  | 'ai_generating'   // Polling for AI plan
  | 'ai_ready'        // AI plan received
  | 'error'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 20 // 1 minute max

export default function LoanApplicationFormClient({
  product,
  project,
  initialAmount,
  initialTenure
}: LoanApplicationFormClientProps) {
  const router = useRouter()
  const [amount, setAmount] = useState(initialAmount || product.min_amount_myr)
  const [tenure, setTenure] = useState(initialTenure || product.min_tenure_months)
  const [purpose, setPurpose] = useState('')
  const [step, setStep] = useState<AppStep>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const [calcResult, setCalcResult] = useState<LoanCalculationResult | null>(null)

  // Results from eligibility check
  const [eligibilityStatus, setEligibilityStatus] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [aiActionPlan, setAiActionPlan] = useState<string | null>(null)

  const pollCountRef = useRef(0)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const result = calculateLoan(amount, Number(product.profit_rate_percent), tenure)
    setCalcResult(result)
  }, [amount, tenure, product])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current)
    }
  }, [])

  // A4 Opsyen B: Poll for AI plan after eligibility is shown
  const triggerAndPollAIPlan = useCallback(async (appId: string) => {
    setStep('ai_generating')
    pollCountRef.current = 0

    // Trigger AI plan generation (POST — starts the Gemini call server-side)
    try {
      await fetch(`/api/loans/ai-plan/${appId}`, { method: 'POST' })
    } catch {
      // Best effort
    }

    const poll = async () => {
      pollCountRef.current += 1

      if (pollCountRef.current > MAX_POLL_ATTEMPTS) {
        setStep('ai_ready')
        setAiActionPlan('Pelan AI sedang dijana. Sila semak semula dalam beberapa minit di dashboard anda.')
        return
      }

      try {
        const res = await fetch(`/api/loans/ai-plan/${appId}`)
        const data = await res.json()

        if (data.aiPlanStatus === 'ready' && data.actionPlan) {
          setAiActionPlan(data.actionPlan)
          setStep('ai_ready')
        } else {
          pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        }
      } catch {
        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    pollTimerRef.current = setTimeout(poll, 2000)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setStep('submitting')

    if (amount < Number(product.min_amount_myr) || amount > Number(product.max_amount_myr)) {
      setErrorMsg(`Amaun mestilah di antara RM${Number(product.min_amount_myr).toLocaleString()} dan RM${Number(product.max_amount_myr).toLocaleString()}`)
      setStep('form')
      return
    }

    if (tenure < product.min_tenure_months || tenure > product.max_tenure_months) {
      setErrorMsg(`Tempoh bayaran balik mestilah di antara ${product.min_tenure_months} dan ${product.max_tenure_months} bulan`)
      setStep('form')
      return
    }

    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          loanProductId: product.id,
          requestedAmountMyr: amount,
          requestedTenureMonths: tenure,
          purpose
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghantar permohonan.')

      setEligibilityStatus(data.eligibilityStatus)
      setApplicationId(data.applicationId)
      setStep('eligibility')

      setTimeout(() => {
        triggerAndPollAIPlan(data.applicationId)
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa menghantar permohonan.')
      setStep('error')
    }
  }

  // ─── STEP: Submitting ─────────────────────────────────────────────────────
  if (step === 'submitting') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Menghantar Permohonan...</h2>
            <p className="text-xs text-slate-400 mt-2">
              Sistem sedang menilai kelayakan anda menggunakan enjin peraturan MARA yang deterministik.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── STEP: Eligibility Result ─────────────────────────────────────────────
  if (step === 'eligibility' || step === 'ai_generating' || step === 'ai_ready') {
    const statusConfig = {
      LULUS: {
        icon: CheckCircle2,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        label: 'LULUS KELAYAKAN ASAS',
        desc: 'Perniagaan anda memenuhi kriteria asas kelayakan MARA. Permohonan anda kini dalam semakan pegawai.'
      },
      TIDAK_LULUS: {
        icon: XCircle,
        color: 'text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20',
        label: 'TIDAK MELEPASI SYARAT',
        desc: 'Perniagaan anda tidak memenuhi kriteria kelayakan asas pada masa ini. Semak pelan tindakan AI untuk panduan penambahbaikan.'
      },
      PERLU_TINDAKAN: {
        icon: Clock,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        label: 'PERLU TINDAKAN',
        desc: 'Terdapat syarat yang memerlukan perhatian sebelum permohonan boleh diteruskan. Rujuk pelan tindakan AI.'
      }
    }

    const cfg = statusConfig[eligibilityStatus as keyof typeof statusConfig] || statusConfig['PERLU_TINDAKAN']
    const StatusIcon = cfg.icon

    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full space-y-5">

          {/* Eligibility Result Card */}
          <div className={`p-6 rounded-2xl border ${cfg.bg} space-y-3`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-7 h-7 ${cfg.color} shrink-0`} />
              <div>
                <h2 className={`text-lg font-black ${cfg.color}`}>{cfg.label}</h2>
                <p className="text-xs text-slate-300 mt-0.5">{cfg.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] text-slate-500">
                Penilaian oleh MARA Eligibility Rules Engine v2 · Permohonan #{applicationId?.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* AI Plan Section */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-mara-gold" />
              <h3 className="text-sm font-bold text-white">Pelan Tindakan AI</h3>
              {(step === 'ai_generating' || step === 'eligibility') && (
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-mara-gold bg-mara-gold/10 border border-mara-gold/20 px-2 py-0.5 rounded-full">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Sedang dijana... ({Math.min(pollCountRef.current * 3, 59)}s)
                </span>
              )}
              {step === 'ai_ready' && (
                <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  ✓ Siap
                </span>
              )}
            </div>

            {(step === 'ai_generating' || step === 'eligibility') && (
              <div className="space-y-2">
                <div className="h-3 bg-slate-800 rounded animate-pulse w-full" />
                <div className="h-3 bg-slate-800 rounded animate-pulse w-4/5" />
                <div className="h-3 bg-slate-800 rounded animate-pulse w-3/5" />
                <p className="text-[10px] text-slate-500 pt-2">
                  ✦ Gemini AI sedang menjana pelan tindakan khusus untuk perniagaan anda berdasarkan hasil penilaian MARA. Ini biasanya mengambil masa 10-20 saat.
                </p>
              </div>
            )}

            {step === 'ai_ready' && aiActionPlan && (
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/50 rounded-xl p-4 border border-slate-800/60 max-h-64 overflow-y-auto">
                {aiActionPlan}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/usahawan')}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition"
            >
              Kembali ke Dashboard
            </button>
            {step === 'ai_ready' && (
              <button
                onClick={() => router.push('/loans')}
                className="flex-1 py-3 bg-gradient-to-r from-mara-red to-mara-gold text-white font-bold rounded-xl text-sm transition"
              >
                Lihat Skim Lain
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── STEP: Error ──────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/20 rounded-2xl p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-rose-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Permohonan Gagal</h2>
          <p className="text-xs text-rose-300">{errorMsg}</p>
          <button
            onClick={() => { setStep('form'); setErrorMsg('') }}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition"
          >
            Cuba Semula
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP: Form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-mara-red/5 blur-[120px] pointer-events-none" />

      <div className="max-w-2xl w-full z-10 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-sm shadow-xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-800/60 pb-4">
          <button
            onClick={() => router.push('/loans')}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-mara-red" />
              Mohon Skim {product.name}
            </h1>
            <p className="text-xs text-slate-400">Pautkan permohonan dengan profil perniagaan: {project.title}</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Input Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah Pembiayaan Dipohon (RM)</label>
                <input
                  type="number"
                  min={product.min_amount_myr}
                  max={product.max_amount_myr}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-mara-red outline-none text-white text-sm"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Had: RM{Number(product.min_amount_myr).toLocaleString()} - RM{Number(product.max_amount_myr).toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tempoh Bayaran Balik (Bulan)</label>
                <input
                  type="number"
                  min={product.min_tenure_months}
                  max={product.max_tenure_months}
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-mara-red outline-none text-white text-sm"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Had: {product.min_tenure_months} - {product.max_tenure_months} bulan</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tujuan / Keperluan Pinjaman</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Terangkan secara terperinci keperluan modal (cth: beli mesin, ubah suai premis)"
                  rows={4}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-mara-red outline-none text-white text-sm resize-none"
                  required
                />
              </div>
            </div>

            {/* Live Calculation Column */}
            <div className="p-5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Simulasi Pengiraan Repayment</h3>
                {calcResult && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline border-b border-slate-800 pb-3">
                      <span className="text-xs text-slate-400">Ansuran Bulanan:</span>
                      <span className="text-xl font-black text-mara-red">RM {calcResult.monthlyInstallment.toLocaleString()}</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Kadar Untung Setahun:</span>
                        <span className="font-bold text-slate-300">{product.profit_rate_percent}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jumlah Caj Untung:</span>
                        <span className="font-bold text-slate-300">RM {calcResult.totalProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-800/40">
                        <span>Jumlah Pembayaran Kasar:</span>
                        <span className="font-bold text-white">RM {calcResult.totalRepayment.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-900 border border-slate-800/60 rounded text-[10px] text-slate-500 leading-relaxed">
                💡 Keputusan kelayakan akan dipaparkan serta-merta. Pelan tindakan AI dijana secara latar belakang (±15 saat).
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-mara-red to-mara-gold text-white font-black rounded-xl text-sm uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(194,14,26,0.2)] hover:shadow-[0_0_20px_rgba(194,14,26,0.4)] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Hantar Permohonan Pembiayaan</span>
          </button>
        </form>
      </div>
    </div>
  )
}
