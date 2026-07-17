'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Save, Loader2, ShieldAlert } from 'lucide-react'

interface EvaluateFormProps {
  projectId: string
  initialScore: number
  initialComment: string
}

export default function EvaluateForm({
  projectId,
  initialScore,
  initialComment,
}: EvaluateFormProps) {
  const router = useRouter()
  const [score, setScore] = useState<number>(initialScore)
  const [comment, setComment] = useState(initialComment)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccess(false)

    try {
      const response = await fetch(`/api/projects/${projectId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score,
          comment,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mendaftar penilaian.')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/juror')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat server semasa menyimpan penilaian.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-800 backdrop-blur-sm animate-fade-in">
        <CheckCircle className="h-16 w-16 text-teal-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-100">Penilaian Berjaya Disimpan!</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Markah dan maklum balas anda telah disimpan ke pangkalan data. Kembali ke Konsol Penilaian...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMsg && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <ShieldAlert className="h-5 w-5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Score Slider & Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-semibold text-slate-350">
              Pemberian Markah Inovasi (0 - 100) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={score}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (val >= 0 && val <= 100) {
                    setScore(val)
                  }
                }}
                className="w-16 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-center text-sm text-teal-400 font-bold focus:outline-none focus:border-teal-500"
              />
              <span className="text-sm font-bold text-slate-500">%</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">0%</span>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="flex-1 accent-teal-500 h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-slate-500">100%</span>
          </div>
        </div>

        {/* Comment textarea */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-350">Ulasan & Cadangan Penambahbaikan</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tulis ulasan juri penilai, kelebihan inovasi, dan perkara yang boleh ditambahbaik..."
            rows={6}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
          ></textarea>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
              Menyimpan Penilaian...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 text-slate-900" />
              Simpan Penilaian
            </>
          )}
        </button>
      </form>
    </div>
  )
}
