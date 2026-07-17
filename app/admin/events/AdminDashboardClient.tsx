'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Settings, 
  ShieldAlert, 
  PlusCircle, 
  Users, 
  CheckCircle, 
  LogOut, 
  Trash2, 
  UserPlus, 
  Sliders, 
  Briefcase, 
  LineChart, 
  Sparkles,
  RefreshCw,
  Mail,
  User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  title: string
  description: string
  category: string
  team_members: string[]
  owner_user_id: string | null
}

interface Judge {
  id: string
  name: string
  panel_label: string
  user_id: string
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

interface Profile {
  id: string
  email: string
  role: string
  name: string
}

interface AdminDashboardClientProps {
  event: { id: string; name: string; slug: string; event_type?: string }
  judges: Judge[]
  projects: Project[]
  scores: Score[]
  reports: Report[]
  profiles: Profile[]
  adminName: string
}

export default function AdminDashboardClient({
  event,
  judges,
  projects,
  scores,
  reports,
  profiles,
  adminName,
}: AdminDashboardClientProps) {
  const router = useRouter()
  const supabase = createClient()

  // Active tab state
  const [activeTab, setActiveTab] = useState<'analytics' | 'projects' | 'judges' | 'entrepreneurs' | 'ai' | 'settings'>('analytics')

  // Forms states
  const [projTitle, setProjTitle] = useState('')
  const [projCategory, setProjCategory] = useState('')
  const [projDesc, setProjDesc] = useState('')
  const [projMembers, setProjMembers] = useState('')
  const [submittingProj, setSubmittingProj] = useState(false)

  const [judgeName, setJudgeName] = useState('')
  const [judgePanel, setJudgePanel] = useState('Panel 1')
  const [judgeEmail, setJudgeEmail] = useState('')
  const [submittingJudge, setSubmittingJudge] = useState(false)

  const [entName, setEntName] = useState('')
  const [entEmail, setEntEmail] = useState('')
  const [entProjId, setEntProjId] = useState('')
  const [submittingEnt, setSubmittingEnt] = useState(false)

  // AI Prompt Configuration State
  const [aiPrompt, setAiPrompt] = useState('')
  const [savingPrompt, setSavingPrompt] = useState(false)

  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [eventType, setEventType] = useState(event.event_type || 'competition')
  const [savingEvent, setSavingEvent] = useState(false)

  const handleSaveEventSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEvent(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase
        .from('events')
        .update({ event_type: eventType })
        .eq('id', event.id)

      if (error) throw error
      setSuccessMsg('Tetapan acara berjaya disimpan!')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan tetapan acara.')
    } finally {
      setSavingEvent(false)
    }
  }

  // Load custom prompt from cookie on load
  useEffect(() => {
    const match = document.cookie.match(/imex_custom_system_prompt=([^;]+)/)
    if (match) {
      setAiPrompt(decodeURIComponent(match[1]))
    } else {
      setAiPrompt(
        'Anda ialah perunding perniagaan pakar TVET/IKM Malaysia. Tugas anda adalah untuk membantu usahawan menstruktur perniagaan mereka untuk permohonan geran rasmi (seperti MARA, TEKUN, MDEC). Sila berikan analisis dalam Bahasa Melayu profesional. PENTING: Jangan reka angka kewangan khusus (misalnya jumlah RM tepat), sebaliknya berikan anggaran kasar atau berasaskan peratusan. Pastikan analisis SWOT, blueprint tindakan, dan skrip elevator pitch adalah khusus dan relevan untuk projek usahawan.'
      )
    }
  }, [])

  // Filter profiles to get only entrepreneurs
  const entrepreneursList = profiles.filter((p) => p.role === 'entrepreneur')

  // Calculate dynamic stats
  const totalProjects = projects.length
  const totalJudges = judges.length
  const totalScores = scores.length
  const totalReports = reports.length

  // Calculate Criteria Averages for Analytics
  // Criteria:
  // A: c1111111-1111-1111-1111-111111111111 (Presentation, max 65)
  // B: c2222222-2222-2222-2222-222222222222 (Teamwork, max 40)
  // C: c3333333-3333-3333-3333-333333333333 (Marketability, max 65)
  const getCriteriaAverage = (criteriaId: string, maxScore: number) => {
    const matchingScores = scores.filter((s) => s.criteria_id === criteriaId)
    if (matchingScores.length === 0) return { avg: 0, percentage: 0 }
    const total = matchingScores.reduce((sum, s) => sum + s.score, 0)
    const avg = total / matchingScores.length
    const percentage = (avg / maxScore) * 100
    return { avg: parseFloat(avg.toFixed(1)), percentage: parseFloat(percentage.toFixed(1)) }
  }

