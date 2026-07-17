'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, ShieldAlert, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react'

export default function ChangePasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    if (password.length < 6) {
      setErrorMsg('Kata laluan mestilah sekurang-kurangnya 6 aksara.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Kata laluan dan pengesahan kata laluan tidak sepadan.')
      setLoading(false)
      return
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Sesi tidak dijumpai. Sila log masuk semula.')
      }

      // Update password & metadata in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: { must_change_password: false }
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      // Fetch user profile to route properly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setTimeout(() => {
        if (profile?.role === 'judge') {
          router.push('/ranking/ikm-besut-2026')
        } else if (profile?.role === 'admin') {
          router.push('/admin/events')
        } else if (profile?.role === 'mara_officer') {
          router.push('/search')
        } else {
          router.push('/')
        }
      }, 2000)
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menukar kata laluan.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#020617] text-gray-100 min-h-screen relative overflow-hidden">
      {/* Background glow blooms */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-white/10 shadow-2xl relative z-10 space-y-6">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/50 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LOG MASUK PERTAMA</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">
            Tukar Kata Laluan
          </h1>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Anda menggunakan kata laluan sementara. Sila tetapkan kata laluan baharu yang selamat sebelum mengakses sistem.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs leading-relaxed animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-xl bg-green-950/40 border border-green-500/30 text-center space-y-3 animate-fadeIn">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
            <h3 className="text-sm font-bold text-green-400">Kata Laluan Berjaya Dikemas Kini!</h3>
            <p className="text-xs text-gray-400">Mengalihkan anda ke laman utama peranti...</p>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Kata Laluan Baharu
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 aksara"
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Sahkan Kata Laluan
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulang kata laluan baharu"
                  className="w-full bg-[#0b0f19] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-gray-200 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-navy-950 font-black rounded-xl hover:from-teal-400 hover:to-teal-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(20,184,166,0.2)] hover:shadow-[0_0_20px_rgba(20,184,166,0.4)] disabled:opacity-50 text-xs uppercase tracking-wider mt-6"
            >
              <span>{loading ? 'Mengemas kini...' : 'Simpan Kata Laluan'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
