import Link from 'next/link'
import { FileCheck2, FileX2, ArrowRight } from 'lucide-react'

const DOC_TYPES = [
  { label: 'Sijil SSM', key: 'ssm_cert' },
  { label: 'Rancangan Perniagaan', key: 'business_plan' },
  { label: 'Penyata Bank', key: 'bank_statement' },
  { label: 'Kad Pengenalan', key: 'ic_copy' },
] as const

export default function DocumentChecklistMini({ uploadedDocTypes }: { uploadedDocTypes: string[] }) {
  const uploadedCount = DOC_TYPES.filter((d) => uploadedDocTypes.includes(d.key)).length
  const total = DOC_TYPES.length
  const complete = uploadedCount === total

  return (
    <Link
      href="/usahawan/syarikat"
      className="block p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-mara-gold/40 transition group space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          {complete ? (
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <FileX2 className="w-4 h-4 text-amber-400" />
          )}
          Dokumen Wajib
        </h3>
        <span className={`text-xs font-black ${complete ? 'text-emerald-400' : 'text-amber-400'}`}>
          {uploadedCount}/{total}
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${complete ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${(uploadedCount / total) * 100}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {DOC_TYPES.map((d) => {
          const done = uploadedDocTypes.includes(d.key)
          return (
            <span
              key={d.key}
              className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                done
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {d.label}
            </span>
          )
        })}
      </div>

      <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 group-hover:text-mara-gold transition">
        {complete ? 'Lihat / Kemaskini dokumen' : 'Muat naik dokumen yang tertinggal'}
        <ArrowRight className="w-3 h-3" />
      </span>
    </Link>
  )
}
