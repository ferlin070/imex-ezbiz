'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Landmark, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Loader2, MessageSquare, Save, Calendar, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Application {
  id: string
  project_id: string
  loan_product_id: string
  requested_amount_myr: number
  requested_tenure_months: number
  purpose: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  officer_id: string | null
  officer_notes: string | null
  approved_amount_myr: number | null
  approved_tenure_months: number | null
  approved_rate_percent: number | null
  reviewed_at: string | null
  created_at: string
  project_title: string
  project_category: string
  project_state: string
  project_institution: string
  owner_name: string
  owner_email: string
  loan_product_name: string
  profit_rate_percent: number
  monthly_installment_myr: number
  total_repayment_myr: number
  total_profit_myr: number
}

export default function InboxPage() {
  const router = useRouter()
  const supabase = createClient()

  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [userName, setUserName] = useState('Pegawai MARA')

  // Review states
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'under_review'>('under_review')
  const [approvedAmount, setApprovedAmount] = useState<number>(0)
  const [approvedTenure, setApprovedTenure] = useState<number>(0)
  const [officerNotes, setOfficerNotes] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Get current user profile
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single()
        if (profile) {
          if (profile.role !== 'mara_officer' && profile.role !== 'admin') {
            router.push('/login')
            return
          }
          setUserName(profile.name)
        }
      } else {
        router.push('/mara/login')
      }
    }
    getProfile()
  }, [router, supabase])

  const fetchApplications = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/mara/inbox')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuatkan permohonan pinjaman.')
      setApplications(data.applications || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa memproses permohonan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const startReview = (app: Application) => {
    setReviewingId(app.id)
    setReviewStatus(app.status === 'submitted' ? 'under_review' : (app.status as any))
    setApprovedAmount(app.approved_amount_myr || app.requested_amount_myr)
    setApprovedTenure(app.approved_tenure_months || app.requested_tenure_months)
    setOfficerNotes(app.officer_notes || '')
    setSuccessMsg('')
    setErrorMsg('')
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewingId) return

    setSubmittingReview(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch(`/api/loans/${reviewingId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewStatus,
          officerNotes,
          approvedAmountMyr: reviewStatus === 'approved' ? Number(approvedAmount) : undefined,
          approvedTenureMonths: reviewStatus === 'approved' ? Number(approvedTenure) : undefined
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghantar ulasan.')

      setSuccessMsg('Penilaian dan ulasan permohonan berjaya disimpan!')
      setReviewingId(null)
      fetchApplications()
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa menghantar ulasan.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleLogout = async () => {
    document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await supabase.auth.signOut()
    router.push('/mara/login')
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-white">MARA Talent Scout</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Konsol Pemantauan & Pencarian Prospek</p>
          </div>
        </div>

        {/* Portal Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="/search" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Carian Calon
          </a>
          <a href="/shortlist" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Senarai Pendek
          </a>
          <a href="/analytics" className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-wider">
            Analitis Prospek
          </a>
          <a href="/inbox" className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase tracking-wider">
            Permohonan Pinjaman
          </a>
        </nav>

        {/* User profile & logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200">{userName}</p>
            <p className="text-[9px] text-slate-500 font-semibold uppercase">Pegawai MARA</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Log Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-500" />
              Peti Masuk Permohonan Pinjaman Usahawan
            </h2>
            <p className="text-xs text-slate-400">Semak permohonan dana dan kemukakan kelulusan rasmi</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Menarik permohonan...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/5 p-12 text-center flex flex-col items-center gap-4 bg-navy-950/10">
            <Landmark className="w-10 h-10 text-slate-600" />
            <div>
              <h3 className="font-bold text-slate-300">Tiada Permohonan Dijumpai</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Tiada usahawan mengemukakan permohonan pinjaman atau geran melalui sistem buat masa ini.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => {
              const isSelected = reviewingId === app.id
              const isApproved = app.status === 'approved'
              const isRejected = app.status === 'rejected'
              const isPending = app.status === 'submitted' || app.status === 'under_review'

              return (
                <div
                  key={app.id}
                  className={`p-6 rounded-2xl border transition-all flex flex-col gap-4 relative overflow-hidden bg-navy-900/25 ${
                    isSelected ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'border-white/5'
                  }`}
                >
                  {/* Status Banner */}
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                        {app.loan_product_name}
                      </span>
                      <h3 className="font-extrabold text-sm text-white mt-1.5">{app.project_title}</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Usahawan: <strong className="text-slate-300">{app.owner_name}</strong> ({app.owner_email})</p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border tracking-wider uppercase ${
                        isApproved ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                        isRejected ? 'bg-red-500/10 border-red-500/25 text-red-400' :
                        'bg-blue-500/10 border-blue-500/25 text-blue-400'
                      }`}>
                        {app.status === 'submitted' ? 'Baru' : app.status === 'under_review' ? 'Disemak' : app.status === 'approved' ? 'Lulus' : 'Ditolak'}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold font-mono">
                        {new Date(app.created_at).toLocaleDateString('ms-MY')}
                      </span>
                    </div>
                  </div>

                  {/* Summary of Request */}
                  <div className="bg-[#0b0f19]/60 p-4 border border-white/5 rounded-xl space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 block uppercase">Jumlah Dimohon</span>
                        <span className="text-xs font-black text-white">RM {app.requested_amount_myr.toLocaleString()}</span>
                      </div>
                      <div className="border-x border-white/5">
                        <span className="text-[8px] font-bold text-slate-500 block uppercase">Ansuran Simpanan</span>
                        <span className="text-xs font-black text-amber-500/90">RM {app.monthly_installment_myr.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 block uppercase">Tempoh</span>
                        <span className="text-xs font-black text-white">{app.requested_tenure_months} Bulan</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-white/5">
                      <span className="text-[8px] font-bold text-slate-500 block uppercase mb-1">Tujuan Pembiayaan</span>
                      <p className="text-xs text-slate-400 leading-relaxed">{app.purpose}</p>
                    </div>
                  </div>

                  {/* Action Review Area */}
                  {isSelected ? (
                    <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-white/5 space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Keputusan</label>
                          <select
                            value={reviewStatus}
                            onChange={(e) => setReviewStatus(e.target.value as any)}
                            className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
                          >
                            <option value="under_review">Kekalkan Semakan (Under Review)</option>
                            <option value="approved">Luluskan Permohonan</option>
                            <option value="rejected">Tolak Permohonan</option>
                          </select>
                        </div>

                        {reviewStatus === 'approved' && (
                          <>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Jumlah Diluluskan (RM)</label>
                              <input
                                type="number"
                                required
                                value={approvedAmount}
                                onChange={(e) => setApprovedAmount(Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Tempoh Diluluskan (Bulan)</label>
                              <input
                                type="number"
                                required
                                value={approvedTenure}
                                onChange={(e) => setApprovedTenure(Number(e.target.value))}
                                className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                              />
                            </div>
                          </>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5">Ulasan Pegawai (Wajib)</label>
                        <textarea
                          required
                          value={officerNotes}
                          onChange={(e) => setOfficerNotes(e.target.value)}
                          placeholder="Masukkan nota ulasan kelulusan atau sebab penolakan..."
                          rows={3}
                          className="w-full bg-[#0b0f19] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-[#020617] text-xs font-bold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Simpan Keputusan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewingId(null)}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center pt-2">
                      {app.officer_notes && (
                        <div className="text-xs text-slate-500 flex items-start gap-1">
                          <MessageSquare className="w-4 h-4 text-amber-500/40 mt-0.5 shrink-0" />
                          <p className="italic">Ulasan: "{app.officer_notes}"</p>
                        </div>
                      )}
                      <button
                        onClick={() => startReview(app)}
                        className="ml-auto px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/30 text-xs font-bold text-slate-300 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>{app.status === 'submitted' ? 'Mula Semakan' : 'Kemaskini Semakan'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
