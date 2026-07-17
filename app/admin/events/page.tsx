import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, MapPin, Trophy, Plus, ArrowRight } from 'lucide-react'
import AddEventForm from './AddEventForm'

export const dynamic = 'force-dynamic'

export default async function AdminEventsPage() {
  const supabase = await createClient()

  // Fetch all events
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  const statusMap: Record<string, { label: string; bg: string }> = {
    draft: { label: 'Draf', bg: 'bg-slate-800 text-slate-400 border-slate-700' },
    open: { label: 'Dibuka', bg: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
    closed: { label: 'Ditutup', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    completed: { label: 'Selesai', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-teal-400" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Pengurusan Event & Penjurian
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cipta event baharu, lantik juri penilai, dan urus status penyertaan projek usahawan.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Left/Main Column: Event List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-200">Senarai Event Semasa</h2>

          {error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              Gagal memuatkan senarai event. Sila muat semula halaman.
            </div>
          ) : !events || events.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
              Tiada event ditemui. Mulakan dengan mencipta event baharu di panel sebelah.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((evt: any) => {
                const statusConfig = statusMap[evt.status || 'draft'] || statusMap.draft
                const startDateStr = evt.start_date 
                  ? new Date(evt.start_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Tiada Tarikh'
                const endDateStr = evt.end_date 
                  ? new Date(evt.end_date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Tiada Tarikh'

                return (
                  <div
                    key={evt.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-950/65 transition-all duration-200 gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-200 text-lg leading-tight">{evt.name}</h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusConfig.bg}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span>{evt.venue || 'Lokasi belum ditetapkan'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-500" />
                          <span>{startDateStr} - {endDateStr}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/admin/events/${evt.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-xl transition-all duration-200 w-full sm:w-auto"
                    >
                      Urus Event
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Add Event Form */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <AddEventForm />
        </div>
      </div>
    </div>
  )
}
