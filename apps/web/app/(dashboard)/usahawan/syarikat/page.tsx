import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Building2, CheckCircle, Save, ArrowLeft, Upload, FileCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function SyarikatPage() {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch existing company profile
  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  const isNew = !companyProfile

  // 3. Server Action: Save company profile
  async function handleSaveCompany(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const businessName   = formData.get('businessName') as string
    const ssmNumber      = formData.get('ssmNumber') as string
    const entityType     = formData.get('entityType') as string
    const operatingSince = formData.get('operatingSince') as string || null
    const address        = formData.get('address') as string
    const state          = formData.get('state') as string
    const district       = formData.get('district') as string
    const ownerFullName  = formData.get('ownerFullName') as string
    const ownerIcNumber  = formData.get('ownerIcNumber') as string
    const ownerAge       = parseInt(formData.get('ownerAge') as string) || 30
    const phone          = formData.get('phone') as string
    const isBumiputera   = formData.get('isBumiputera') === 'true'

    await supabase
      .from('company_profiles')
      .upsert({
        owner_user_id: user.id,
        business_name: businessName,
        ssm_number: ssmNumber,
        ssm_registered: true,
        entity_type: entityType,
        operating_since: operatingSince,
        address, state, district,
        owner_full_name: ownerFullName,
        owner_ic_number: ownerIcNumber,
        is_bumiputera: isBumiputera,
        owner_age: ownerAge,
        phone,
      }, { onConflict: 'owner_user_id' })

    revalidatePath('/usahawan/syarikat')
    revalidatePath('/usahawan')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
        <Link
          href="/usahawan"
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-2">
            <Building2 className="w-6 h-6 text-mara-red" />
            Profil Syarikat
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Maklumat syarikat diisi <strong className="text-slate-200">sekali sahaja</strong> dan digunakan untuk semua produk/inovasi yang didaftarkan.
          </p>
        </div>

        {companyProfile && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Profil Lengkap
          </span>
        )}
      </div>

      {isNew && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200 leading-relaxed">
            <strong>Profil syarikat belum diisi.</strong> Lengkapkan maklumat di bawah sebelum mendaftar produk atau inovasi. Maklumat ini digunakan untuk penilaian kelayakan MARA.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <form action={handleSaveCompany} className="lg:col-span-2 space-y-6">

          {/* Maklumat Syarikat */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-mara-red" />
              Maklumat Syarikat / Perniagaan
            </h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Syarikat / Perniagaan <span className="text-rose-400">*</span></label>
              <input
                type="text" name="businessName" required
                defaultValue={companyProfile?.business_name || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-teal-500 transition"
                placeholder="e.g. Indah Cipta Trading"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">No. Pendaftaran SSM</label>
                <input
                  type="text" name="ssmNumber"
                  defaultValue={companyProfile?.ssm_number || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                  placeholder="202601012345"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Jenis Entiti</label>
                <select
                  name="entityType"
                  defaultValue={companyProfile?.entity_type || 'milikan_tunggal'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                >
                  <option value="milikan_tunggal">Milikan Tunggal</option>
                  <option value="perkongsian">Perkongsian</option>
                  <option value="sdn_bhd">Syarikat Sendirian Berhad</option>
                  <option value="koperasi">Koperasi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Tarikh Daftar SSM</label>
              <input
                type="date" name="operatingSince"
                defaultValue={companyProfile?.operating_since || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Alamat Perniagaan</label>
              <textarea
                name="address" rows={2}
                defaultValue={companyProfile?.address || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-teal-500 transition resize-none"
                placeholder="No. 12, Jalan Bunga..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Negeri</label>
                <select
                  name="state"
                  defaultValue={companyProfile?.state || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                >
                  <option value="">Pilih Negeri</option>
                  {['Johor','Kedah','Kelantan','Melaka','Negeri Sembilan','Pahang','Perak','Perlis',
                    'Pulau Pinang','Sabah','Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur',
                    'W.P. Labuan','W.P. Putrajaya'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Daerah</label>
                <input
                  type="text" name="district"
                  defaultValue={companyProfile?.district || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                  placeholder="e.g. Petaling Jaya"
                />
              </div>
            </div>
          </div>

          {/* Maklumat Pemilik */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
            <h2 className="text-sm font-bold text-slate-200">Maklumat Pemilik</h2>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Penuh Pemilik <span className="text-rose-400">*</span></label>
              <input
                type="text" name="ownerFullName" required
                defaultValue={companyProfile?.owner_full_name || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-teal-500 transition"
                placeholder="Sama seperti dalam IC"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">No. Kad Pengenalan <span className="text-rose-400">*</span></label>
                <input
                  type="text" name="ownerIcNumber" required
                  defaultValue={companyProfile?.owner_ic_number || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                  placeholder="900101115555"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Umur</label>
                <input
                  type="number" name="ownerAge" min={18} max={99}
                  defaultValue={companyProfile?.owner_age || 30}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">No. Telefon <span className="text-rose-400">*</span></label>
                <input
                  type="tel" name="phone" required
                  defaultValue={companyProfile?.phone || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                  placeholder="0123456789"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Status Bumiputera</label>
                <select
                  name="isBumiputera"
                  defaultValue={companyProfile?.is_bumiputera?.toString() ?? 'true'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200 outline-none focus:border-mara-red transition"
                >
                  <option value="true">Bumiputera</option>
                  <option value="false">Non-Bumiputera</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-mara-red hover:bg-mara-red/80 text-white font-black rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isNew ? 'Simpan Profil Syarikat' : 'Kemaskini Profil Syarikat'}
          </button>
        </form>

        {/* Sidebar: Dokumen */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Upload className="w-4 h-4 text-mara-red" />
              Dokumen Wajib
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Muat naik dokumen berikut untuk menyokong permohonan pembiayaan MARA anda.
            </p>

            <div className="space-y-2">
              {[
                { label: 'Sijil Pendaftaran SSM', key: 'ssm_cert', required: true },
                { label: 'Kertas Rancangan Perniagaan', key: 'business_plan', required: true },
                { label: 'Penyata Bank (3 bulan)', key: 'bank_statement', required: false },
                { label: 'Salinan Kad Pengenalan', key: 'ic_copy', required: true },
              ].map(doc => (
                <div key={doc.key} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <FileCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-300 font-medium truncate">{doc.label}</p>
                    {doc.required && <p className="text-[9px] text-rose-400">Wajib</p>}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              ⚠️ Upload dokumen sebenar akan diaktifkan selepas profil syarikat disimpan. Pastikan semua dokumen dalam format PDF/JPG (max 5MB).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-mara-red/5 border border-mara-red/20 space-y-2">
            <p className="text-[11px] text-mara-gold font-bold">Tip: Isi sekali, guna berkali</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Maklumat syarikat ini digunakan secara automatik setiap kali anda mendaftar produk baru — tanpa perlu isi semula.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
