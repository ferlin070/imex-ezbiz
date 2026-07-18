'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Landmark,
  User,
  KeyRound,
  Mail,
  Sparkles,
  ShieldAlert,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  UserPlus,
} from 'lucide-react'
import Link from 'next/link'

export default function DaftarPage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const handleDaftar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    // Client-side validation
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('Sila masukkan nama penuh yang sah (sekurang-kurangnya 3 aksara).')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Kata laluan mestilah sekurang-kurangnya 8 aksara.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMsg('Kata laluan dan pengesahan kata laluan tidak sepadan.')
      return
    }
    if (!agreed) {
      setErrorMsg('Sila persetujui Terma dan Syarat Penggunaan sebelum meneruskan.')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create auth account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          throw new Error('Alamat e-mel ini sudah didaftarkan. Sila log masuk atau gunakan e-mel lain.')
        }
        throw new Error(error.message || 'Ralat semasa mendaftar akaun.')
      }

      if (!data.user) {
        throw new Error('Gagal mencipta akaun. Sila cuba lagi.')
      }

      // Step 2: Insert profile record with entrepreneur role
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          name: fullName.trim(),
          role: 'entrepreneur',
        })

      if (profileError) {
        // Profile might already be created by database trigger — that's OK
        if (!profileError.message.includes('duplicate') && !profileError.message.includes('unique')) {
          throw new Error('Akaun dicipta tetapi profil gagal disimpan. Sila hubungi pentadbir.')
        }
      }

      // Check if email confirmation is required
      if (data.session) {
        // Logged in immediately (email confirmation disabled in project settings)
        setSuccessMsg('Akaun berjaya didaftarkan! Mengalihkan ke dashboard...')
        setTimeout(() => router.push('/usahawan'), 1500)
      } else {
        // Email confirmation required
        setSuccessMsg(
          'Akaun berjaya didaftarkan! Sila semak e-mel anda untuk mengesahkan alamat e-mel sebelum log masuk.'
        )
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ralat pendaftaran berlaku.')
    } finally {
      setLoading(false)
    }
  }

  const passwordStrength = () => {
    if (!password) return null
    if (password.length < 6) return { level: 'lemah', color: 'bg-rose-500', width: 'w-1/3' }
    if (password.length < 10) return { level: 'sederhana', color: 'bg-amber-400', width: 'w-2/3' }
    return { level: 'kukuh', color: 'bg-teal-400', width: 'w-full' }
  }
  const strength = passwordStrength()

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-950 text-gray-100 min-h-screen relative overflow-hidden">
      {/* Decorative glowing blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Portal Kebangsaan MARA</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Daftar Akaun Usahawan
          </h1>
          <p className="text-xs text-gray-400">
            Cipta akaun baharu untuk menyemak kelayakan pembiayaan MARA anda
          </p>
        </div>

        {/* Role indicator */}
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800">
          <User className="w-4 h-4 text-teal-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-gray-300">Akaun Usahawan</p>
            <p className="text-[10px] text-gray-500">Khusus untuk usahawan Bumiputera yang ingin memohon pembiayaan MARA</p>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-start gap-2.5 text-teal-400 text-xs leading-relaxed">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {!successMsg && (
          <form onSubmit={handleDaftar} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="daftar-nama" className="text-xs text-gray-400 font-bold block">
                Nama Penuh (Seperti IC)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="daftar-nama"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-teal-400 transition-colors"
                  placeholder="cth: Mohamad Ali bin Abdullah"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="daftar-email" className="text-xs text-gray-400 font-bold block">
                Alamat E-mel
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="daftar-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 outline-none focus:border-teal-400 transition-colors"
                  placeholder="cth: usahawan@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="daftar-kata-laluan" className="text-xs text-gray-400 font-bold block">
                Kata Laluan
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="daftar-kata-laluan"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 outline-none focus:border-teal-400 transition-colors"
                  placeholder="Sekurang-kurangnya 8 aksara"
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
              {/* Password strength indicator */}
              {strength && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-[10px] text-gray-500">Kekuatan: <span className="text-gray-300">{strength.level}</span></p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label htmlFor="daftar-sahkan" className="text-xs text-gray-400 font-bold block">
                Sahkan Kata Laluan
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="daftar-sahkan"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-950 border rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-200 outline-none transition-colors ${
                    confirmPassword && password !== confirmPassword
                      ? 'border-rose-500/50 focus:border-rose-400'
                      : 'border-slate-800 focus:border-teal-400'
                  }`}
                  placeholder="Ulangi kata laluan"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label="Tunjuk/sembunyikan pengesahan kata laluan"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-rose-400">Kata laluan tidak sepadan.</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-[10px] text-teal-400">✓ Kata laluan sepadan.</p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                id="daftar-terma"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-teal-400 w-4 h-4 shrink-0 cursor-pointer"
              />
              <label htmlFor="daftar-terma" className="text-[11px] text-gray-400 leading-relaxed cursor-pointer">
                Saya bersetuju dengan{' '}
                <span className="text-teal-400">Terma dan Syarat Penggunaan</span>{' '}
                portal MARA AI-Advisor dan memahami bahawa maklumat yang diberikan adalah untuk tujuan semakan kelayakan sahaja.
              </label>
            </div>

            {/* Submit */}
            <button
              id="daftar-submit"
              type="submit"
              disabled={loading || !agreed}
              className="w-full py-3 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-teal-500/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  <span>Mendaftar...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Daftar Akaun</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sudah ada akaun? Log Masuk</span>
          </Link>
        </div>
      </div>

      {/* Footer branding */}
      <div className="mt-6 flex items-center gap-2 text-gray-600 text-[10px]">
        <Landmark className="w-3.5 h-3.5" />
        <span>Portal Rasmi MARA AI-Advisor · Penyemak Kelayakan Usahawan</span>
      </div>
    </div>
  )
}
