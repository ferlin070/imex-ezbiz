import { ClipboardList } from 'lucide-react'

interface SelfDeclaredBadgeProps {
  className?: string
}

export default function SelfDeclaredBadge({ className = '' }: SelfDeclaredBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900 text-slate-400 border border-slate-800 tracking-wide ${className}`}>
      <ClipboardList className="w-3 h-3 text-slate-400" />
      Penilaian Kendiri
    </span>
  )
}
