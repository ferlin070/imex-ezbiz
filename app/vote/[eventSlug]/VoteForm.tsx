'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Award, CheckCircle2, Circle, Users, Sparkles, ChevronRight, BarChart3, LogOut, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Criterion {
  id: string
  code: string
  label: string
  max_score: number
  weight: number
}

interface Project {
  id: string
  title: string
  description: string
  category: string
  team_members: string[]
}

interface ScoreEntry {
  project_id: string
  criteria_id: string
  score: number
}

interface VoteFormProps {
  event: { id: string; name: string; slug: string; event_type?: string }
  judge: { id: string; name: string; panel_label: string }
  criteria: Criterion[]
  projects: Project[]
  initialScores: ScoreEntry[]
}

export default function VoteForm({ event, judge, criteria, projects, initialScores }: VoteFormProps) {
  const router = useRouter()
  const supabase = createClient()

  // Track scores in state
  const [scores, setScores] = useState<ScoreEntry[]>(initialScores)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Get active project details
  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  // Track state of current inputs for the active project
  const [currentInputs, setCurrentInputs] = useState<Record<string, number>>(() => {
    const inputs: Record<string, number> = {}
    criteria.forEach((c) => {
      const match = initialScores.find(
        (s) => s.project_id === (projects[0]?.id || '') && s.criteria_id === c.id
      )
      inputs[c.id] = match ? Number(match.score) : 0
    })
    return inputs
  })

  // Whenever user changes active project, load its existing scores
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSuccessMsg('')
    setErrorMsg('')
    const inputs: Record<string, number> = {}
    criteria.forEach((c) => {
      const match = scores.find((s) => s.project_id === projectId && s.criteria_id === c.id)
      inputs[c.id] = match ? Number(match.score) : 0
    })
    setCurrentInputs(inputs)
  }

  // Calculate project completion map
  const projectCompletion = useMemo(() => {
    const completionMap: Record<string, boolean> = {}
    projects.forEach((proj) => {
      // Must have scores for all criteria to be complete
      const projectScores = scores.filter((s) => s.project_id === proj.id)
      completionMap[proj.id] = projectScores.length === criteria.length && projectScores.every(s => Number(s.score) > 0)
    })
    return completionMap
  }, [projects, criteria, scores])

  const handleInputChange = (criteriaId: string, value: number, maxScore: number) => {
    let cleanVal = isNaN(value) ? 0 : value
    if (cleanVal < 0) cleanVal = 0
    if (cleanVal > maxScore) cleanVal = maxScore

    setCurrentInputs((prev) => ({
      ...prev,
      [criteriaId]: cleanVal,
    }))
  }

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      // Submit each criterion score
      for (const criterion of criteria) {
        const scoreVal = currentInputs[criterion.id] || 0
        const res = await fetch('/api/scores/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: selectedProjectId,
            criteriaId: criterion.id,
            score: scoreVal,
          }),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || `Gagal menghantar markah kriteria ${criterion.code}`)
        }
      }

      // Update local scores state
      const updatedScores = [...scores]
      criteria.forEach((criterion) => {
        const scoreVal = currentInputs[criterion.id] || 0
        const index = updatedScores.findIndex(
          (s) => s.project_id === selectedProjectId && s.criteria_id === criterion.id
        )
        if (index > -1) {
          updatedScores[index].score = scoreVal
        } else {
          updatedScores.push({
            project_id: selectedProjectId,
            criteria_id: criterion.id,
            score: scoreVal,
          })
        }
      })
      setScores(updatedScores)
      setSuccessMsg('Penilaian berjaya dihantar ke pangkalan data!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat penghantaran markah.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    document.cookie = 'imex_mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen pb-12">
      {/* Header bar */}
      <header className="sticky top-0 bg-navy-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-teal-neon" />
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-teal-neon to-cyan-neon bg-clip-text text-transparent">
              {event.event_type === 'mara_program' ? 'Penilai Program MARA' : 'IMEX AI-Biz'}
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">{event.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-semibold block text-teal-neon">{judge.name}</span>
            <span className="text-[9px] text-gray-500 font-bold block bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
              {event.event_type === 'mara_program' ? 'Penilai' : 'Juri'} - {judge.panel_label}
            </span>
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

      {/* Main container */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left column: Projects list */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="glass-card rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Senarai Projek Inovasi</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/30">
                {projects.length} Projek
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-[350px] md:max-h-[600px] overflow-y-auto pr-1">
              {projects.map((proj) => {
                const isSelected = proj.id === selectedProjectId
                const isComplete = projectCompletion[proj.id]
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleProjectSelect(proj.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/10 border-teal-neon shadow-[0_0_10px_rgba(0,242,254,0.1)]'
                        : 'bg-navy-900/40 border-white/5 hover:bg-navy-900/60 hover:border-white/10'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="font-bold text-sm text-gray-200 truncate">{proj.title}</p>
                      <p className="text-[10px] text-gray-500 font-semibold">{proj.category || 'Tiada Kategori'}</p>
                    </div>

                    <div className="shrink-0">
                      {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-600" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <button
            onClick={() => router.push(`/ranking/${event.slug}`)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-navy-900 border border-white/10 hover:border-teal-neon text-teal-neon rounded-xl text-sm font-semibold transition-all hover:bg-teal-neon/5 cursor-pointer shadow-md"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Lihat Keputusan Live (Ranking)</span>
          </button>
        </div>

        {/* Right column: Voting interface */}
        <div className="md:col-span-2">
          {activeProject ? (
            <div className="glass-card rounded-xl border border-white/5 p-6 flex flex-col gap-6 relative overflow-hidden">
              {/* Decorative corner glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Project description card */}
              <div>
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Projek Sedang Dinilai</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{activeProject.title}</h2>
                <p className="text-xs text-gray-400 mt-2 bg-navy-950/60 p-3 rounded-lg border border-white/5 leading-relaxed">
                  {activeProject.description || 'Tiada huraian projek dibekalkan.'}
                </p>

                {activeProject.team_members && activeProject.team_members.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-3 font-medium">
                    <Users className="w-3.5 h-3.5 text-gray-500" />
                    <span>Ahli Kumpulan:</span>
                    <span className="text-gray-300 font-bold">{activeProject.team_members.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Alerts */}
              {successMsg && (
                <div className="p-3 bg-green-950/40 border border-green-500/30 text-green-400 text-sm rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 text-sm rounded-lg flex items-center gap-2">
                  <Circle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Scoring Form */}
              <form onSubmit={handleSubmitScore} className="space-y-6 pt-2 border-t border-white/5">
                <div className="space-y-6">
                  {criteria.map((c) => {
                    const scoreVal = currentInputs[c.id] || 0
                    const percent = Math.round((scoreVal / c.max_score) * 100) || 0
                    return (
                      <div key={c.id} className="bg-navy-900/30 border border-white/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="inline-block text-[10px] font-bold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded mr-2 border border-cyan-900/50">
                              Kriteria {c.code}
                            </span>
                            <span className="text-sm font-extrabold text-gray-200">{c.label}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-teal-neon">{scoreVal}</span>
                            <span className="text-xs text-gray-500 font-semibold"> / {c.max_score}</span>
                            <span className="text-[10px] block text-gray-500 font-bold">({percent}%)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0"
                            max={c.max_score}
                            step="0.5"
                            value={scoreVal}
                            onChange={(e) => handleInputChange(c.id, parseFloat(e.target.value), c.max_score)}
                            className="flex-1 accent-teal-neon cursor-pointer h-1 bg-navy-950 rounded-lg appearance-none"
                          />
                          <input
                            type="number"
                            min="0"
                            max={c.max_score}
                            step="0.1"
                            value={scoreVal || ''}
                            onChange={(e) => handleInputChange(c.id, parseFloat(e.target.value), c.max_score)}
                            className="w-16 bg-navy-950 border border-white/10 rounded py-1 px-2 text-center text-xs font-bold focus:outline-none focus:border-teal-neon"
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                          <span>Lemah (0)</span>
                          <span>Sederhana ({c.max_score / 2})</span>
                          <span>Cemerlang ({c.max_score})</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 font-black py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(0,242,254,0.2)] hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Hantar Markah Penilaian</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass-card rounded-xl border border-white/5 p-12 text-center">
              <p className="text-gray-400">Tiada projek inovasi untuk dinilai.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
