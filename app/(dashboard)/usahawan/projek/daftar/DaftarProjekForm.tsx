'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Save, Plus, X, FolderKanban, Users, CheckCircle, ShieldAlert } from 'lucide-react'

interface Event {
  id: string
  name: string
  slug: string
}

interface DaftarProjekFormProps {
  openEvents: Event[]
}

export default function DaftarProjekForm({ openEvents }: DaftarProjekFormProps) {
  const router = useRouter()
  
  // Step navigation
  const [currentStep, setCurrentStep] = useState(1)
  
  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [selectedEventId, setSelectedEventId] = useState(openEvents[0]?.id || '')
  
  // Team members
  const [newMemberName, setNewMemberName] = useState('')
  const [teamMembers, setTeamMembers] = useState<string[]>([])
  
  // Loading & Messages
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      setTeamMembers([...teamMembers, newMemberName.trim()])
      setNewMemberName('')
    }
  }

  const handleRemoveMember = (idx: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== idx))
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!title.trim() || !description.trim() || !category.trim()) {
        setErrorMsg('Sila isi semua butiran wajib di Langkah 1.')
        return
      }
      if (description.trim().length < 10) {
        setErrorMsg('Penerangan projek mestilah sekurang-kurangnya 10 aksara.')
        return
      }
    }
    setErrorMsg('')
    setCurrentStep(currentStep + 1)
  }

  const handlePrevStep = () => {
    setErrorMsg('')
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId) {
      setErrorMsg('Sila pilih event/pertandingan yang disertai.')
      return
    }

    setSubmitting(true)
    setErrorMsg('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          team_members: teamMembers,
          event_id: selectedEventId,
          status: 'submitted',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mendaftar projek.')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/usahawan')
        router.refresh()
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Berlaku ralat sistem semasa pendaftaran.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-slate-950/40 border border-slate-800 backdrop-blur-sm animate-fade-in">
        <CheckCircle className="h-16 w-16 text-teal-400 mb-4 animate-bounce" />
        <h3 className="text-xl font-bold text-slate-100">Pendaftaran Berjaya!</h3>
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Projek anda telah didaftarkan untuk penjurian. Anda akan dibawa ke Dashboard usahawan dalam seketika...
        </p>
      </div>
    )
  }

  return (
    <div className="bg-slate-950/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-8">
      {/* Wizard Progress Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 1 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>
            1
          </div>
          <span className={`text-sm font-semibold ${currentStep === 1 ? 'text-teal-400' : 'text-slate-400'}`}>
            Butiran Inovasi
          </span>
        </div>
        <div className="flex-1 h-0.5 mx-4 bg-slate-800">
          <div className="h-full bg-teal-500 transition-all duration-300" style={{ width: currentStep === 2 ? '100%' : '0%' }}></div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
            currentStep >= 2 ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
          }`}>
            2
          </div>
          <span className={`text-sm font-semibold ${currentStep === 2 ? 'text-teal-400' : 'text-slate-400'}`}>
            Kumpulan & Event
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <ShieldAlert className="h-5 w-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Steps */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <FolderKanban className="h-5 w-5 text-teal-400" />
              <h3 className="text-lg font-bold text-slate-200">Langkah 1: Maklumat Am Inovasi</h3>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Tajuk Projek / Nama Inovasi <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Mesin Pengisar Solar Pintar"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Kategori Inovasi <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Contoh: Teknologi Makanan / IoT / Pertanian"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Penerangan Projek / Kelebihan <span className="text-rose-500">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Jelaskan secara ringkas tentang produk, fungsi utama, masalah yang diselesaikan dan pasaran sasaran..."
                rows={5}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                required
              ></textarea>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-teal-400" />
              <h3 className="text-lg font-bold text-slate-200">Langkah 2: Penyertaan Event & Ahli Kumpulan</h3>
            </div>

            {/* Choose Event */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">Pilih Event Terbuka <span className="text-rose-500">*</span></label>
              {openEvents.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-sm">
                  Tiada event terbuka untuk penyertaan sekarang. Hubungi pentadbir sistem.
                </div>
              ) : (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  {openEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-300">Nama Rakan Kumpulan (Jika Ada)</label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Masukkan nama ahli kumpulan"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                >
                  <Plus className="h-5 w-5" />
                  Tambah
                </button>
              </div>

              {teamMembers.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Senarai Rakan Kumpulan:</span>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.map((member, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-750 text-slate-300 text-xs font-semibold rounded-lg"
                      >
                        {member}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Action Controls */}
        <div className="flex justify-between pt-6 border-t border-slate-800/80">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push('/usahawan')}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-500 hover:text-slate-300 transition-all"
            >
              Batal
            </button>
          )}

          {currentStep < 2 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition-all duration-200 shadow-md shadow-teal-500/10 ml-auto"
            >
              Seterusnya
              <ArrowRight className="h-4 w-4 text-slate-900" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting || openEvents.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition-all duration-200 shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50 ml-auto"
            >
              {submitting ? (
                <>
                  <Plus className="h-4 w-4 animate-spin text-slate-900" />
                  Mendaftar...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 text-slate-900" />
                  Daftar Projek
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
