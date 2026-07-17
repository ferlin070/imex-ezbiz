'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Trash2, ShieldAlert, Loader2, Save, Check } from 'lucide-react'

interface Venue {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues')
      if (response.ok) {
        const result = await response.json()
        setVenues(result.venues || [])
      }
    } catch (err) {
      console.error('Failed to load venues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVenues()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mendaftar tempat.')
      }

      setName('')
      setDescription('')
      setSuccessMsg('Tempat berjaya didaftarkan.')
      fetchVenues()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await fetch(`/api/venues/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Gagal memadam tempat.')
      }

      setSuccessMsg('Tempat berjaya dipadam.')
      fetchVenues()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MapPin className="h-8 w-8 text-teal-400" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Pengurusan Tempat (Venues)
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Daftar lokasi fizikal bagi dewan kejohanan, bilik taklimat, atau dewan pameran event IMEX.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        {/* Left: Venue List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-slate-200">Senarai Tempat Berdaftar</h2>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <ShieldAlert className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              <Check className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
            </div>
          ) : venues.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
              Tiada tempat didaftarkan lagi.
            </div>
          ) : (
            <div className="space-y-4">
              {venues.map((venue) => (
                <div
                  key={venue.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-750 transition duration-200 gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-200 text-md flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-teal-400" />
                      {venue.name}
                    </h3>
                    <p className="text-xs text-slate-400">{venue.description || 'Tiada keterangan dewan.'}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(venue.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    title="Padam tempat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Registration form */}
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-400" />
              Daftar Tempat Baru
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Tambahkan lokasi baru untuk dipilih semasa membina event.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">Nama Tempat / Dewan</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cth: Dewan Gemilang IKM"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-400">Keterangan / Penerangan</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kapasiti dewan atau kelengkapan..."
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-teal-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-350 rounded-xl transition shadow-md shadow-teal-500/10 active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  Mendaftar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-slate-950" />
                  Daftar Tempat
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
