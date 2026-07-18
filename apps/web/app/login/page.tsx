'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  User,
  Landmark,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  CheckCircle,
  UserPlus,
} from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'entrepreneur' | 'mara_officer'>('entrepreneur')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Forgot password states
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

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
        // Specific error handling for common Supabase failures
        if (error.message.includes('Email not confirmed')) {
          throw new Error('E-mel anda belum disahkan. Sila semak peti masuk anda untuk pautan pengesahan.')
        }
        if (error.status === 429 || error.message.includes('Too many requests')) {
          throw new Error('Terlalu banyak percubaan log masuk. Sila cuba lagi sebentar lagi.')
        }
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-mel atau kata laluan tidak sah.')
        }
        throw new Error(error.message)
      }

      // Check profile in DB
      const user = data.user
      if (!user) throw new Error('Pengguna tidak ditemui.')

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileErr || !profile) {
        throw new Error('Akaun dicipta tetapi profil gagal dimuatkan. Sila hubungi pentadbir.')
      }

      // Role check constraint (officer vs entrepreneur)
      if (role === 'mara_officer') {
        if (profile.role !== 'mara_officer' && profile.role !== 'admin') {
          throw new Error('Akses dinafikan. Akaun ini bukan akaun Pegawai MARA.')
        }
        // Save mock cookie for middleware backcompat
        document.cookie = `imex_mock_session=${user.id}; path=/; max-age=86400; SameSite=Lax`
        router.push('/pegawai')
      } else {
        if (profile.role !== 'entrepreneur') {
          throw new Error('Akses dinafikan. Akaun ini bukan akaun Usahawan.')
        }
        document.cookie = `imex_mock_session=${user.id}; path=/; max-age=86400; SameSite=Lax`
        router.push('/usahawan')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Log masuk gagal.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Sila isi alamat e-mel anda terlebih dahulu.')
      return
    }

    setForgotLoading(true)
    setForgotSent(false)
    setErrorMsg('')

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
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-mara-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-mara-red/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mara-gold/10 border border-mara-gold/20 text-mara-gold text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Portal Kebangsaan MARA</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-mara-red to-mara-gold bg-clip-text text-transparent">
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
                ? 'bg-mara-red text-white'
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
                ? 'bg-mara-red text-white'
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
                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-mara-red"
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
                className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 outline-none focus:border-mara-red"
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
                className="text-[10px] text-gray-500 hover:text-mara-gold transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                {forgotLoading ? 'Menghantar...' : 'Lupa Kata Laluan?'}
              </button>
            </div>
            {forgotSent && (
              <div className="flex items-center gap-1.5 text-[10px] text-mara-gold mt-1">
                <CheckCircle className="w-3 h-3 text-mara-gold" />
                <span>E-mel penetapan semula kata laluan telah dihantar. Sila semak peti masuk anda.</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-mara-red to-mara-gold hover:from-mara-red/80 hover:to-mara-gold/80 text-white font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-mara-red/10 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Sila tunggu...' : 'Log Masuk'}
          </button>
        </form>

        {/* Daftar link */}
        <div className="text-center border-t border-slate-800 pt-4">
          <Link
            href="/daftar"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-mara-gold transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Belum ada akaun? <span className="text-mara-gold font-bold">Daftar sekarang</span></span>
          </Link>
        </div>
      </div>
    </div>
  )
}
