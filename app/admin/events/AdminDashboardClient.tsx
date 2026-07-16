'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, ShieldAlert, Award, FileSpreadsheet, PlusCircle, Users, CheckCircle, Circle, ArrowUpRight, LogOut, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  title: string
  description: string
  category: string
  team_members: string[]
  owner_user_id: string
}

interface Judge {
  id: string
  name: string
  panel_label: string
}

interface Score {
  id: string
  project_id: string
  judge_id: string
  criteria_id: string
  score: number
}

interface Report {
  id: string
  project_id: string
  feasibility_score: number
  feasibility_tier: string
  generated_at: string
}

interface AdminDashboardClientProps {
  event: { id: string; name: string; slug: string }
  judges: Judge[]
  projects: Project[]
  scores: Score[]
  reports: Report[]
  adminName: string
}

export default function AdminDashboardClient({
  event,
  judges,
  projects,
  scores,
  reports,
  adminName,
}: AdminDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // State for forms
  const [projTitle, setProjTitle] = useState('')
  const [projCategory, setProjCategory] = useState('')
  const [projDesc, setProjDesc] = useState('')
  const [projMembers, setProjMembers] = useState('')
  const [submittingProj, setSubmittingProj] = useState(false)

  const [judgeName, setJudgeName] = useState('')
  const [judgePanel, setJudgePanel] = useState('Panel 1')
  const [submittingJudge, setSubmittingJudge] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingProj(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const membersArray = projMembers
        ? projMembers.split(',').map((m) => m.trim())
        : []

      const { error } = await supabase.from('projects').insert({
        event_id: event.id,
        title: projTitle,
        category: projCategory,
        description: projDesc,
        team_members: membersArray,
      })

      if (error) throw error

      setProjTitle('')
      setProjCategory('')
      setProjDesc('')
      setProjMembers('')
      setSuccessMsg('Projek berjaya didaftarkan!')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar projek.')
    } finally {
      setSubmittingProj(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam projek ini?')) return
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      setSuccessMsg('Projek berjaya dipadam!')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memadam projek.')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen pb-16">
      {/* Header bar */}
      <header className="sticky top-0 bg-navy-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-neon animate-spin" style={{ animationDuration: '6s' }} />
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-teal-neon to-cyan-neon bg-clip-text text-transparent">
              IMEX AI-Biz
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Urus Setia (Admin)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold block text-red-400">Admin: {adminName}</span>
            <span className="text-[9px] text-gray-500 font-bold block uppercase">{event.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Log Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 pt-6 flex flex-col gap-6">
        
        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl border border-white/5 p-4">
            <span className="text-xs text-gray-500 font-bold block uppercase">Jumlah Projek</span>
            <span className="text-2xl font-black text-white mt-1 block">{projects.length}</span>
          </div>
          <div className="glass-card rounded-xl border border-white/5 p-4">
            <span className="text-xs text-gray-500 font-bold block uppercase">Panel Juri</span>
            <span className="text-2xl font-black text-cyan-400 mt-1 block">{judges.length}</span>
          </div>
          <div className="glass-card rounded-xl border border-white/5 p-4">
            <span className="text-xs text-gray-500 font-bold block uppercase">Undian Masuk</span>
            <span className="text-2xl font-black text-teal-neon mt-1 block">{scores.length}</span>
          </div>
          <div className="glass-card rounded-xl border border-white/5 p-4">
            <span className="text-xs text-gray-500 font-bold block uppercase">Laporan AI</span>
            <span className="text-2xl font-black text-yellow-500 mt-1 block">{reports.length}</span>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-green-950/40 border border-green-500/30 text-green-400 text-sm rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: CRUD form */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="glass-card rounded-xl border border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <PlusCircle className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Tambah Projek Inovasi</h2>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Tajuk Projek</label>
                  <input
                    type="text"
                    required
                    value={projTitle}
                    onChange={(e) => setProjTitle(e.target.value)}
                    placeholder="e.g. FOCUS DRIVE"
                    className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Kategori</label>
                  <input
                    type="text"
                    value={projCategory}
                    onChange={(e) => setProjCategory(e.target.value)}
                    placeholder="e.g. Teknologi Maklumat & IoT"
                    className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Ahli (Pisahkan dengan koma)</label>
                  <input
                    type="text"
                    value={projMembers}
                    onChange={(e) => setProjMembers(e.target.value)}
                    placeholder="e.g. Ahmad, Ali, Abu"
                    className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Penerangan Ringkas</label>
                  <textarea
                    value={projDesc}
                    onChange={(e) => setProjDesc(e.target.value)}
                    placeholder="Penerangan ringkas inovasi..."
                    className="w-full h-20 bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingProj}
                  className="w-full bg-cyan-500 text-navy-950 text-xs font-bold py-2 rounded transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submittingProj ? 'Mendaftar...' : 'Daftar Projek'}
                </button>
              </form>
            </div>

            {/* List of Judges */}
            <div className="glass-card rounded-xl border border-white/5 p-5 space-y-3">
              <div className="flex items-center gap-2 text-teal-neon">
                <Users className="w-4 h-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Senarai Panel Juri</h2>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {judges.map((j) => (
                  <div key={j.id} className="flex justify-between items-center bg-navy-900/40 p-2 rounded border border-white/5 text-xs">
                    <span className="font-bold text-gray-200">{j.name}</span>
                    <span className="text-[10px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-teal-neon font-semibold">{j.panel_label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel: Projects list */}
          <div className="md:col-span-2">
            <div className="glass-card rounded-xl border border-white/5 p-5 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Prestasi Projek & Laporan</h2>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {projects.map((proj) => {
                  const report = reports.find((r) => r.project_id === proj.id)
                  const totalProjScores = scores.filter((s) => s.project_id === proj.id).length

                  return (
                    <div
                      key={proj.id}
                      className="bg-navy-900/40 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4"
                    >
                      <div className="truncate">
                        <h3 className="font-bold text-sm text-gray-200 truncate">{proj.title}</h3>
                        <p className="text-[10px] text-gray-500 font-semibold truncate">{proj.category || 'Generik'}</p>
                        
                        <div className="flex gap-4 mt-2 text-[9px] text-gray-500 font-bold uppercase">
                          <span>Undian: {totalProjScores} Skor</span>
                          <span>•</span>
                          <span className={report ? 'text-green-400' : 'text-gray-600'}>
                            Laporan AI: {report ? 'Wujud' : 'Belum Dijana'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {report ? (
                          <div className="text-right">
                            <span className="text-sm font-black text-teal-neon block">{report.feasibility_score}%</span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase block">{report.feasibility_tier}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 italic">Tiada Data</span>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => router.push(`/project/${proj.id}`)}
                            className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 text-teal-neon rounded hover:bg-cyan-500/20 transition-all cursor-pointer"
                            title="Buka Dashboard"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-all cursor-pointer"
                            title="Padam Projek"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {projects.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-12">Tiada projek inovasi berdaftar.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
