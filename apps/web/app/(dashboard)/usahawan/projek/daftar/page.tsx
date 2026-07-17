import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DaftarProjekForm from './DaftarProjekForm'

export const dynamic = 'force-dynamic'

export default async function RegisterProjectPage() {
  const supabase = await createClient()

  // Get only active events with status = 'open'
  const { data: events, error } = await supabase
    .from('events')
    .select('id, name, slug, status')
    .eq('status', 'open')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
          Pendaftaran Projek Inovasi
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Lengkapkan butiran inovasi anda untuk memulakan proses penjurian dan padanan geran MARA.
        </p>
      </div>

      <DaftarProjekForm openEvents={events || []} />
    </div>
  )
}
