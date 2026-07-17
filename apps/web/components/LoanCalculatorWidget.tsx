'use client'

import { useState, useEffect } from 'react'
import { calculateLoan, LoanCalculationResult } from '@/lib/loanCalculator'
import { Calculator, Calendar, ArrowRight, DollarSign, Percent, Clock } from 'lucide-react'

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

interface LoanCalculatorWidgetProps {
  products: LoanProduct[]
  defaultProductId?: string
  onApply?: (productId: string, amount: number, tenureMonths: number) => void
}

export default function LoanCalculatorWidget({
  products,
  defaultProductId,
  onApply
}: LoanCalculatorWidgetProps) {
  const [selectedProductId, setSelectedProductId] = useState(defaultProductId || products[0]?.id || '')
  
  const activeProduct = products.find(p => p.id === selectedProductId)

  const [amount, setAmount] = useState(activeProduct ? activeProduct.min_amount_myr : 10000)
  const [tenure, setTenure] = useState(activeProduct ? activeProduct.min_tenure_months : 12)
  const [result, setResult] = useState<LoanCalculationResult | null>(null)
  const [showSchedule, setShowSchedule] = useState(false)

  // Re-run whenever amount, tenure or selected product changes
  useEffect(() => {
    if (activeProduct) {
      // Ensure constraints
      let cleanAmount = amount
      if (amount < activeProduct.min_amount_myr) cleanAmount = activeProduct.min_amount_myr
      if (amount > activeProduct.max_amount_myr) cleanAmount = activeProduct.max_amount_myr

      let cleanTenure = tenure
      if (tenure < activeProduct.min_tenure_months) cleanTenure = activeProduct.min_tenure_months
      if (tenure > activeProduct.max_tenure_months) cleanTenure = activeProduct.max_tenure_months

      const calc = calculateLoan(cleanAmount, activeProduct.profit_rate_percent, cleanTenure)
      setResult(calc)
    }
  }, [amount, tenure, selectedProductId, activeProduct])

  // Reset when selected product changes
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    const newProd = products.find(p => p.id === productId)
    if (newProd) {
      setAmount(newProd.min_amount_myr)
      setTenure(newProd.min_tenure_months)
    }
  }

  if (products.length === 0 || !activeProduct) {
    return (
      <div className="p-6 text-center bg-navy-900/40 border border-white/5 rounded-xl text-gray-500 italic">
        Tiada skim pembiayaan aktif ditemui.
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl border border-white/5 p-6 space-y-6 relative overflow-hidden bg-gradient-to-br from-teal-neon/[0.01] to-transparent">
      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-neon/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-teal-neon" />
        <div>
          <h3 className="font-bold text-sm text-gray-200">Kalkulator Kelayakan Pinjaman MARA</h3>
          <p className="text-[10px] text-gray-500 font-bold uppercase">Kadar Untung Pengurangan Baki Amortisasi</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Loan Product Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Skim Pembiayaan</label>
          <select
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full bg-[#0b0f19] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500/50"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.profit_rate_percent}% Setahun)
              </option>
            ))}
          </select>
        </div>

        {/* Amount Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Jumlah Pembiayaan (RM)</label>
            <span className="font-black text-white">RM {amount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min={activeProduct.min_amount_myr}
            max={activeProduct.max_amount_myr}
            step={Math.max(1000, Math.round((activeProduct.max_amount_myr - activeProduct.min_amount_myr) / 100))}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-neon"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-bold">
            <span>RM {activeProduct.min_amount_myr.toLocaleString()}</span>
            <span>RM {activeProduct.max_amount_myr.toLocaleString()}</span>
          </div>
        </div>

        {/* Tenure Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tempoh Bayaran Balik</label>
            <span className="font-black text-white">{tenure} Bulan <span className="text-[10px] text-slate-500 font-normal">({(tenure / 12).toFixed(1)} Tahun)</span></span>
          </div>
          <input
            type="range"
            min={activeProduct.min_tenure_months}
            max={activeProduct.max_tenure_months}
            step={1}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-neon"
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-bold">
            <span>{activeProduct.min_tenure_months} Bulan</span>
            <span>{activeProduct.max_tenure_months} Bulan</span>
          </div>
        </div>
      </div>

      {/* Repayment Stats */}
      {result && (
        <div className="grid grid-cols-3 gap-3 bg-[#0b0f19]/80 p-4 border border-white/5 rounded-xl text-center">
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-slate-500 block uppercase">Ansuran Bulanan</span>
            <span className="text-sm font-black text-teal-neon">RM {result.monthlyInstallment.toLocaleString()}</span>
          </div>
          <div className="space-y-1 border-x border-white/5">
            <span className="text-[8px] font-bold text-slate-500 block uppercase">Jumlah Caj Untung</span>
            <span className="text-sm font-black text-gray-200">RM {result.totalProfit.toLocaleString()}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-bold text-slate-500 block uppercase">Jumlah Bayaran</span>
            <span className="text-sm font-black text-gray-200">RM {result.totalRepayment.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
        >
          <Calendar className="w-3.5 h-3.5" />
          {showSchedule ? 'Sembunyikan Jadual Bayaran' : 'Lihat Jadual Amortisasi'}
        </button>

        {onApply && (
          <button
            onClick={() => onApply(selectedProductId, amount, tenure)}
            className="w-full py-2.5 bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,242,254,0.2)] hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Mohon Pembiayaan Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expandable Amortization Schedule Table */}
      {showSchedule && result && (
        <div className="pt-4 border-t border-white/5 animate-fadeIn space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jadual Pengurangan Baki Pembiayaan</h4>
          <div className="max-h-60 overflow-y-auto pr-1 border border-white/5 rounded-lg custom-scrollbar">
            <table className="w-full text-left text-[10px] text-slate-400">
              <thead className="bg-[#0b0f19] text-[9px] text-slate-500 uppercase font-bold sticky top-0">
                <tr>
                  <th className="py-2 px-3">Bulan</th>
                  <th className="py-2 px-2 text-right">Ansuran</th>
                  <th className="py-2 px-2 text-right">Prinsipal</th>
                  <th className="py-2 px-2 text-right">Caj Untung</th>
                  <th className="py-2 px-3 text-right">Baki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {result.schedule.map((item) => (
                  <tr key={item.month} className="hover:bg-white/[0.01]">
                    <td className="py-2 px-3 font-sans text-slate-500">#{item.month}</td>
                    <td className="py-2 px-2 text-right text-teal-neon/90">RM{item.installment.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-300">RM{item.principal.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-gray-500">RM{item.profit.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-gray-400">RM{item.balance.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
