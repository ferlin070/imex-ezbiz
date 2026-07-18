'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Landmark, User, ShieldAlert, KeyRound, Mail, Sparkles, Eye, EyeOff, UserPlus, HelpCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
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

        if (profile) {
          if (profile.role === 'admin' || profile.role === 'mara_officer') {
            router.push('/pegawai')
          } else if (profile.role === 'entrepreneur') {
            router.push('/usahawan')
          } else {
            router.push('/')
          }
        }
      }
    }
    checkSession()
  }, [supabase, router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'entrepreneur' | 'mara_officer'>('entrepreneur')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        const msg = error.message?.toLowerCase() || ''
        const status = (error as any)?.status

        if (status === 429 || msg.includes('rate limit') || msg.includes('too many requests')) {
          throw new Error('Terlalu banyak percubaan log masuk. Sila tunggu beberapa minit sebelum cuba semula.')
        }
        if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
          throw new Error(
            'E-mel anda belum disahkan. Sila semak peti masuk e-mel anda dan klik pautan pengesahan. ' +
            'Jika tidak menerima e-mel, semak folder Spam.'
          )
        }
        if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password') || status === 400) {
          throw new Error('E-mel atau kata laluan salah. Sila semak semula dan cuba lagi.')
        }
        throw new Error(error.message || 'Ralat semasa log masuk.')
      }

      if (!data.user) {
        throw new Error('Log masuk gagal. Sila cuba lagi.')
      }


      const user = data.user

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profil pengguna tidak dijumpai.')
      }

      if (profile.role === 'admin' || profile.role === 'mara_officer') {
        router.push('/pegawai')
      } else if (profile.role === 'entrepreneur') {
        router.push('/usahawan')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat log masuk berlaku.')
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Sila masukkan alamat e-mel anda dahulu untuk menetapkan semula kata laluan.')
      return
    }
    setForgotLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw new Error(error.message)
      setForgotSent(true)
      setErrorMsg('')
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menghantar e-mel penetapan semula kata laluan.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-gray-100 min-h-screen relative overflow-hidden">
      {/* Decorative glowing blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Portal Kebangsaan MARA</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            MARA AI-Advisor
          </h1>
          <p className="text-xs text-gray-400">
            Log masuk untuk menyemak kelayakan dan pelan tindakan pembiayaan
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setRole('entrepreneur')}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              role === 'entrepreneur'
                ? 'bg-teal-400 text-slate-950'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Usahawan</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('mara_officer')}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              role === 'mara_officer'
                ? 'bg-teal-400 text-slate-950'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Pegawai MARA</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-gray-400 font-bold block">Alamat E-mel</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-teal-400"
                placeholder="cth: usahawan@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="login-kata-laluan" className="text-xs text-gray-400 font-bold block">Kata Laluan</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="login-kata-laluan"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 outline-none focus:border-teal-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Tunjuk/sembunyikan kata laluan"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="text-[10px] text-gray-500 hover:text-teal-400 transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                {forgotLoading ? 'Menghantar...' : 'Lupa Kata Laluan?'}
              </button>
            </div>
            {forgotSent && (
              <div className="flex items-center gap-1.5 text-[10px] text-teal-400 mt-1">
                <CheckCircle className="w-3 h-3" />
                <span>E-mel penetapan semula kata laluan telah dihantar. Sila semak peti masuk anda.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-teal-500/10 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Sila tunggu...' : 'Log Masuk'}
          </button>
        </form>


        {/* Daftar link */}
        <div className="text-center border-t border-slate-800 pt-4">
          <Link
            href="/daftar"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-400 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Belum ada akaun? <span className="text-teal-400 font-bold">Daftar sekarang</span></span>
          </Link>
        </div>
      </div>
    </div>
  )
}
