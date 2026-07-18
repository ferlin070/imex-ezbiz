'use client'

import { useState } from 'react'
import { Copy, Check, MessageSquareCode, Sparkles } from 'lucide-react'

interface PitchGeneratorProps {
  pitchScript: string
}

export default function PitchGenerator({ pitchScript }: PitchGeneratorProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pitchScript)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col gap-4 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-mara-gold/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareCode className="w-5 h-5 text-mara-red" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Skrip Pitching Pelabur (60 Saat)</h2>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-mara-red/10 border border-mara-red/20 text-[9px] text-mara-gold font-extrabold uppercase">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>Hook-Problem-Solution-CTA</span>
        </span>
      </div>

      <div className="relative bg-navy-950/80 border border-white/5 rounded-xl p-4">
        <textarea
          readOnly
          value={pitchScript}
          className="w-full h-40 bg-transparent text-xs text-gray-300 focus:outline-none resize-none leading-relaxed overflow-y-auto pr-1"
        />

        {/* Floating Copy Button */}
        <button
          onClick={handleCopy}
          className={`absolute bottom-3 right-3 p-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            copied
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-navy-900/80 border-white/10 hover:border-mara-red text-gray-400 hover:text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Disalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Salin Skrip</span>
            </>
          )}
        </button>
      </div>

      <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider px-1">
        <span>0s (Hook)</span>
        <span>20s (Problem)</span>
        <span>40s (Solution)</span>
        <span>60s (CTA)</span>
      </div>
    </div>
  )
}
