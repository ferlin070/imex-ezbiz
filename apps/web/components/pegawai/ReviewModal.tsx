'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock3, Loader2, X, Landmark } from 'lucide-react'

type ReviewStatus = 'approved' | 'rejected' | 'under_review'

const ACTION_CONFIG: Record<ReviewStatus, { label: string; icon: any; color: string; confirmLabel: string }> = {
  approved: {
    label: 'Luluskan',
    icon: CheckCircle2,
    color: 'emerald',
    confirmLabel: 'Sahkan Kelulusan',
  },
  rejected: {
    label: 'Tolak',
    icon: XCircle,
    color: 'rose',
    confirmLabel: 'Sahkan Penolakan',
  },
  under_review: {
    label: 'Tanda Dalam Semakan',
    icon: Clock3,
    color: 'amber',
    confirmLabel: 'Sahkan',
  },
}

export default function ReviewModal({
  applicationId,
  requestedAmount,
  requestedTenure,
  currentStatus,
}: {
  applicationId: string
  requestedAmount: number
  requestedTenure: number
  currentStatus: string
}) {
  const router = useRouter()
  const [activeAction, setActiveAction] = useState<ReviewStatus | null>(null)
  const [officerNotes, setOfficerNotes] = useState('')
  const [approvedAmount, setApprovedAmount] = useState(String(requestedAmount))
  const [approvedTenure, setApprovedTenure] = useState(String(requestedTenure))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const closeModal = () => {
    setActiveAction(null)
    setOfficerNotes('')
    setError('')
  }

  const handleSubmit = async () => {
    if (!activeAction) return
    if (officerNotes.trim().length < 3) {
      setError('Sila nyatakan ulasan pegawai (min 3 aksara).')
      return
    }
    setSubmitting(true)
    setError('')

    try {
      const payload: Record<string, unknown> = {
        status: activeAction,
        officerNotes: officerNotes.trim(),
      }
      if (activeAction === 'approved') {
        payload.approvedAmountMyr = Number(approvedAmount)
        payload.approvedTenureMonths = Number(approvedTenure)
      }

      const res = await fetch(`/api/loans/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal memproses ulasan.')
      } else {
        closeModal()
        router.refresh()
      }
    } catch {
      setError('Ralat rangkaian. Sila cuba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (currentStatus === 'approved' || currentStatus === 'rejected') {
    return null
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {(['approved', 'under_review', 'rejected'] as ReviewStatus[]).map((status) => {
          const cfg = ACTION_CONFIG[status]
          const Icon = cfg.icon
          return (
            <button
              key={status}
              onClick={() => setActiveAction(status)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer
                ${status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : ''}
                ${status === 'rejected' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' : ''}
                ${status === 'under_review' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : ''}
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </button>
          )
        })}
      </div>

      {activeAction && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-850">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-mara-gold" />
                <h3 className="font-extrabold text-white text-sm">{ACTION_CONFIG[activeAction].confirmLabel}</h3>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {activeAction === 'approved' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Amaun Diluluskan (RM)</label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Tenure (Bulan)</label>
                    <input
                      type="number"
                      value={approvedTenure}
                      onChange={(e) => setApprovedTenure(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Ulasan Pegawai <span className="text-rose-400">*</span></label>
                <textarea
                  rows={3}
                  value={officerNotes}
                  onChange={(e) => setOfficerNotes(e.target.value)}
                  placeholder="Nyatakan justifikasi keputusan..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-slate-600 transition resize-none"
                />
              </div>

              {error && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-mara-red hover:bg-mara-red/80 text-white transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {ACTION_CONFIG[activeAction].confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
