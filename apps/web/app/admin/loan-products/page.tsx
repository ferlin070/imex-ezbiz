'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, ArrowLeft, Plus, Edit2, Trash2, Save, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

interface LoanProduct {
  id: string
  name: string
  description: string
  min_amount_myr: number
  max_amount_myr: number
  profit_rate_percent: number
  min_tenure_months: number
  max_tenure_months: number
  sector_tags: string[]
  active: boolean
}

export default function AdminLoanProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<LoanProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [adminName, setAdminName] = useState('Admin')

  // Form states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [minAmount, setMinAmount] = useState(10000)
  const [maxAmount, setMaxAmount] = useState(100000)
  const [profitRate, setProfitRate] = useState(4.0)
  const [minTenure, setMinTenure] = useState(12)
  const [maxTenure, setMaxTenure] = useState(60)
  const [sectorsInput, setSectorsInput] = useState('')
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/loan-products')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuatkan skim pembiayaan.')
      setProducts(data.products || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa mengambil data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setMinAmount(10000)
    setMaxAmount(100000)
    setProfitRate(4.0)
    setMinTenure(12)
    setMaxTenure(60)
    setSectorsInput('')
    setActive(true)
  }

  const handleEdit = (p: LoanProduct) => {
    setEditingId(p.id)
    setName(p.name)
    setDescription(p.description)
    setMinAmount(p.min_amount_myr)
    setMaxAmount(p.max_amount_myr)
    setProfitRate(p.profit_rate_percent)
    setMinTenure(p.min_tenure_months)
    setMaxTenure(p.max_tenure_months)
    setSectorsInput(p.sector_tags.join(', '))
    setActive(p.active)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    const parsedSectors = sectorsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)

    const payload = {
      id: editingId || undefined,
      name,
      description,
      min_amount_myr: Number(minAmount),
      max_amount_myr: Number(maxAmount),
      profit_rate_percent: Number(profitRate),
      min_tenure_months: Number(minTenure),
      max_tenure_months: Number(maxTenure),
      sector_tags: parsedSectors,
      active
    }

    try {
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/loan-products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan skim.')

      setSuccessMsg(editingId ? 'Skim pembiayaan berjaya dikemaskini!' : 'Skim pembiayaan baru berjaya didaftarkan!')
      resetForm()
      fetchProducts()
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa menyimpan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam skim pembiayaan ini?')) return
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch(`/api/admin/loan-products?id=${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memadam skim.')

      setSuccessMsg('Skim pembiayaan berjaya dipadam!')
      fetchProducts()
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa memadam.')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen pb-16">
      {/* Header bar */}
      <header className="sticky top-0 bg-navy-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/events')}
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Dashboard Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-neon" />
            <div>
              <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-teal-neon to-cyan-neon bg-clip-text text-transparent">
                Urus Skim Pinjaman MARA
              </h1>
              <p className="text-[10px] text-gray-400 font-semibold uppercase">Konsol Kawalan Skim Pembiayaan</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-1 glass-card rounded-xl border border-white/5 p-5 space-y-4 self-start">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
            {editingId ? 'Kemaskini Skim Pembiayaan' : 'Daftar Skim Pembiayaan Baharu'}
          </h3>

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-green-950/40 border border-green-500/30 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Skim</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: SPIKE MARA"
                className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Deskripsi</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Terangkan syarat kelayakan atau tujuan skim..."
                rows={3}
                className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Min Jumlah (RM)</label>
                <input
                  type="number"
                  required
                  value={minAmount}
                  onChange={(e) => setMinAmount(Number(e.target.value))}
                  className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Max Jumlah (RM)</label>
                <input
                  type="number"
                  required
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(Number(e.target.value))}
                  className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Kadar Untung (% Setahun)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={profitRate}
                  onChange={(e) => setProfitRate(Number(e.target.value))}
                  className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-navy-900/60 border border-white/10 rounded">
                <span className="text-[10px] uppercase font-bold text-gray-400">Aktif</span>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 accent-teal-neon cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Min Tempoh (Bulan)</label>
                <input
                  type="number"
                  required
                  value={minTenure}
                  onChange={(e) => setMinTenure(Number(e.target.value))}
                  className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Max Tempoh (Bulan)</label>
                <input
                  type="number"
                  required
                  value={maxTenure}
                  onChange={(e) => setMaxTenure(Number(e.target.value))}
                  className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tag Sektor (Asingkan dengan koma)</label>
              <input
                type="text"
                value={sectorsInput}
                onChange={(e) => setSectorsInput(e.target.value)}
                placeholder="Teknologi, Am, Perkhidmatan"
                className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-teal-neon text-navy-950 text-xs font-bold py-2 rounded transition-all hover:bg-teal-400 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                {submitting ? 'Menyimpan...' : 'Simpan Skim'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 bg-white/5 border border-white/10 text-gray-300 text-xs font-bold py-2 rounded hover:bg-white/10 cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 glass-card rounded-xl border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Daftar Skim Pinjaman Aktif</h3>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-1.5 bg-white/5 border border-white/5 rounded text-gray-400 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="w-6 h-6 text-teal-neon animate-spin" />
              <p className="text-[10px] text-gray-500 font-bold uppercase">Memuatkan senarai skim...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-500 italic">Tiada skim pembiayaan didaftarkan.</div>
          ) : (
            <div className="space-y-4">
              {products.map((p) => (
                <div key={p.id} className="p-4 bg-navy-900/40 border border-white/5 rounded-xl flex justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">{p.name}</h4>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                        p.active 
                          ? 'bg-green-500/10 border-green-500/25 text-green-400' 
                          : 'bg-red-500/10 border-red-500/25 text-red-400'
                      }`}>
                        {p.active ? 'AKTIF' : 'TIDAK AKTIF'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{p.description || 'Tiada deskripsi.'}</p>
                    
                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 font-bold uppercase pt-1 border-t border-white/5">
                      <span>Had: RM{p.min_amount_myr.toLocaleString()} - RM{p.max_amount_myr.toLocaleString()}</span>
                      <span>Kadar: {p.profit_rate_percent}% Setahun</span>
                      <span>Tempoh: {p.min_tenure_months} - {p.max_tenure_months} Bulan</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.sector_tags.map(s => (
                        <span key={s} className="text-[8px] bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 font-extrabold uppercase px-1.5 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 justify-center">
                    <button
                      onClick={() => handleEdit(p)}
                      className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded border border-white/5 cursor-pointer"
                      title="Kemaskini Skim"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded border border-red-500/20 cursor-pointer"
                      title="Hapus Skim"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
