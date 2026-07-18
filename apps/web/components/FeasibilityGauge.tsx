'use client'

import SelfDeclaredBadge from './SelfDeclaredBadge'

interface FeasibilityGaugeProps {
  score: number
  tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan'
  scoreSource?: string
}

export default function FeasibilityGauge({ score, tier, scoreSource }: FeasibilityGaugeProps) {
  // Map score (0-100) to rotation angle for the needle (-90deg to 90deg)
  const angle = (score / 100) * 180 - 90

  // Determine color matching tier
  const getThemeColor = () => {
    switch (tier) {
      case 'Sangat Berpotensi':
        return { hex: '#10b981', text: 'text-green-400', border: 'border-green-500/20' }
      case 'Layak Komersial':
        return { hex: '#f0b800', text: 'text-mara-gold', border: 'border-mara-gold/20' }
      case 'Berpotensi Sederhana':
        return { hex: '#f59e0b', text: 'text-yellow-500', border: 'border-yellow-500/20' }
      case 'Perlu Bimbingan':
        return { hex: '#ef4444', text: 'text-red-500', border: 'border-red-500/20' }
    }
  }

  const theme = getThemeColor()

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-navy-900/40 rounded-xl border border-white/5 relative overflow-hidden">
      {/* Semi-circular gauge container */}
      <div className="relative w-64 h-36 flex items-center justify-center overflow-hidden">
        {/* SVG background track */}
        <svg className="absolute top-0 w-60 h-60" viewBox="0 0 200 200">
          {/* Base Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1e293b"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Fill Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={theme.hex}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (score / 100) * 251.2}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Needle */}
        <div
          className="absolute bottom-0 w-2 h-20 origin-bottom transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${angle}deg)`, bottom: '2px' }}
        >
          <div className="w-1.5 h-16 bg-gray-200 rounded-full mx-auto shadow-md" />
          <div className="w-4 h-4 bg-gray-100 rounded-full absolute bottom-[-4px] left-1/2 -translate-x-1/2 border border-navy-950" />
        </div>
      </div>

      {/* Score Text */}
      <div className="text-center z-10 mt-2 flex flex-col items-center">
        <div className="flex items-baseline justify-center">
          <span className={`text-4xl font-black ${theme.text}`}>{score}</span>
          <span className="text-xs text-gray-500 font-bold ml-1">%</span>
        </div>
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">Indeks Kebolehsanaan</p>
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className={`inline-block text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border tracking-widest ${theme.border} ${theme.text}`}>
            {tier}
          </span>
          {scoreSource === 'self_declared' && (
            <SelfDeclaredBadge />
          )}
        </div>
      </div>
    </div>
  )
}
