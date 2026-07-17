'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Plus, Sliders, Briefcase, Trash2, Edit2, Loader2, LogOut, ArrowLeft, Check, X, AlertCircle } from 'lucide-react'

interface Scheme {
  id: string
  name: string
  agency: string
  description: string
  eligibility_criteria: string
  sector_tags: string[]
  max_amount_myr: number
  active: boolean
  created_at?: string
}

export default function GrantSchemesAdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [schemes, setSchemes] = useState<Scheme[]>([])
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('Pentadbir')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form State
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [agency, setAgency] = useState('')
  const [description, setDescription] = useState('')
  const [eligibilityCriteria, setEligibilityCriteria] = useState('')
  const [sectorTagsInput, setSectorTagsInput] = useState('')
  const [maxAmount, setMaxAmount] = useState<number>(50000)
  const [active, setActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Auth check & Fetch schemes
  useEffect(() => {
    async function checkAuthAndFetch() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, name')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/login')
        return
      }

      setAdminName(profile.name || 'Pentadbir')
      await fetchSchemes()
    }
    checkAuthAndFetch()
  }, [])

  const fetchSchemes = async () => {
    try {
      const res = await fetch('/api/admin/grant-schemes')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menarik data skim geran.')
      setSchemes(data.schemes || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa menarik data.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setName('')
    setAgency('')
    setDescription('')
    setEligibilityCriteria('')
    setSectorTagsInput('')
    setMaxAmount(50000)
    setActive(true)
    setShowModal(true)
  }

  const handleOpenEdit = (s: Scheme) => {
    setEditingId(s.id)
    setName(s.name)
    setAgency(s.agency)
    setDescription(s.description)
    setEligibilityCriteria(s.eligibility_criteria)
    setSectorTagsInput(s.sector_tags.join(', '))
    setMaxAmount(s.max_amount_myr)
    setActive(s.active)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (!name || !agency || !description || !eligibilityCriteria || !sectorTagsInput) {
        throw new Error('Sila isi semua ruangan wajib.')
      }

      const sector_tags = sectorTagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const payload = {
        name,
        agency,
        description,
        eligibility_criteria: eligibilityCriteria,
        sector_tags,
        max_amount_myr: Number(maxAmount),
        active,
      }

      let res
      if (editingId) {
        res = await fetch('/api/admin/grant-schemes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
      } else {
        res = await fetch('/api/admin/grant-schemes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data.')

      setSuccessMsg(editingId ? 'Skim geran berjaya dikemaskini!' : 'Skim geran baharu berjaya ditambah!')
      setShowModal(false)
      await fetchSchemes()
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa memproses.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam skim geran ini? Tindakan ini tidak boleh diundur.')) {
      return
    }

    setErrorMsg('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/grant-schemes?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memadam skim geran.')

      setSuccessMsg('Skim geran berjaya dipadamkan!')
      await fetchSchemes()
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa memadam skim geran.')
    }
  }

  const handleLogout = async () => {
    document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/events')}
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Kembali ke Dashboard Acara"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-white">Konsol Pentadbir IMEX</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Pengurusan Skim Geran & Pembiayaan</p>
            </div>
          </div>
        </div>

        {/* User profile & logout */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-200">{adminName}</p>
            <p className="text-[9px] text-slate-500 font-semibold uppercase">Urus Setia Pentadbir</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            title="Log Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {/* Info alerts */}
        {errorMsg && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2 font-bold">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Top actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Skim Geran Pembiayaan</h2>
            <p className="text-xs text-slate-400 mt-1">
              Tambahkan, sunting, atau kemaskini skim geran aktif untuk padanan AI calon usahawan.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-navy-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Skim</span>
          </button>
        </div>

        {/* Schemes List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Memuatkan data skim geran...</p>
          </div>
        ) : schemes.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/5 p-16 text-center bg-navy-900/40">
            <Briefcase className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="font-bold text-slate-300">Tiada Skim Geran Ditemui</h3>
            <p className="text-xs text-slate-500 mt-1">
              Sila klik butang **Tambah Skim** di atas untuk mendaftarkan skim geran MARA/TEKUN pertama anda.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase tracking-wider font-bold bg-navy-900/40">
                    <th className="py-4 px-4">Nama Skim / Agensi</th>
                    <th className="py-4 px-4">Sektor Sasaran</th>
                    <th className="py-4 px-4">Siling Dana</th>
                    <th className="py-4 px-4 text-center">Status</th>
                    <th className="py-4 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">{s.name}</div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">{s.agency}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {s.sector_tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-[#0b0f19] border border-white/5 text-[9px] text-slate-400 font-bold uppercase rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-black text-white text-sm">
                        RM {s.max_amount_myr.toLocaleString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                            s.active
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}
                        >
                          {s.active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                            title="Kemaskini"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Padam"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-navy-950">
              <h3 className="font-black text-sm text-white uppercase tracking-wider">
                {editingId ? 'Kemaskini Skim Geran' : 'Tambah Skim Geran Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nama Skim Geran *</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Skim Pembiayaan Mikro MARA"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-navy-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Agency */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Agensi Penaja *</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: MARA, TEKUN, MDEC"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  className="w-full bg-navy-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Deskripsi Skim *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Terangkan secara ringkas tentang objektif, matlamat, dan kelebihan skim ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors leading-relaxed"
                />
              </div>

              {/* Eligibility Criteria */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kriteria Kelayakan Syarat *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Cth: Bumiputera sahaja, skor kebolehsanaan perniagaan >= 70%, syarikat berdaftar dengan SSM..."
                  value={eligibilityCriteria}
                  onChange={(e) => setEligibilityCriteria(e.target.value)}
                  className="w-full bg-navy-900 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors leading-relaxed"
                />
              </div>

              {/* Sectors Tags */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sektor Sasaran (Asingkan dengan koma) *</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Automotif & IoT, Digital & Software, Pertanian"
                  value={sectorTagsInput}
                  onChange={(e) => setSectorTagsInput(e.target.value)}
                  className="w-full bg-navy-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Max Amount & Active Check */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Siling Suku Dana (RM) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    className="w-full bg-navy-900 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6 pl-2">
                  <input
                    type="checkbox"
                    id="active-check"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded border-white/10"
                  />
                  <label htmlFor="active-check" className="text-xs font-bold text-slate-300 select-none cursor-pointer">
                    Skim Ini Aktif
                  </label>
                </div>
              </div>

              {/* Save actions */}
              <div className="pt-4 border-t border-white/5 flex gap-3 justify-end bg-[#0b0f19]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-white/5 text-slate-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-navy-950 font-bold text-xs uppercase tracking-wider rounded-lg hover:shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Rekod</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
