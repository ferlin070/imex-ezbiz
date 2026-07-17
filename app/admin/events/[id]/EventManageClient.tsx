'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  MapPin,
  Users,
  FolderOpen,
  UserPlus,
  Trash2,
  Check,
  X,
  ClipboardCheck,
  ShieldAlert,
  Loader2
} from 'lucide-react'

interface Project {
  id: string
  title: string
  description: string
  category: string
  team_members: string[]
  owner_name: string
  owner_email: string
  status: 'draft' | 'submitted' | 'shortlisted' | 'approved' | 'rejected'
  avg_score: number | null
  eval_count: number
}

interface JurorAssignment {
  id: string
  user_id: string
  role: 'chair' | 'member' | 'observer'
  name: string
  email: string
  assigned_at: string
}

interface JudgeProfile {
  id: string
  name: string
  email: string
}

interface EventManageClientProps {
  event: {
    id: string
    name: string
    description?: string
    venue?: string
    start_date?: string
    end_date?: string
    status: 'draft' | 'open' | 'closed' | 'completed'
  }
  projects: Project[]
  assignments: JurorAssignment[]
  availableJudges: JudgeProfile[]
}

export default function EventManageClient({
  event,
  projects,
  assignments,
  availableJudges,
}: EventManageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'projects' | 'jurors'>('projects')
  
  // Status management
  const [eventStatus, setEventStatus] = useState(event.status)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  
  // Juror Assignment form state
  const [selectedJudgeId, setSelectedJudgeId] = useState('')
  const [assignmentRole, setAssignmentRole] = useState<'chair' | 'member' | 'observer'>('member')
  const [submittingJuror, setSubmittingJuror] = useState(false)

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Filter available judges to exclude already assigned ones
  const assignedUserIds = assignments.map((a) => a.user_id)
  const unassignedJudges = availableJudges.filter((j) => !assignedUserIds.includes(j.id))

  const handleUpdateEventStatus = async (newStatus: typeof event.status) => {
    setUpdatingStatus(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Gagal menukar status event.')
      }

      setEventStatus(newStatus)
      setSuccessMsg('Status event berjaya dikemaskini.')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleUpdateProjectStatus = async (projectId: string, newStatus: Project['status']) => {
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Gagal mengemaskini status projek.')
      }

      setSuccessMsg('Status projek berjaya dikemaskini.')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const handleAssignJuror = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJudgeId) {
      setErrorMsg('Sila pilih juri untuk dilantik.')
      return
    }

    setSubmittingJuror(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await fetch(`/api/events/${event.id}/jurors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedJudgeId,
          role: assignmentRole,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Gagal melantik juri.')
      }

      setSelectedJudgeId('')
      setAssignmentRole('member')
      setSuccessMsg('Juri berjaya dilantik.')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSubmittingJuror(false)
    }
  }

  const handleRemoveJuror = async (userId: string) => {
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const response = await fetch(`/api/jury-assignments?event_id=${event.id}&user_id=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Gagal mengeluarkan juri.')
      }

      setSuccessMsg('Juri berjaya dikeluarkan.')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  const statusLabels: Record<string, string> = {
    draft: 'Draf',
    open: 'Dibuka',
    closed: 'Ditutup',
    completed: 'Selesai'
  }

  const projStatusClasses: Record<string, string> = {
    draft: 'bg-slate-800 text-slate-400 border-slate-700',
    submitted: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    shortlisted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  const projStatusLabels: Record<string, string> = {
    draft: 'Draf',
    submitted: 'Baru (Dihantar)',
    shortlisted: 'Senarai Pendek',
    approved: 'Diluluskan',
    rejected: 'Ditolak',
  }

  return (
    <div className="space-y-6">
      {/* Event Details Card */}
      <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">{event.description || 'Tiada keterangan event.'}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-slate-500" />
              <span>{event.venue || 'Lokasi belum diset'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-500" />
              <span>
                {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'N/A'} -{' '}
                {event.end_date ? new Date(event.end_date).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Event Status Controls */}
        <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400">Status Event:</span>
          <select
            value={eventStatus}
            disabled={updatingStatus}
            onChange={(e) => handleUpdateEventStatus(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none"
          >
            {Object.keys(statusLabels).map((key) => (
              <option key={key} value={key}>
                {statusLabels[key]}
              </option>
            ))}
          </select>
          {updatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <Check className="h-5 w-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-800 flex gap-2">
        <button
          onClick={() => { setActiveTab('projects'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition ${
            activeTab === 'projects'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          Projek Terdaftar ({projects.length})
        </button>
        <button
          onClick={() => { setActiveTab('jurors'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold text-sm transition ${
            activeTab === 'jurors'
              ? 'border-teal-400 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          Juri Dilantik ({assignments.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'projects' ? (
        <div className="space-y-6">
          <h3 className="font-bold text-lg text-slate-200">Kemas Kini Status Projek & Penjurian</h3>

          {projects.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
              Tiada projek didaftarkan untuk event ini lagi.
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 hover:border-slate-750 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-bold text-slate-200">{proj.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${projStatusClasses[proj.status || 'submitted']}`}>
                        {projStatusLabels[proj.status || 'submitted']}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 max-w-xl">{proj.description}</p>
                    <div className="flex gap-4 text-[10px] text-slate-500">
                      <span>Usahawan: {proj.owner_name} ({proj.owner_email})</span>
                      <span>Kategori: {proj.category}</span>
                    </div>
                  </div>

                  {/* Right side: Scores and Status Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                    {/* Score display */}
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-slate-500" />
                      <span className="text-xs text-slate-400">{proj.eval_count} Penilaian</span>
                      {proj.avg_score !== null && (
                        <span className="text-xs font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded border border-teal-500/20">
                          Skor: {proj.avg_score}%
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      {proj.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => handleUpdateProjectStatus(proj.id, 'shortlisted')}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition"
                          >
                            <Check className="h-3 w-3" />
                            Shortlist
                          </button>
                          <button
                            onClick={() => handleUpdateProjectStatus(proj.id, 'rejected')}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/25 rounded-lg transition"
                          >
                            <X className="h-3 w-3" />
                            Tolak
                          </button>
                        </>
                      )}

                      {proj.status === 'shortlisted' && (
                        <>
                          <button
                            onClick={() => handleUpdateProjectStatus(proj.id, 'approved')}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition"
                          >
                            <Check className="h-3 w-3" />
                            Lulus
                          </button>
                          <button
                            onClick={() => handleUpdateProjectStatus(proj.id, 'rejected')}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/25 rounded-lg transition"
                          >
                            <X className="h-3 w-3" />
                            Tolak
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 items-start animate-fade-in">
          {/* List of current jurors */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-slate-200">Panel Juri Dilantik</h3>

            {assignments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-950/40 border border-slate-800 text-slate-500 text-sm">
                Tiada juri dilantik untuk event ini lagi. Lantik juri baharu di panel sebelah.
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assign) => (
                  <div
                    key={assign.id}
                    className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{assign.name}</h4>
                      <p className="text-xs text-slate-400">{assign.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-400/10 text-teal-400 uppercase">
                        {assign.role}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveJuror(assign.user_id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Keluarkan juri"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add juror form panel */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="font-bold text-slate-200 text-md flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-teal-400" />
                Lantik Juri Baharu
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Lantik juri penilai dari senarai juri berdaftar.
              </p>
            </div>

            <form onSubmit={handleAssignJuror} className="space-y-4">
              {/* Select Judge Profile */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Pilih Profil Juri</label>
                {unassignedJudges.length === 0 ? (
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-500 text-xs">
                    Tiada juri sedia ada untuk dilantik.
                  </div>
                ) : (
                  <select
                    value={selectedJudgeId}
                    onChange={(e) => setSelectedJudgeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Pilih Juri --</option>
                    {unassignedJudges.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} ({j.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select Role */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">Peranan Juri</label>
                <select
                  value={assignmentRole}
                  onChange={(e) => setAssignmentRole(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-teal-500"
                >
                  <option value="member">Juri Ahli (Member)</option>
                  <option value="chair">Ketua Juri (Chair)</option>
                  <option value="observer">Pemerhati (Observer)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingJuror || unassignedJudges.length === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition disabled:opacity-50"
              >
                {submittingJuror ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-900" />
                    Melantik...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3.5 w-3.5 text-slate-900" />
                    Lantik Juri
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
