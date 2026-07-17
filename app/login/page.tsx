'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Award, User, ShieldAlert, KeyRound, Mail, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'judge' | 'entrepreneur'>('judge')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        throw new Error('E-mel atau kata laluan salah. Sila cuba lagi.')
      }

      const user = data.user

      // Fetch real profile from Supabase
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profil pengguna tidak dijumpai.')
      }

      if (profile.role === 'judge') {
        router.push('/ranking/ikm-besut-2026')
      } else if (profile.role === 'admin') {
        router.push('/admin/events')
      } else {
        const { data: project } = await supabase
          .from('projects')
          .select('id')
          .eq('owner_user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (project) {
          router.push(`/project/${project.id}`)
        } else {
          router.push('/')
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat log masuk berlaku.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-navy-950 text-gray-100 min-h-screen relative overflow-hidden">
      {/* Decorative glowing blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 text-sm font-semibold mb-3">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>FASA MVP</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-neon to-cyan-neon bg-clip-text text-transparent">
            IMEX AI-Biz
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Penjana Laporan Perniagaan Pintar Bersedia-Geran
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-navy-900/60 p-1.5 rounded-lg border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => setRole('judge')}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              role === 'judge'
                ? 'bg-cyan-500/20 text-teal-neon border border-cyan-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Juri / Penilai</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('entrepreneur')}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              role === 'entrepreneur'
                ? 'bg-cyan-500/20 text-teal-neon border border-cyan-500/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Usahawan</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-950/40 border border-red-500/30 text-red-400 text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              E-mel Pengguna
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={role === 'judge' ? 'juri1@gmail.com' : 'usahawan1@gmail.com'}
                className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Kata Laluan
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-navy-900/60 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-neon to-cyan-neon hover:from-teal-neon/90 hover:to-cyan-neon/90 text-navy-950 font-bold py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)] hover:shadow-[0_0_20px_rgba(0,242,254,0.5)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Log Masuk</span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
