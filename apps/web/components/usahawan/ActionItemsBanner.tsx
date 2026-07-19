import { ListChecks, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export interface ActionItem {
  text: string
  href: string
  ctaLabel: string
}

export default function ActionItemsBanner({ items }: { items: ActionItem[] }) {
  if (items.length === 0) return null

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-r from-mara-red/10 to-mara-gold/5 border border-mara-red/20 space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-mara-gold" />
        Tindakan Diperlukan Untuk Tingkatkan Peluang Geran Anda
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-xs bg-slate-950/40 rounded-xl px-3 py-2.5">
            <span className="text-slate-300">{item.text}</span>
            <Link
              href={item.href}
              className="shrink-0 flex items-center gap-1 text-[11px] font-black text-mara-gold hover:underline"
            >
              {item.ctaLabel} <ArrowRight className="w-3 h-3" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
