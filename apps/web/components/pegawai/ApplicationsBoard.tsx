'use client'

import { useMemo, useState } from 'react'
import {
  Search, ShieldAlert, CheckCircle, AlertTriangle, XCircle,
  Clock3, FileCheck2, Ban,
} from 'lucide-react'
import ReviewModal from './ReviewModal'
import CompanyProfileModal from './CompanyProfileModal'

export interface ApplicationRow {
  id: string
  requestedAmount: number
  requestedTenure: number
  status: string
  eligibilityStatus: string | null
  createdAt: string
  loanProductName: string
  businessName: string
  ssmNumber: string
  ownerFullName: string
  ownerEmail: string
  ownerId: string
  checks: Record<string, any>
  aiActionPlan: string | null
  wasBlockedByGuardrail: boolean
  officerNotes: string | null
  approvedAmount: number | null
  approvedTenure: number | null
  company: Record<string, any>
}

const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Tindakan' },
  { key: 'approved', label: 'Diluluskan' },
  { key: 'rejected', label: 'Ditolak' },
]

function ReviewStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: any; cls: string }> = {
    approved: { label: 'DILULUSKAN', icon: FileCheck2, cls: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
    rejected: { label: 'DITOLAK', icon: Ban, cls: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
    under_review: { label: 'DALAM SEMAKAN', icon: Clock3, cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    submitted: { label: 'MENUNGGU TINDAKAN', icon: Clock3, cls: 'bg-sky-500/10 border-sky-500/20 text-sky-400' },
    draft: { label: 'DRAF', icon: Clock3, cls: 'bg-slate-500/10 border-slate-500/20 text-slate-400' },
  }
  const cfg = map[status] || map.submitted
  const Icon = cfg.icon
  return (
    <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border ${cfg.cls}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

export default function ApplicationsBoard({ applications }: { applications: ApplicationRow[] }) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')

  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesTab =
        tab === 'all' ||
        (tab === 'pending' && (app.status === 'submitted' || app.status === 'under_review')) ||
        tab === app.status
      if (!matchesTab) return false

      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        app.businessName?.toLowerCase().includes(q) ||
        app.ssmNumber?.toLowerCase().includes(q) ||
        app.ownerFullName?.toLowerCase().includes(q) ||
        app.ownerEmail?.toLowerCase().includes(q)
      )
    })
  }, [applications, tab, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                tab === t.key
                  ? 'bg-mara-red/10 border-mara-red/40 text-mara-red'
                  : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama syarikat, SSM, atau usahawan..."
            className="w-full bg-slate-900/40 border border-slate-850 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 outline-none focus:border-mara-gold/50 transition"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/40 border border-slate-905 text-slate-500 text-sm">
          Tiada permohonan sepadan dengan carian/tapisan semasa.
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((app) => {
            const checks = app.checks || {}
            return (
              <div
                key={app.id}
                className="p-6 bg-slate-900/20 border border-slate-850 rounded-2xl space-y-6 hover:border-slate-800 transition"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-850">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-base text-white">
                        {app.businessName || 'Syarikat Belum Dinamakan'}
                      </h3>
                      <span className="text-xs bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        SSM: {app.ssmNumber || 'Tiada'}
                      </span>
                      <ReviewStatusBadge status={app.status} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Pemohon: {app.ownerFullName || '-'} ({app.ownerEmail})
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Skim Diminta</span>
                      <span className="text-sm font-extrabold text-slate-200">{app.loanProductName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Amaun & Tenure</span>
                      <span className="text-sm font-extrabold text-slate-200">
                        RM{Number(app.requestedAmount).toLocaleString()} ({app.requestedTenure} Bulan)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                      {app.eligibilityStatus === 'LULUS' && (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-black text-emerald-400">LULUS RULES</span>
                        </>
                      )}
                      {app.eligibilityStatus === 'TIDAK_LULUS' && (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-black text-rose-400">TIDAK LULUS</span>
                        </>
                      )}
                      {app.eligibilityStatus === 'PERLU_TINDAKAN' && (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black text-amber-400">PERLU TINDAKAN</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Hasil Semakan Rules Engine</h4>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Had Umur Pemilik (18 - 60):</span>
                        <span className={checks.agePassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {app.company.owner_age || '-'} Tahun ({checks.agePassed ? 'Lepas' : 'Gagal'})
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Status Bumiputera:</span>
                        <span className={checks.bumiputeraPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {app.company.is_bumiputera ? 'Ya' : 'Bukan'} ({checks.bumiputeraPassed ? 'Lepas' : 'Gagal'})
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Pendaftaran SSM (Aktif):</span>
                        <span className={checks.ssmActivePassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {checks.ssmActivePassed ? 'Aktif' : 'Tidak Aktif/Gagal'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Tempoh Matang Bisnes (Haul):</span>
                        <span className={checks.haulPassed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {checks.haulDurationMonths !== undefined ? `${checks.haulDurationMonths} Bulan` : 'Gagal'} ({checks.haulPassed ? 'Lepas' : 'Gagal'})
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Dokumen Wajib Dimuat Naik:</span>
                        <span className={checks.documentsPassed ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {checks.documentsPassed ? 'Lengkap' : 'Tidak Lengkap'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Syor & Pelan Tindakan AI</h4>
                      {app.wasBlockedByGuardrail && (
                        <span className="flex items-center gap-1 text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-black">
                          <ShieldAlert className="w-3 h-3" />
                          Guardrail Blocked competitor leakage
                        </span>
                      )}
                    </div>
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-900 text-xs text-slate-300 leading-relaxed max-h-[160px] overflow-y-auto whitespace-pre-wrap">
                      {app.aiActionPlan || 'Tiada pelan tindakan AI dihasilkan.'}
                    </div>
                  </div>
                </div>

                {(app.status === 'approved' || app.status === 'rejected') && (
                  <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 text-xs space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Rekod Keputusan Pegawai</span>
                    {app.status === 'approved' && (
                      <p className="text-slate-300">
                        Diluluskan: RM{Number(app.approvedAmount).toLocaleString()} ({app.approvedTenure} Bulan)
                      </p>
                    )}
                    {app.officerNotes && <p className="text-slate-400 italic">"{app.officerNotes}"</p>}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-850">
                  <CompanyProfileModal ownerId={app.ownerId} ownerEmail={app.ownerEmail} company={app.company} />
                  <ReviewModal
                    applicationId={app.id}
                    requestedAmount={app.requestedAmount}
                    requestedTenure={app.requestedTenure}
                    currentStatus={app.status}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
