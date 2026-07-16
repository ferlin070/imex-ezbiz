'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Award, BarChart3, Users, Play, LogOut, ArrowLeft, RefreshCw } from 'lucide-react'
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
  category: string
  team_members: string[]
  owner_user_id: string
}

interface ScoreEntry {
  project_id: string
  judge_id: string
  criteria_id: string
  score: number
}

interface RankingViewProps {
  event: { id: string; name: string; slug: string }
  criteria: Criterion[]
  projects: Project[]
  initialScores: ScoreEntry[]
  totalJudges: number
  userRole: 'authenticated' | 'anonymous'
}

export default function RankingView({
  event,
  criteria,
  projects,
  initialScores,
  totalJudges,
  userRole,
}: RankingViewProps) {
  const router = useRouter()
  const supabase = createClient()

  const [scores, setScores] = useState<ScoreEntry[]>(initialScores)
  const [activeTab, setActiveTab] = useState<'overall' | string>('overall') // 'overall' or criteriaId
  const [refreshing, setRefreshing] = useState(false)

  // Fetch latest scores from Supabase
  const fetchScores = async () => {
    if (projects.length === 0) return
    setRefreshing(true)
    const { data, error } = await supabase
      .from('scores')
      .select('project_id, judge_id, criteria_id, score')
      .in('project_id', projects.map((p) => p.id))

    if (!error && data) {
      setScores(data)
    }
    setRefreshing(false)
  }

  // Subscribe to Realtime score updates
  useEffect(() => {
    const channel = supabase
      .channel('scores-realtime-ranking')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scores' },
        () => {
          fetchScores()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Calculate scores and statistics for each project
  const projectRankings = useMemo(() => {
    return projects.map((proj) => {
      // Filter scores for this specific project
      const projScores = scores.filter((s) => s.project_id === proj.id)

      // Count unique judges who voted
      const votingJudgesCount = new Set(projScores.map((s) => s.judge_id)).size

      // 1. Calculate overall feasibility score %
      let totalWeightedRatioSum = 0
      let totalWeightSum = 0

      criteria.forEach((c) => {
        // Average score for this criterion for this project
        const critScores = projScores.filter((s) => s.criteria_id === c.id)
        const avgScore =
          critScores.length > 0
            ? critScores.reduce((sum, s) => sum + Number(s.score), 0) / critScores.length
            : 0

        const weight = Number(c.weight) || 1
        const ratio = c.max_score > 0 ? avgScore / Number(c.max_score) : 0

        totalWeightedRatioSum += ratio * weight
        totalWeightSum += weight
      })

      const overallScore = totalWeightSum > 0 ? (totalWeightedRatioSum / totalWeightSum) * 100 : 0

      // 2. Calculate breakdown by specific criteria
      const criteriaScores: Record<string, { average: number; percentage: number }> = {}
      criteria.forEach((c) => {
        const critScores = projScores.filter((s) => s.criteria_id === c.id)
        const avgScore =
          critScores.length > 0
            ? critScores.reduce((sum, s) => sum + Number(s.score), 0) / critScores.length
            : 0
        const percentage = c.max_score > 0 ? (avgScore / Number(c.max_score)) * 100 : 0

        criteriaScores[c.id] = {
          average: Number(avgScore.toFixed(1)),
          percentage: Number(percentage.toFixed(1)),
        }
      })

      return {
        ...proj,
        overallScore: Number(overallScore.toFixed(1)),
        votingJudgesCount,
        criteriaScores,
      }
    })
  }, [projects, scores, criteria])

  // Sort rankings depending on active tab selection
  const sortedRankings = useMemo(() => {
    const list = [...projectRankings]
    if (activeTab === 'overall') {
      return list.sort((a, b) => b.overallScore - a.overallScore)
    } else {
      return list.sort(
        (a, b) =>
          (b.criteriaScores[activeTab]?.percentage || 0) -
          (a.criteriaScores[activeTab]?.percentage || 0)
      )
    }
  }, [projectRankings, activeTab])

  const getTierDetails = (score: number) => {
    if (score >= 80) return { label: 'Sangat Berpotensi', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
    if (score >= 60) return { label: 'Layak Komersial', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }
    if (score >= 40) return { label: 'Berpotensi Sederhana', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' }
    return { label: 'Perlu Bimbingan', color: 'text-red-400 bg-red-500/10 border-red-500/20' }
  }

  const getMedal = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `#${index + 1}`
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex-1 flex flex-col bg-navy-950 text-gray-100 min-h-screen pb-12">
      {/* Header bar */}
      <header className="sticky top-0 bg-navy-900/80 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-neon" />
          <div>
            <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-teal-neon to-cyan-neon bg-clip-text text-transparent">
              Keputusan Live Inovasi
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">{event.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchScores}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg border border-white/5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {userRole === 'authenticated' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push(`/vote/${event.slug}`)}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-teal-neon border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-teal-neon" />
                <span>Undi Projek</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 px-4 py-1.5 rounded-lg text-xs font-extrabold shadow-[0_0_10px_rgba(0,242,254,0.3)] transition-all cursor-pointer"
            >
              Log Masuk Juri
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 pt-6 flex flex-col gap-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-white/5">
          <button
            onClick={() => setActiveTab('overall')}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overall'
                ? 'bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 shadow-[0_0_10px_rgba(0,242,254,0.2)]'
                : 'bg-navy-900/40 text-gray-400 hover:text-gray-200 border border-white/5'
            }`}
          >
            Kedudukan Keseluruhan
          </button>
          {criteria.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === c.id
                  ? 'bg-gradient-to-r from-teal-neon to-cyan-neon text-navy-950 shadow-[0_0_10px_rgba(0,242,254,0.2)]'
                  : 'bg-navy-900/40 text-gray-400 hover:text-gray-200 border border-white/5'
              }`}
            >
              {c.code}. {c.label}
            </button>
          ))}
        </div>

        {/* Real-time Indicator banner */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping shrink-0" />
            <span>Kemas kini secara masa nyata aktif</span>
          </div>
          <span>Total Juri Berdaftar: {totalJudges} orang</span>
        </div>

        {/* Rankings List */}
        <div className="space-y-3">
          {sortedRankings.length > 0 ? (
            sortedRankings.map((item, index) => {
              const displayScore =
                activeTab === 'overall'
                  ? item.overallScore
                  : item.criteriaScores[activeTab]?.percentage || 0

              const tier = getTierDetails(displayScore)
              const medal = getMedal(index)

              return (
                <div
                  key={item.id}
                  className={`glass-card rounded-xl border border-white/5 p-4 flex items-center justify-between gap-4 transition-all relative overflow-hidden ${
                    index < 3
                      ? 'border-cyan-500/20 shadow-[0_0_15px_rgba(0,242,254,0.03)]'
                      : ''
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-xl font-black w-8 text-center shrink-0">{medal}</span>
                    <div className="truncate">
                      <h3 className="font-extrabold text-sm text-gray-200 truncate">{item.title}</h3>
                      <p className="text-[10px] text-gray-500 font-semibold truncate">
                        {item.category || 'Kategori Umum'}
                      </p>
                      {/* Voted Panel Count */}
                      <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-1 font-bold">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span>{item.votingJudgesCount} / {totalJudges} Panel Menilai</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Tier Badge */}
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-xl font-black text-teal-neon">{displayScore}</span>
                      <span className="text-[10px] text-gray-500 font-bold">%</span>
                    </div>
                    {activeTab === 'overall' ? (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${tier.color}`}>
                        {tier.label}
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 font-bold uppercase">
                        Kriteria {criteria.find(c => c.id === activeTab)?.code}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="glass-card rounded-xl border border-white/5 p-12 text-center text-gray-400">
              Tiada projek ditemui untuk acara ini.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
