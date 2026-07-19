'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Wallet, TrendingUp, CalendarClock } from 'lucide-react'

interface ScheduleItem {
  month: number
  installment: number
  principal: number
  profit: number
  balance: number
}

export default function RepaymentScheduleCard({
  monthlyInstallment,
  totalRepayment,
  totalProfit,
  schedule,
}: {
  monthlyInstallment: number
  totalRepayment: number
  totalProfit: number
  schedule: ScheduleItem[]
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="p-4 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-4">
      <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
        <Wallet className="w-3.5 h-3.5" />
        Jadual Bayaran Balik Geran/Pembiayaan
      </h4>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-850 text-center">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Ansuran Bulanan</span>
          <span className="text-sm font-extrabold text-slate-100">RM{monthlyInstallment.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-850 text-center">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Jumlah Bayaran Balik</span>
          <span className="text-sm font-extrabold text-slate-100">RM{totalRepayment.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-850 text-center">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Jumlah Keuntungan/Faedah</span>
          <span className="text-sm font-extrabold text-slate-100">RM{totalProfit.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 py-1.5 transition cursor-pointer"
      >
        <CalendarClock className="w-3.5 h-3.5" />
        {expanded ? 'Sembunyikan Jadual Penuh' : `Lihat Jadual Penuh (${schedule.length} Bulan)`}
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-900">
          <table className="w-full text-[11px]">
            <thead className="sticky top-0 bg-slate-900 text-slate-500 uppercase">
              <tr>
                <th className="text-left font-bold px-3 py-2">Bulan</th>
                <th className="text-right font-bold px-3 py-2">Ansuran</th>
                <th className="text-right font-bold px-3 py-2">Prinsipal</th>
                <th className="text-right font-bold px-3 py-2">Keuntungan</th>
                <th className="text-right font-bold px-3 py-2">Baki</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.month} className="border-t border-slate-900 text-slate-300">
                  <td className="px-3 py-1.5">{row.month}</td>
                  <td className="px-3 py-1.5 text-right">{row.installment.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right">{row.principal.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right text-slate-500">{row.profit.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-right font-bold">{row.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[10px] text-slate-500 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        Anggaran dijana automatik berdasarkan amaun & tenure yang diluluskan pegawai MARA.
      </p>
    </div>
  )
}
