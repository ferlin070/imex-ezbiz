'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { calculateLoan, LoanCalculationResult } from '@/lib/loanCalculator'
import { Landmark, ArrowLeft, Save, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react'

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
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)
  const [calcResult, setCalcResult] = useState<LoanCalculationResult | null>(null)

  useEffect(() => {
    // Keep recalculating Repayment details
    const result = calculateLoan(amount, Number(product.profit_rate_percent), tenure)
    setCalcResult(result)
  }, [amount, tenure, product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (amount < Number(product.min_amount_myr) || amount > Number(product.max_amount_myr)) {
      setErrorMsg(`Amaun mestilah di antara RM${Number(product.min_amount_myr).toLocaleString()} dan RM${Number(product.max_amount_myr).toLocaleString()}`)
      setLoading(false)
      return
    }

    if (tenure < product.min_tenure_months || tenure > product.max_tenure_months) {
      setErrorMsg(`Tempoh bayaran balik mestilah di antara ${product.min_tenure_months} dan ${product.max_tenure_months} bulan`)
      setLoading(false)
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

      setSuccess(true)
      setTimeout(() => {
        router.push(`/project/${project.id}`)
      }, 3000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa menghantar permohonan.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 backdrop-blur-sm z-10">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white">Permohonan Berjaya Dihantar!</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Permohonan pembiayaan anda untuk skim <strong className="text-white">{product.name}</strong> berjaya didaftarkan. Status perniagaan anda kini ditukar kepada <strong className="text-white">Sedang Disemak (Under Review)</strong>.
          </p>
          <p className="text-[10px] text-slate-500">Anda akan dipindahkan ke dashboard projek anda sebentar lagi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-teal-neon/5 blur-[120px] pointer-events-none" />

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
              <Landmark className="w-5 h-5 text-teal-neon" />
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
            
            {/* Input Form Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah Pembiayaan Dipohon (RM)</label>
                <input
                  type="number"
                  min={product.min_amount_myr}
                  max={product.max_amount_myr}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
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
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
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
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm resize-none"
                  required
                />
              </div>
            </div>

            {/* Live Calculation Preview Column */}
            <div className="p-5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Simulasi Pengiraan Repayment</h3>
                {calcResult && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-baseline border-b border-slate-800 pb-3">
                      <span className="text-xs text-slate-400">Ansuran Bulanan:</span>
                      <span className="text-xl font-black text-teal-neon">RM {calcResult.monthlyInstallment.toLocaleString()}</span>
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

              <div className="p-3 bg-slate-900 border border-slate-800/60 rounded text-[10px] text-slate-500 leading-relaxed mt-4">
                💡 Jadual pembayaran lengkap akan disimpan secara automatik dalam pangkalan data mengikut kaedah pengurangan baki amortisasi bulanan.
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 font-black rounded-xl text-sm uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,242,254,0.2)] hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Hantar Permohonan Pembiayaan</span>
          </button>
        </form>

      </div>
    </div>
  )
}
