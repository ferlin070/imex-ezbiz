import { ShieldCheck, ShieldAlert, ShieldX, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'
import type { EligibilityResult } from '@services/eligibility-engine'

export default function ReadinessCheckCard({
  result,
  hasCompanyProfile,
}: {
  result: EligibilityResult | null
  hasCompanyProfile: boolean
}) {
  if (!hasCompanyProfile || !result) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          Semakan Kesediaan Kelayakan
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Lengkapkan profil syarikat dahulu untuk melihat semakan kesediaan kelayakan geran/pembiayaan MARA anda secara automatik.
        </p>
      </div>
    )
  }

  const failedCriteria = result.criteria.filter((c) => !c.passed)
  const verdictConfig = result.eligible
    ? { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Sedia Untuk Memohon' }
    : failedCriteria.length <= 1
      ? { icon: ShieldAlert, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: 'Hampir Sedia — Ada Tindakan Diperlukan' }
      : { icon: ShieldX, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: 'Belum Memenuhi Kriteria' }

  const VerdictIcon = verdictConfig.icon

  return (
    <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-mara-gold" />
          Semakan Kesediaan Kelayakan
        </h3>
      </div>

      <div className={`flex items-center gap-2 p-3 rounded-xl border ${verdictConfig.bg}`}>
        <VerdictIcon className={`w-5 h-5 shrink-0 ${verdictConfig.color}`} />
        <span className={`text-xs font-black ${verdictConfig.color}`}>{verdictConfig.label}</span>
      </div>

      <div className="space-y-2">
        {result.criteria.map((c, i) => (
          <div key={i} className="flex items-start justify-between gap-3 text-xs py-1.5 border-b border-slate-850 last:border-0">
            <div className="flex items-start gap-2 min-w-0">
              {c.passed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <span className="text-slate-300 font-semibold block">{c.name}</span>
                <span className="text-slate-500 text-[10px]">Perlu: {c.required}</span>
              </div>
            </div>
            <span className={`shrink-0 font-bold ${c.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{c.actual}</span>
          </div>
        ))}
      </div>

      {!result.eligible && (
        <div className="pt-1">
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">{result.reason}</p>
          <Link
            href="/usahawan/syarikat"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-mara-gold hover:underline"
          >
            Kemaskini Profil Syarikat / Dokumen →
          </Link>
        </div>
      )}
    </div>
  )
}
