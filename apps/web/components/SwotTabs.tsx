'use client'

import { useState } from 'react'
import { CheckCircle, AlertOctagon, TrendingUp, AlertTriangle } from 'lucide-react'

interface SwotData {
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  threats: string[]
}

interface SwotTabsProps {
  swot: SwotData
}

export default function SwotTabs({ swot }: SwotTabsProps) {
  const [activeTab, setActiveTab] = useState<'strengths' | 'weaknesses' | 'opportunities' | 'threats'>('strengths')

  const tabConfig = {
    strengths: {
      label: 'Kekuatan (S)',
      color: 'text-green-400 border-green-500/20 bg-green-500/5',
      indicator: 'bg-green-500',
      icon: <CheckCircle className="w-4 h-4 text-green-400" />,
      title: 'Kekuatan Projek',
      desc: 'Kelebihan dan keunikan produk inovasi anda yang memberi nilai tambah bersaing.'
    },
    weaknesses: {
      label: 'Kelemahan (W)',
      color: 'text-mara-red border-mara-red/20 bg-mara-red/5',
      indicator: 'bg-mara-red',
      icon: <AlertOctagon className="w-4 h-4 text-mara-red" />,
      title: 'Kelemahan & Limitasi',
      desc: 'Kekurangan reka bentuk, kos, atau kebergantungan teknikal yang perlu diperbaiki.'
    },
    opportunities: {
      label: 'Peluang (O)',
      color: 'text-mara-gold border-mara-gold/20 bg-mara-gold/5',
      indicator: 'bg-mara-gold',
      icon: <TrendingUp className="w-4 h-4 text-mara-gold" />,
      title: 'Peluang Pasaran',
      desc: 'Potensi pengembangan pasaran, pembiayaan, kerjasama industri, dan permintaan semasa.'
    },
    threats: {
      label: 'Ancaman (T)',
      color: 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
      indicator: 'bg-yellow-500',
      icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      title: 'Ancaman Luaran',
      desc: 'Cabaran pasaran, persaingan sengit, peraturan ketat, dan kekangan bekalan bahan mentah.'
    }
  }

  const activeConf = tabConfig[activeTab]
  const activeList = swot[activeTab] || []

  return (
    <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Analisis SWOT Perniagaan</h2>
        <span className="text-[10px] text-gray-500 font-semibold uppercase">Hasil Analisis AI Gemini</span>
      </div>

      {/* Tab Selectors */}
      <div className="grid grid-cols-4 gap-1 bg-navy-900/60 p-1 rounded-lg border border-white/5">
        {(Object.keys(tabConfig) as Array<keyof typeof tabConfig>).map((key) => {
          const isSelected = key === activeTab
          const conf = tabConfig[key]
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-2 text-[10px] sm:text-xs font-extrabold rounded transition-all text-center flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-white/5 text-white border border-white/10 font-black shadow-inner'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {conf.icon}
              <span className="hidden sm:inline">{conf.label.split(' ')[0]}</span>
              <span className="sm:hidden">{conf.label.match(/\((.*?)\)/)?.[1]}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panel */}
      <div className={`border border-white/5 rounded-xl p-5 ${activeConf.color} transition-all duration-300`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block p-1 rounded bg-navy-950/60 border border-white/5">
            {activeConf.icon}
          </span>
          <h3 className="font-extrabold text-sm text-gray-200">{activeConf.title}</h3>
        </div>
        <p className="text-[11px] text-gray-400 mb-4">{activeConf.desc}</p>

        <ul className="space-y-3">
          {activeList.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 items-start">
              <span className={`w-1.5 h-1.5 rounded-full ${activeConf.indicator} mt-1.5 shrink-0`} />
              <span className="text-xs text-gray-300 leading-relaxed">{item}</span>
            </li>
          ))}
          {activeList.length === 0 && (
            <li className="text-xs text-gray-500 italic">Tiada maklumat dijana.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