  const avgK1 = getCriteriaAverage('c1111111-1111-1111-1111-111111111111', 20)
  const avgK2 = getCriteriaAverage('c2222222-2222-2222-2222-222222222222', 30)
  const avgK3 = getCriteriaAverage('c3333333-3333-3333-3333-333333333333', 20)
  const avgK4 = getCriteriaAverage('c4444444-4444-4444-4444-444444444444', 25)
  const avgK5 = getCriteriaAverage('c5555555-5555-5555-5555-555555555555', 5)

  // Handlers
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
      setSuccessMsg('Projek baharu berjaya didaftarkan!')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar projek.')
    } finally {
      setSubmittingProj(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam projek ini? Semua skor dan laporan berkaitan akan dipadamkan.')) return
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

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingJudge(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // Direct call to API
      const res = await fetch('/api/admin/judges/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: judgeName,
          panelLabel: judgePanel,
          email: judgeEmail,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mendaftar juri.')

      setJudgeName('')
      setJudgeEmail('')
      setSuccessMsg(`Panel Juri "${data.judge.name}" berjaya didaftarkan! (Akaun sedia log masuk)`)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar juri.')
    } finally {
      setSubmittingJudge(false)
    }
  }

  const handleDeleteJudge = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam Juri ini? Semua pemarkahan mereka akan dibatalkan.')) return
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.from('judges').delete().eq('id', id)
      if (error) throw error
      setSuccessMsg('Juri berjaya dipadam!')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memadam juri.')
    }
  }

  const handleCreateEntrepreneur = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingEnt(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/admin/entrepreneurs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entName,
          email: entEmail,
          projectId: entProjId || null,
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mendaftar usahawan.')

      setEntName('')
      setEntEmail('')
      setEntProjId('')
      setSuccessMsg(`Profil usahawan "${data.profile.name}" berjaya didaftarkan! (Akaun sedia log masuk)`)
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftar usahawan.')
    } finally {
      setSubmittingEnt(false)
    }
  }

  const handleDeleteProfile = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam akaun usahawan ini? Pautan ke projek mereka akan dikosongkan.')) return
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error
      setSuccessMsg('Akaun usahawan berjaya dipadam!')
      router.refresh()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memadam profil usahawan.')
    }
  }

  const handleSavePrompt = (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPrompt(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      // Save custom system prompt in cookie (expires in 1 year)
      document.cookie = `imex_custom_system_prompt=${encodeURIComponent(aiPrompt)}; path=/; max-age=31536000; SameSite=Lax`
      setSuccessMsg('System Instruction Gemini AI berjaya dikemas kini untuk penjanaan laporan seterusnya!')
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan prompt tersuai.')
    } finally {
      setSavingPrompt(false)
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
          <Settings className="w-5 h-5 text-teal-neon animate-spin" style={{ animationDuration: '8s' }} />
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-teal-neon to-cyan-neon bg-clip-text text-transparent">
              IMEX AI-Biz
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Panel Urus Setia (Admin)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/loan-products')}
            className="px-3 py-1.5 bg-teal-neon/10 hover:bg-teal-neon/20 border border-teal-neon/20 text-teal-neon font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 animate-none" />
            <span>Skim Pinjaman</span>
          </button>
          <div className="text-right">
            <span className="text-xs font-semibold block text-red-400">{adminName}</span>
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
      <main className="max-w-6xl w-full mx-auto px-4 pt-6 flex flex-col gap-6">
        
        {/* Statistics Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card rounded-xl border border-white/5 p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Jumlah Projek / Startup</span>
              <span className="text-2xl font-black text-white mt-1 block">{totalProjects}</span>
            </div>
            <Briefcase className="w-8 h-8 text-cyan-500/20" />
          </div>
          <div className="glass-card rounded-xl border border-white/5 p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Panel Penilai (Juri)</span>
              <span className="text-2xl font-black text-cyan-400 mt-1 block">{totalJudges}</span>
            </div>
            <Users className="w-8 h-8 text-cyan-400/20" />
          </div>
          <div className="glass-card rounded-xl border border-white/5 p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Jumlah Undian Masuk</span>
              <span className="text-2xl font-black text-teal-neon mt-1 block">{totalScores}</span>
            </div>
            <LineChart className="w-8 h-8 text-teal-neon/20" />
          </div>
          <div className="glass-card rounded-xl border border-white/5 p-4 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block uppercase">Laporan Perniagaan AI</span>
              <span className="text-2xl font-black text-yellow-500 mt-1 block">{totalReports}</span>
            </div>
            <Sparkles className="w-8 h-8 text-yellow-500/20" />
          </div>
        </div>

        {/* Dynamic Alert Messages */}
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

        {/* Tab Headers */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => { setActiveTab('analytics'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-cyan-500 text-cyan-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            Analitis & Ringkasan
          </button>
          <button
            onClick={() => { setActiveTab('projects'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'projects'
                ? 'border-cyan-500 text-cyan-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Urus Projek
          </button>
          <button
            onClick={() => { setActiveTab('judges'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'judges'
                ? 'border-cyan-500 text-cyan-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Urus Juri
          </button>
          <button
            onClick={() => { setActiveTab('entrepreneurs'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'entrepreneurs'
                ? 'border-cyan-500 text-cyan-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Urus Usahawan
          </button>
          <button
            onClick={() => { setActiveTab('ai'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'ai'
                ? 'border-cyan-500 text-cyan-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Tetapan Prompt AI
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-lg transition-all border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-cyan-500 text-cyan-400 bg-white/5'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Tetapan Acara
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          
          {/* TAB 1: ANALYTICS & SUMMARY */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Criteria Performance Chart */}
              <div className="lg:col-span-2 glass-card rounded-xl border border-white/5 p-5 space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-gray-200">Purata Prestasi Skor Mengikut Kriteria</h3>
                  <p className="text-xs text-gray-500">Berdasarkan undian masuk daripada semua juri yang sah</p>
                </div>

                {/* Custom CSS Bar Chart */}
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="font-bold text-teal-neon">K1: Idea (Kreativiti)</span>
                      <span className="font-black text-white">{avgK1.avg} / 20 mata ({avgK1.percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3.5 overflow-hidden border border-white/5 p-0.5">
                      <div 
                        className="bg-gradient-to-r from-teal-500 to-teal-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${avgK1.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="font-bold text-cyan-400">K2: Hasil Inovasi (Output)</span>
                      <span className="font-black text-white">{avgK2.avg} / 30 mata ({avgK2.percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3.5 overflow-hidden border border-white/5 p-0.5">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${avgK2.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="font-bold text-purple-400">K3: Impak (Efisien / Keberkesanan)</span>
                      <span className="font-black text-white">{avgK3.avg} / 20 mata ({avgK3.percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3.5 overflow-hidden border border-white/5 p-0.5">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${avgK3.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="font-bold text-yellow-400">K4: Impak (Signifikal / Relevan)</span>
                      <span className="font-black text-white">{avgK4.avg} / 25 mata ({avgK4.percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3.5 overflow-hidden border border-white/5 p-0.5">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${avgK4.percentage}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span className="font-bold text-pink-400">K5: Pengurusan (Komitmen)</span>
                      <span className="font-black text-white">{avgK5.avg} / 5 mata ({avgK5.percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3.5 overflow-hidden border border-white/5 p-0.5">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-pink-400 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${avgK5.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 flex justify-between pt-4 border-t border-white/5 font-bold uppercase">
                  <span>Nota: Kesemua kriteria dinilai mengikut markah rasmi skim i-MARATeCH (Jumlah: 100).</span>
                </div>
              </div>

              {/* Top Projects */}
              <div className="lg:col-span-1 glass-card rounded-xl border border-white/5 p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-sm text-gray-200">Kedudukan Projek Terkini</h3>
                  <p className="text-xs text-gray-500">Kedudukan projek inovasi teratas</p>
                </div>

                <div className="space-y-3">
                  {projects.slice(0, 3).map((proj, idx) => {
                    const report = reports.find((r) => r.project_id === proj.id)
                    return (
                      <div key={proj.id} className="flex justify-between items-center bg-navy-900/40 border border-white/5 p-3 rounded-lg text-xs">
                        <div className="truncate pr-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase block">Projek #{idx + 1}</span>
                          <span className="font-bold text-gray-200 block truncate">{proj.title}</span>
                          <span className="text-[9px] text-gray-400 block truncate">{proj.category}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded text-yellow-400 font-black">
                            {report ? `${report.feasibility_score}%` : 'Tiada Laporan'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {projects.length === 0 && (
                    <div className="text-center text-xs text-gray-500 py-6">Tiada projek berdaftar.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS MANAGEMENT */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Add Project Form */}
              <div className="lg:col-span-1 glass-card rounded-xl border border-white/5 p-5 space-y-4 self-start">
                <div className="flex items-center gap-2 text-cyan-400">
                  <PlusCircle className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Tambah Inovasi / Startup</h3>
                </div>

                <form onSubmit={handleCreateProject} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Inovasi / Syarikat</label>
                    <input
                      type="text"
                      required
                      value={projTitle}
                      onChange={(e) => setProjTitle(e.target.value)}
                      placeholder="Contoh: FOCUS DRIVE"
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Kategori Utama</label>
                    <input
                      type="text"
                      required
                      value={projCategory}
                      onChange={(e) => setProjCategory(e.target.value)}
                      placeholder="Contoh: Automotif & IoT"
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Ahli Kumpulan (Koma sebagai pemisah)</label>
                    <input
                      type="text"
                      value={projMembers}
                      onChange={(e) => setProjMembers(e.target.value)}
                      placeholder="Contoh: Ahmad, Ali, Abu"
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Ringkasan Projek</label>
                    <textarea
                      required
                      value={projDesc}
                      onChange={(e) => setProjDesc(e.target.value)}
                      placeholder="Penerangan ringkas fungsi utama projek..."
                      className="w-full h-24 bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProj}
                    className="w-full bg-cyan-500 text-navy-950 text-xs font-bold py-2 rounded transition-all hover:bg-cyan-400 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingProj ? 'Mendaftar...' : 'Daftar Projek'}
                  </button>
                </form>
              </div>

              {/* Projects Table */}
              <div className="lg:col-span-2 glass-card rounded-xl border border-white/5 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Senarai Projek Berdaftar</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5">Projek</th>
                        <th className="py-2.5">Kategori</th>
                        <th className="py-2.5">Pemilik Usahawan</th>
                        <th className="py-2.5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projects.map((proj) => {
                        const ownerProfile = profiles.find((p) => p.id === proj.owner_user_id)
                        return (
                          <tr key={proj.id} className="hover:bg-white/5">
                            <td className="py-3 font-bold text-gray-200">
                              <div>{proj.title}</div>
                              <div className="text-[10px] text-gray-500 font-normal">Ahli: {proj.team_members.join(', ')}</div>
                            </td>
                            <td className="py-3 text-gray-400">{proj.category}</td>
                            <td className="py-3">
                              {ownerProfile ? (
                                <span className="text-xs font-semibold text-teal-neon">{ownerProfile.name}</span>
                              ) : (
                                <span className="text-[10px] text-gray-600 font-semibold italic">Belum Diikat</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteProject(proj.id)}
                                className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Padam Projek"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {projects.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-gray-500">Tiada projek berdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JUDGES MANAGEMENT */}
          {activeTab === 'judges' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Add Judge Form */}
              <div className="lg:col-span-1 glass-card rounded-xl border border-white/5 p-5 space-y-4 self-start">
                <div className="flex items-center gap-2 text-teal-neon">
                  <UserPlus className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Daftar Penilai / Juri</h3>
                </div>

                <form onSubmit={handleCreateJudge} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Juri</label>
                    <input
                      type="text"
                      required
                      value={judgeName}
                      onChange={(e) => setJudgeName(e.target.value)}
                      placeholder="Contoh: Encik Khairul"
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">E-mel Juri</label>
                    <input
                      type="email"
                      required
                      value={judgeEmail}
                      onChange={(e) => setJudgeEmail(e.target.value)}
                      placeholder="Contoh: juri@gmail.com"
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Kumpulan Panel</label>
                    <select
                      value={judgePanel}
                      onChange={(e) => setJudgePanel(e.target.value)}
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Panel 1">Panel 1</option>
                      <option value="Panel 2">Panel 2</option>
                      <option value="Panel 3">Panel 3</option>
                      <option value="Panel Khas">Panel Khas (VIP)</option>
                    </select>
                  </div>

                  <div className="p-2 bg-white/5 border border-white/5 rounded text-[10px] text-gray-400">
                    💡 Kata laluan lalai untuk akaun juri baharu ialah <strong className="text-white">password123</strong>.
                  </div>

                  <button
                    type="submit"
                    disabled={submittingJudge}
                    className="w-full bg-teal-neon text-navy-950 text-xs font-bold py-2 rounded transition-all hover:bg-teal-400 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingJudge ? 'Mendaftar...' : 'Daftar Juri'}
                  </button>
                </form>
              </div>

              {/* Judges List */}
              <div className="lg:col-span-2 glass-card rounded-xl border border-white/5 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Senarai Panel Juri Aktif</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5">Nama Juri</th>
                        <th className="py-2.5">E-mel</th>
                        <th className="py-2.5">Panel</th>
                        <th className="py-2.5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {judges.map((j) => {
                        const prof = profiles.find((p) => p.id === j.user_id)
                        return (
                          <tr key={j.id} className="hover:bg-white/5">
                            <td className="py-3 font-bold text-gray-200 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-teal-neon" />
                              {j.name}
                            </td>
                            <td className="py-3 text-gray-400">{prof?.email || 'N/A'}</td>
                            <td className="py-3">
                              <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-400 font-bold">
                                {j.panel_label}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteJudge(j.id)}
                                className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Padam Juri"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {judges.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-gray-500">Tiada juri berdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENTREPRENEURS MANAGEMENT */}
          {activeTab === 'entrepreneurs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
              {/* Add Entrepreneur Form */}
              <div className="lg:col-span-1 glass-card rounded-xl border border-white/5 p-5 space-y-4 self-start">
                <div className="flex items-center gap-2 text-purple-400">
                  <UserPlus className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Daftar Usahawan MARA</h3>
                </div>

                <form onSubmit={handleCreateEntrepreneur} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Nama Usahawan</label>
                    <input
                      type="text"
                      required
                      value={entName}
                      onChange={(e) => setEntName(e.target.value)}
                      placeholder="Contoh: Ahmad FOCUS"
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">E-mel Usahawan</label>
                    <input
                      type="email"
                      required
                      value={entEmail}
                      onChange={(e) => setEntEmail(e.target.value)}
                      placeholder="Contoh: usahawan@gmail.com"
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Pautkan ke Projek Inovasi</label>
                    <select
                      value={entProjId}
                      onChange={(e) => setEntProjId(e.target.value)}
                      className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">-- Tiada (Usahawan Bebas) --</option>
                      {projects
                        .filter((p) => p.owner_user_id === null)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title} ({p.category})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="p-2 bg-white/5 border border-white/5 rounded text-[10px] text-gray-400">
                    💡 Kata laluan lalai untuk usahawan baharu ialah <strong className="text-white">password123</strong>.
                  </div>

                  <button
                    type="submit"
                    disabled={submittingEnt}
                    className="w-full bg-purple-500 text-navy-950 text-xs font-bold py-2 rounded transition-all hover:bg-purple-400 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingEnt ? 'Mendaftar...' : 'Daftar Usahawan'}
                  </button>
                </form>
              </div>

              {/* Entrepreneurs List */}
              <div className="lg:col-span-2 glass-card rounded-xl border border-white/5 p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">Senarai Usahawan MARA Berdaftar</h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-gray-400 uppercase text-[9px] font-bold">
                        <th className="py-2.5">Nama Usahawan</th>
                        <th className="py-2.5">E-mel</th>
                        <th className="py-2.5">Projek Dipaut</th>
                        <th className="py-2.5 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {entrepreneursList.map((ent) => {
                        const linkedProj = projects.find((p) => p.owner_user_id === ent.id)
                        return (
                          <tr key={ent.id} className="hover:bg-white/5">
                            <td className="py-3 font-bold text-gray-200 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-purple-400" />
                              {ent.name}
                            </td>
                            <td className="py-3 text-gray-400">{ent.email}</td>
                            <td className="py-3">
                              {linkedProj ? (
                                <span className="text-[10px] bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded text-green-400 font-bold">
                                  🚀 {linkedProj.title}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-600 font-semibold italic">Tiada Projek</span>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleDeleteProfile(ent.id)}
                                className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                                title="Padam Akaun Usahawan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {entrepreneursList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-gray-500">Tiada usahawan berdaftar.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI PROMPT SETTINGS */}
          {activeTab === 'ai' && (
            <div className="glass-card rounded-xl border border-white/5 p-5 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-yellow-500">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <div>
                  <h3 className="font-bold text-sm text-gray-200">Konfigurasi Prom & Arahan Sistem AI Gemini</h3>
                  <p className="text-xs text-gray-500">Ubah suai arahan sistem kepada AI untuk menekankan geran spesifik (seperti MARA)</p>
                </div>
              </div>

              <form onSubmit={handleSavePrompt} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">System Instruction (Arahan Asas AI)</label>
                  <textarea
                    required
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Tulis arahan sistem di sini..."
                    className="w-full h-48 bg-navy-900/60 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500 leading-relaxed font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={savingPrompt}
                    className="bg-yellow-500 text-navy-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:bg-yellow-400 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${savingPrompt ? 'animate-spin' : ''}`} />
                    {savingPrompt ? 'Menyimpan...' : 'Simpan Arahan Sistem'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if(confirm("Kembalikan kepada tetapan asal IKM/TVET?")) {
                        setAiPrompt('Anda ialah perunding perniagaan pakar TVET/IKM Malaysia. Tugas anda adalah untuk membantu usahawan menstruktur perniagaan mereka untuk permohonan geran rasmi (seperti MARA, TEKUN, MDEC). Sila berikan analisis dalam Bahasa Melayu profesional. PENTING: Jangan reka angka kewangan khusus (misalnya jumlah RM tepat), sebaliknya berikan anggaran kasar atau berasaskan peratusan. Pastikan analisis SWOT, blueprint tindakan, dan skrip elevator pitch adalah khusus dan relevan untuk projek usahawan.');
                      }
                    }}
                    className="bg-white/5 border border-white/10 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:bg-white/10 cursor-pointer"
                  >
                    Set Semula
                  </button>
                </div>
              </form>

              {/* Tips & Recommendations Box */}
              <div className="p-4 bg-navy-900/40 border border-white/5 rounded-xl space-y-2 text-xs">
                <h4 className="font-bold text-teal-neon uppercase text-[10px] tracking-wider">💡 Tips Penyesuaian Arahan AI untuk MARA:</h4>
                <p className="text-gray-400 leading-relaxed">
                  Bagi menarik usahawan MARA, anda boleh menambah arahan khas seperti:
                </p>
                <ul className="list-disc list-inside text-gray-500 space-y-1 pl-1">
                  <li><code className="text-gray-300">"Sila strukturkan bahagian blueprint kewangan supaya sepadan dengan skim pembiayaan Skim Pinjaman Industri Kecil MARA."</code></li>
                  <li><code className="text-gray-300">"Cadangkan jenis latihan keusahawanan khusus MARA di dalam cadangan pembinaan kapasiti."</code></li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: EVENT SETTINGS */}
          {activeTab === 'settings' && (
                <div className="glass-card rounded-xl border border-white/5 p-5 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-teal-neon">
                    <Settings className="w-5 h-5" />
                    <div>
                      <h3 className="font-bold text-sm text-gray-200">Tetapan Acara & Modul Penilaian</h3>
                      <p className="text-xs text-gray-500">Konfigurasi jenis acara dan penyelarasan juri/penilai</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveEventSettings} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Nama Acara</label>
                      <input
                        type="text"
                        disabled
                        value={event.name}
                        className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Slug Acara</label>
                      <input
                        type="text"
                        disabled
                        value={event.slug}
                        className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-400 mb-2">Jenis Acara (Event Type)</label>
                      <select
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full bg-navy-900/60 border border-white/10 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-cyan-500"
                      >
                        <option value="competition">Competition (Pertandingan Standard seperti IMEX)</option>
                        <option value="mara_program">MARA Program (Program Bimbingan & Pembiayaan MARA)</option>
                      </select>
                      <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                        💡 Menukar jenis acara akan menyelaraskan paparan bagi ahli juri dari "Juri Pertandingan" kepada "Penilai Program MARA".
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={savingEvent}
                      className="bg-teal-neon text-navy-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-all hover:bg-teal-400 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {savingEvent ? 'Menyimpan...' : 'Simpan Tetapan Acara'}
                    </button>
                  </form>
                </div>
              )}
            </div>

          </main>
        </div>
  )
}
