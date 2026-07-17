'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, Loader2, ShieldAlert } from 'lucide-react'

interface Venue {
  id: string
  name: string
}

export default function AddEventForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [venue, setVenue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState<'draft' | 'open'>('draft')
  
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Load venues on mount
  useEffect(() => {
    async function loadVenues() {
      try {
        const response = await fetch('/api/venues')
        if (response.ok) {
          const result = await response.json()
          setVenues(result.venues || [])
        }
      } catch (err) {
        console.warn('Failed to load venues for selection:', err)
      }
    }
    loadVenues()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Nama event diperlukan.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          venue,
          start_date: startDate ? new Date(startDate).toISOString() : null,
          end_date: endDate ? new Date(endDate).toISOString() : null,
          status,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan event.')
      }

      // Reset form on success
      setName('')
      setDescription('')
      setVenue('')
      setStartDate('')
      setEndDate('')
      setStatus('draft')
      
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Berlaku ralat sistem semasa pendaftaran.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-teal-400" />
          Cipta Event Baru
        </h3>
        <p className="text-slate-500 text-xs mt-1">
          Daftarkan kejohanan, pitch, atau karnival inovasi yang akan dijalankan.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <ShieldAlert className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400">Nama Event</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cth: IMEX Besut 2026"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          required
        />
      </div>

      {/* Venue selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400">Tempat / Lokasi</label>
        <select
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-teal-500 mb-2"
        >
          <option value="">-- Pilih Tempat (Atau Taip di bawah) --</option>
          {venues.map((v) => (
            <option key={v.id} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="Atau taip lokasi custom"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
        />
      </div>

      {/* Start and End dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400">Tarikh Mula</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400">Tarikh Tamat</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400">Penerangan</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ringkasan tentang kejohanan..."
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-teal-500"
        ></textarea>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400">Status Awal</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="draft"
              checked={status === 'draft'}
              onChange={() => setStatus('draft')}
              className="accent-teal-500"
            />
            Draf (Sembunyi)
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="open"
              checked={status === 'open'}
              onChange={() => setStatus('open')}
              className="accent-teal-500"
            />
            Buka Penyertaan
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition-all duration-200 shadow-md shadow-teal-500/10 active:scale-95 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-slate-900" />
            Menyimpan...
          </>
        ) : (
          <>
            <Save className="h-4 w-4 text-slate-900" />
            Cipta Event
          </>
        )}
      </button>
    </form>
  )
}
