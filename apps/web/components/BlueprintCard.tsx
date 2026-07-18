'use client'

import { Cpu, BarChart4, DollarSign } from 'lucide-react'

interface BlueprintData {
  technical: string[]
  marketing: string[]
  financial: string[]
}

interface BlueprintCardProps {
  blueprint: BlueprintData
}

export default function BlueprintCard({ blueprint }: BlueprintCardProps) {
  const sections = [
    {
      title: 'Blueprint Teknikal',
      icon: <Cpu className="w-4 h-4 text-mara-gold" />,
      items: blueprint.technical || [],
      bgColor: 'bg-mara-gold/5',
      borderColor: 'border-mara-gold/10',
      tagColor: 'text-mara-gold bg-mara-gold/5 border-mara-gold/20',
      description: 'Langkah pembangunan kejuruteraan, integrasi sistem, dan kawalan mutu.'
    },
    {
      title: 'Blueprint Pemasaran',
      icon: <BarChart4 className="w-4 h-4 text-mara-red" />,
      items: blueprint.marketing || [],
      bgColor: 'bg-mara-red/5',
      borderColor: 'border-mara-red/10',
      tagColor: 'text-mara-red bg-mara-red/5 border-mara-red/20',
      description: 'Strategi pemasaran sasaran, pelancaran produk, dan pemerolehan pelanggan.'
    },
    {
      title: 'Blueprint Kewangan',
      icon: <DollarSign className="w-4 h-4 text-yellow-500" />,
      items: blueprint.financial || [],
      bgColor: 'bg-yellow-500/5',
      borderColor: 'border-yellow-500/10',
      tagColor: 'text-yellow-500 bg-yellow-950/50 border-yellow-800/30',
      description: 'Pengurusan aliran tunai, pengoptimuman kos, dan pembiayaan luar.'
    }
  ]

  return (
    <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Blueprint Tindakan Komersial</h2>
        <span className="text-[10px] text-gray-500 font-semibold uppercase">3 Seksyen Utama</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className={`border rounded-xl p-5 flex flex-col gap-4 transition-all duration-300 ${sec.bgColor} ${sec.borderColor}`}
          >
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-black border ${sec.tagColor}`}>
                {sec.icon}
                <span>{sec.title}</span>
              </span>
            </div>
            <p className="text-[10px] text-gray-500 leading-normal">{sec.description}</p>

            <ul className="space-y-3 flex-1 flex flex-col justify-start">
              {sec.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-navy-950 border border-white/10 text-[9px] font-black text-gray-400 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-300 leading-relaxed">{item}</span>
                </li>
              ))}
              {sec.items.length === 0 && (
                <li className="text-xs text-gray-500 italic">Tiada blueprint dijana.</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
