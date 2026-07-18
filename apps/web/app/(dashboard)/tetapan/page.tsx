import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { User, Settings, Save, Sparkles, CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TetapanPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch profile info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // 3. Server Action to save profile details
  async function handleUpdateProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const name = formData.get('fullName') as string

    await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id)

    revalidatePath('/tetapan')
    redirect('/tetapan?success=true')
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
          <Settings className="w-8 h-8 text-teal-400" />
          Profil &amp; Tetapan
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Kemaskini butiran peribadi akaun MARA AI-Advisor anda di sini.
        </p>
      </div>

      {success === 'true' && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs flex items-center gap-2 font-bold">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Profil berjaya dikemaskini secara langsung!</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="p-6 bg-slate-900/40 border border-slate-850 rounded-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-teal-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-200">{profile.name || 'Pengguna MARA'}</h3>
            <span className="text-[10px] bg-teal-400/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded font-black uppercase tracking-wider">
              {profile.role === 'entrepreneur' ? 'Usahawan' : profile.role === 'admin' ? 'Pentadbir Sistem' : 'Pegawai MARA'}
            </span>
          </div>
        </div>

        <form action={handleUpdateProfile} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Alamat E-mel (Tidak boleh diubah)</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full bg-slate-950/60 border border-slate-850 rounded-lg p-2.5 text-slate-500 outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Nama Penuh</label>
            <input
              type="text"
              name="fullName"
              required
              defaultValue={profile.name || ''}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
              placeholder="cth: Ahmad Bin Kassim"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-black rounded-lg transition active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>

      {/* Security note */}
      <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Sistem disulitkan menggunakan Supabase Auth. Semua pertukaran profil direkod secara automatik dalam audit log aktiviti sistem MARA.
        </p>
      </div>
    </div>
  )
}
