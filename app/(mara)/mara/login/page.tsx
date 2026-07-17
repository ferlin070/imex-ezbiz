'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, KeyRound, Mail, AlertCircle, ArrowRight } from 'lucide-react'

export default function MaraLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile && (profile.role === 'mara_officer' || profile.role === 'admin')) {
          router.push('/search')
        }
      }
    }
    checkSession()
  }, [supabase, router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      let userRole = null

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        throw new Error('E-mel atau kata laluan salah atau tiada kebenaran akses MARA.')
      }

      const user = data.user

      // Logged in with real Supabase, fetch role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profil pengguna tidak dijumpai.')
      }
      userRole = profile.role

      if (user) {
        // Verify role is mara_officer or admin
        if (userRole !== 'mara_officer' && userRole !== 'admin') {
          await supabase.auth.signOut()
          throw new Error('Akses dinafikan. Halaman ini hanya dikhaskan untuk Pegawai MARA.')
        }

        // Redirect to search console
        router.push('/search')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat semasa log masuk.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card container */}
      <div className="w-full max-w-md z-10 space-y-6">
        <div className="text-center space-y-2">
          {/* Logo Badge */}
          <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 mb-2 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white bg-gradient-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
            MARA Talent Scout
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Konsol Carian & Padanan Geran Usahawan i-MARATeCH
          </p>
        </div>

        {/* Login form card */}
        <div className="glass-card rounded-2xl border border-white/5 bg-navy-950/40 backdrop-blur-xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          {errorMsg && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                E-mel Pegawai
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="pegawai@mara.gov.my"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0b0f19] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Kata Laluan
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-[#0b0f19] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all focus:ring-1 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-[#020617] font-black rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50 text-xs uppercase tracking-wider mt-6"
            >
              <span>{loading ? 'Menghubungkan...' : 'Log Masuk Portal'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <div className="text-center">
          <a
            href="/login"
            className="text-xs text-amber-500/60 hover:text-amber-500 font-bold hover:underline transition-all cursor-pointer"
          >
            Log masuk sebagai Usahawan atau Panel Juri →
          </a>
        </div>
      </div>
    </div>
  )
}
