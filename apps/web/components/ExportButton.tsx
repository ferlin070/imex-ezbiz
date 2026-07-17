'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function ExportButton() {
  const [downloading, setDownloading] = useState(false)

  const handleExport = () => {
    setDownloading(true)
    // Direct location redirect for browser file attachment download
    window.location.href = '/api/mara/export'
    // Fake loading delay to provide feedback to user
    setTimeout(() => {
      setDownloading(false)
    }, 2000)
  }

  return (
    <button
      onClick={handleExport}
      disabled={downloading}
      className="px-4 py-2 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
    >
      {downloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Mengeksport...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Eksport Excel (CSV)</span>
        </>
      )}
    </button>
  )
}
