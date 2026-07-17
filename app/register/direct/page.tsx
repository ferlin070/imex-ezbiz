'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { businessProfileSchema, BusinessProfileInput } from '@/schemas/business-profile.schema'
import { ArrowLeft, ArrowRight, Save, Upload, Plus, Trash, CheckCircle2, AlertCircle } from 'lucide-react'

const STEPS = [
  'Maklumat Pemilik',
  'Butiran Syarikat',
  'Prestasi Perniagaan',
  'Kewangan & Dana',
  'Dokumen Sokongan'
]

const STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor',
  'Terengganu', 'Wilayah Persekutuan'
]

export default function RegisterDirectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null)
  
  // Storing uploaded document paths in state
  const [uploadedDocs, setUploadedDocs] = useState<{ doc_type: string; storage_path: string; name: string }[]>([])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<BusinessProfileInput>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      ssm_registered: true,
      is_bumiputera: true,
      employee_count: 0,
      has_existing_financing: false,
      fund_usage_breakdown: [
        { category: 'Peralatan & Aset', percent: 50 },
        { category: 'Modal Pusingan', percent: 50 }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fund_usage_breakdown'
  })

  const ssmRegistered = watch('ssm_registered')
  const hasExistingFinancing = watch('has_existing_financing')

  // Handle file uploads to Supabase
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingDoc(docType)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      })
      const result = await res.json()

      if (result.error) {
        alert(result.error)
      } else {
        setUploadedDocs(prev => [
          ...prev.filter(d => d.doc_type !== docType || docType === 'product_photo'), // product_photo can have multiple
          { doc_type: docType, storage_path: result.storage_path, name: file.name }
        ])
      }
    } catch (err) {
      alert('Ralat semasa memuat naik fail.')
    } finally {
      setUploadingDoc(null)
    }
  }

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: any[] = []
    if (currentStep === 0) {
      fieldsToValidate = ['owner_full_name', 'owner_ic_number', 'is_bumiputera', 'owner_age', 'education_level', 'phone']
    } else if (currentStep === 1) {
      fieldsToValidate = ['business_name', 'ssm_registered', 'entity_type', 'operating_since', 'address', 'state', 'district']
      if (ssmRegistered) fieldsToValidate.push('ssm_number')
    } else if (currentStep === 2) {
      fieldsToValidate = ['business_stage', 'monthly_revenue_range', 'employee_count', 'target_market', 'unique_selling_point']
    } else if (currentStep === 3) {
      fieldsToValidate = ['funding_requested_myr', 'fund_usage_breakdown', 'has_existing_financing']
      if (hasExistingFinancing) fieldsToValidate.push('existing_financing_notes')
    }

    const isValid = await trigger(fieldsToValidate as any)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const onSubmit = async (data: BusinessProfileInput) => {
    setLoading(true)
    setSubmitError('')

    // Verify fund usage breakdown totals exactly 100%
    const totalPercent = data.fund_usage_breakdown.reduce((sum, item) => sum + Number(item.percent), 0)
    if (totalPercent !== 100) {
      setSubmitError('Jumlah pecahan penggunaan dana mestilah tepat 100% (Jumlah semasa: ' + totalPercent + '%).')
      setLoading(false)
      return
    }

    // Require at least SSM certificate if marked as registered
    const hasSsmCert = uploadedDocs.some(d => d.doc_type === 'ssm_cert')
    if (data.ssm_registered && !hasSsmCert) {
      setSubmitError('Sila muat naik Sijil SSM anda di bahagian Dokumen Sokongan.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/projects/register-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          documents: uploadedDocs
        })
      })

      const result = await res.json()
      if (result.error) {
        setSubmitError(result.error)
      } else {
        // Redirect to self-assessment page
        router.push(`/register/direct/self-assessment?projectId=${result.projectId}`)
      }
    } catch (err) {
      setSubmitError('Ralat sambungan rangkaian semasa mendaftar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-slate-800/10 blur-[100px] pointer-events-none" />

      <div className="max-w-3xl w-full z-10 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => router.push('/register/track')}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Profil Perniagaan Laluan Terus</h1>
            <p className="text-sm text-slate-400">Pendaftaran maklumat perniagaan lengkap untuk saringan geran/pinjaman MARA</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span>Langkah {currentStep + 1} daripada {STEPS.length}</span>
            <span className="font-semibold text-white">{STEPS[currentStep]}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex gap-0.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 transition-all duration-300 ${
                  i <= currentStep ? 'bg-slate-200' : 'bg-slate-900'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* STEP 0: Maklumat Pemilik */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Maklumat Pemilik Perniagaan</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama Penuh Pemilik (seperti KP)</label>
                <input
                  {...register('owner_full_name')}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  placeholder="Masukkan nama penuh"
                />
                {errors.owner_full_name && <p className="text-xs text-red-400 mt-1">{errors.owner_full_name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">No. Kad Pengenalan</label>
                  <input
                    {...register('owner_ic_number')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                    placeholder="Contoh: 850101015678"
                  />
                  {errors.owner_ic_number && <p className="text-xs text-red-400 mt-1">{errors.owner_ic_number.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Umur</label>
                  <input
                    type="number"
                    {...register('owner_age', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                    placeholder="Contoh: 30"
                  />
                  {errors.owner_age && <p className="text-xs text-red-400 mt-1">{errors.owner_age.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">No. Telefon</label>
                  <input
                    {...register('phone')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                    placeholder="Contoh: 0123456789"
                  />
                  {errors.phone && <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tahap Pendidikan / TVET</label>
                  <input
                    {...register('education_level')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                    placeholder="Contoh: Sijil Kemahiran Malaysia (SKM) / Diploma"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Status Bumiputera</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-sm">
                    <input type="radio" value="true" checked={watch('is_bumiputera') === true} onChange={() => setValue('is_bumiputera', true)} />
                    Ya, Bumiputera
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-sm">
                    <input type="radio" value="false" checked={watch('is_bumiputera') === false} onChange={() => setValue('is_bumiputera', false)} />
                    Bukan Bumiputera
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Butiran Syarikat */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Maklumat Perniagaan / Syarikat</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nama Perniagaan</label>
                <input
                  {...register('business_name')}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  placeholder="Masukkan nama perniagaan"
                />
                {errors.business_name && <p className="text-xs text-red-400 mt-1">{errors.business_name.message}</p>}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Adakah syarikat berdaftar dengan SSM?</h4>
                  <p className="text-xs text-slate-400">Tandakan jika belum berdaftar rasmi untuk perniagaan mikro/sambilan</p>
                </div>
                <input
                  type="checkbox"
                  checked={ssmRegistered}
                  onChange={(e) => {
                    setValue('ssm_registered', e.target.checked)
                    if (!e.target.checked) setValue('ssm_number', '')
                  }}
                  className="w-5 h-5 rounded accent-slate-300 cursor-pointer"
                />
              </div>

              {ssmRegistered && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">No. Pendaftaran SSM</label>
                  <input
                    {...register('ssm_number')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                    placeholder="Contoh: 202603123456"
                  />
                  {errors.ssm_number && <p className="text-xs text-red-400 mt-1">{errors.ssm_number.message}</p>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Jenis Entiti</label>
                  <select
                    {...register('entity_type')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  >
                    <option value="milikan_tunggal">Milikan Tunggal</option>
                    <option value="perkongsian">Perkongsian</option>
                    <option value="sdn_bhd">Sdn Bhd</option>
                    <option value="belum_berdaftar">Belum Berdaftar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tarikh Mula Beroperasi</label>
                  <input
                    type="date"
                    {...register('operating_since')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Negeri Premis</label>
                  <select
                    {...register('state')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  >
                    <option value="">Pilih Negeri</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Daerah</label>
                  <input
                    {...register('district')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                    placeholder="Contoh: Besut"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Alamat Penuh Perniagaan</label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm resize-none"
                  placeholder="Masukkan alamat premis/perniagaan"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Prestasi Perniagaan */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Peringkat & Prestasi Semasa</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Peringkat Perniagaan</label>
                  <select
                    {...register('business_stage')}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  >
                    <option value="idea">Idea Sahaja</option>
                    <option value="prototaip">Prototaip / MVP Sedia</option>
                    <option value="operasi_baru">Beroperasi &lt; 1 Tahun</option>
                    <option value="operasi_1_3_tahun">Beroperasi 1 - 3 Tahun</option>
                    <option value="operasi_matang">Beroperasi &gt; 3 Tahun</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Bilangan Pekerja</label>
                  <input
                    type="number"
                    {...register('employee_count', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                    placeholder="Masukkan jumlah staf"
                  />
                  {errors.employee_count && <p className="text-xs text-red-400 mt-1">{errors.employee_count.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hasil Jualan Bulanan Purata (RM)</label>
                <select
                  {...register('monthly_revenue_range')}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                >
                  <option value="">Pilih Julat Hasil</option>
                  <option value="0-5000">Kurang daripada RM5,000</option>
                  <option value="5000-20000">RM5,000 - RM20,000</option>
                  <option value="20000-50000">RM20,000 - RM50,000</option>
                  <option value="50000-100000">RM50,000 - RM100,000</option>
                  <option value="100000+">Lebih daripada RM100,000</option>
                </select>
                {errors.monthly_revenue_range && <p className="text-xs text-red-400 mt-1">{errors.monthly_revenue_range.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Sasaran Pasaran / Pelanggan Utama</label>
                <input
                  {...register('target_market')}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  placeholder="Contoh: Belia umur 18-30 / Kedai runcit am"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kelebihan Bersaing / USP Produk</label>
                <textarea
                  {...register('unique_selling_point')}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm resize-none"
                  placeholder="Terangkan keunikan produk/teknologi perniagaan anda berbanding pesaing"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Kewangan & Dana */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Keperluan Modal & Dana</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Jumlah Pembiayaan Dipohon (RM)</label>
                <input
                  type="number"
                  {...register('funding_requested_myr', { valueAsNumber: true })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm"
                  placeholder="Masukkan jumlah dalam RM, cth: 50000"
                />
                {errors.funding_requested_myr && <p className="text-xs text-red-400 mt-1">{errors.funding_requested_myr.message}</p>}
              </div>

              {/* Dynamic Fund Usage Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-300">Pecahan Penggunaan Dana (%)</label>
                  <button
                    type="button"
                    onClick={() => append({ category: '', percent: 0 })}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded border border-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Pecahan
                  </button>
                </div>

                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-center">
                      <input
                        {...register(`fund_usage_breakdown.${index}.category` as const)}
                        className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white text-sm"
                        placeholder="Kategori, cth: Pembelian Mesin"
                      />
                      <div className="w-24 relative flex items-center">
                        <input
                          type="number"
                          {...register(`fund_usage_breakdown.${index}.percent` as const, { valueAsNumber: true })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white text-sm pr-6 text-right"
                          placeholder="Peratus"
                        />
                        <span className="absolute right-2 text-xs text-slate-400">%</span>
                      </div>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="p-2 rounded bg-slate-950 border border-slate-800 text-red-400 hover:text-red-300"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.fund_usage_breakdown && <p className="text-xs text-red-400">{errors.fund_usage_breakdown.message}</p>}
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-white">Mempunyai geran/pembiayaan sedia ada?</h4>
                  <p className="text-xs text-slate-400">Tandakan jika ada bantuan aktif dari TEKUN, MDEC, dll.</p>
                </div>
                <input
                  type="checkbox"
                  checked={hasExistingFinancing}
                  onChange={(e) => {
                    setValue('has_existing_financing', e.target.checked)
                    if (!e.target.checked) setValue('existing_financing_notes', '')
                  }}
                  className="w-5 h-5 rounded accent-slate-300 cursor-pointer"
                />
              </div>

              {hasExistingFinancing && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Perincian Bantuan Sedia Ada</label>
                  <textarea
                    {...register('existing_financing_notes')}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-slate-500 outline-none text-white text-sm resize-none"
                    placeholder="Nyatakan agensi pembiaya, jumlah dana, dan status semasa pembiayaan tersebut"
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Dokumen Sokongan */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">Muat Naik Dokumen Sokongan</h3>

              {/* SSM upload */}
              {ssmRegistered && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-white">Sijil Pendaftaran SSM (Wajib)</h4>
                      <p className="text-xs text-slate-400">Format PDF atau Imej (Maksimum 5MB)</p>
                    </div>
                    {uploadedDocs.some(d => d.doc_type === 'ssm_cert') ? (
                      <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Muat Naik Berjaya
                      </span>
                    ) : (
                      <label className="cursor-pointer text-xs bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5" />
                        Pilih Fail
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(e) => handleFileUpload(e, 'ssm_cert')}
                          className="hidden"
                          disabled={uploadingDoc === 'ssm_cert'}
                        />
                      </label>
                    )}
                  </div>
                  {uploadingDoc === 'ssm_cert' && <p className="text-xs text-slate-400 animate-pulse">Sedang memuat naik...</p>}
                  {uploadedDocs.filter(d => d.doc_type === 'ssm_cert').map((d, i) => (
                    <p key={i} className="text-xs text-slate-500 font-mono mt-1 break-all">{d.name}</p>
                  ))}
                </div>
              )}

              {/* Product photo upload */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-white">Foto Produk / Premis Perniagaan</h4>
                    <p className="text-xs text-slate-400">Muat naik imej berkualiti tinggi (Min 1, Maksimum 5 imej)</p>
                  </div>
                  <label className="cursor-pointer text-xs bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5" />
                    Tambah Foto
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'product_photo')}
                      className="hidden"
                      disabled={uploadingDoc === 'product_photo' || uploadedDocs.filter(d => d.doc_type === 'product_photo').length >= 5}
                    />
                  </label>
                </div>
                {uploadingDoc === 'product_photo' && <p className="text-xs text-slate-400 animate-pulse">Sedang memuat naik...</p>}
                <div className="space-y-1 mt-2">
                  {uploadedDocs.filter(d => d.doc_type === 'product_photo').map((d, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-900/60 px-3 py-1 rounded border border-slate-800/80">
                      <span className="text-xs text-slate-500 font-mono truncate max-w-xs">{d.name}</span>
                      <button
                        type="button"
                        onClick={() => setUploadedDocs(prev => prev.filter(item => item.storage_path !== d.storage_path))}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                  {uploadedDocs.filter(d => d.doc_type === 'product_photo').length === 0 && (
                    <p className="text-xs text-slate-500 italic">Tiada foto dimuat naik.</p>
                  )}
                </div>
              </div>

              {/* Business plan upload */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-white">Business Plan / Kertas Cadangan (Pilihan)</h4>
                    <p className="text-xs text-slate-400">Kertas kerja format PDF (Maksimum 10MB)</p>
                  </div>
                  {uploadedDocs.some(d => d.doc_type === 'business_plan') ? (
                    <span className="text-xs text-green-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Muat Naik Berjaya
                    </span>
                  ) : (
                    <label className="cursor-pointer text-xs bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:border-slate-500 flex items-center gap-1.5 transition">
                      <Upload className="w-3.5 h-3.5" />
                      Pilih PDF
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, 'business_plan')}
                        className="hidden"
                        disabled={uploadingDoc === 'business_plan'}
                      />
                    </label>
                  )}
                </div>
                {uploadingDoc === 'business_plan' && <p className="text-xs text-slate-400 animate-pulse">Sedang memuat naik...</p>}
                {uploadedDocs.filter(d => d.doc_type === 'business_plan').map((d, i) => (
                  <p key={i} className="text-xs text-slate-500 font-mono mt-1 break-all">{d.name}</p>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between pt-6 border-t border-slate-800 mt-8">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-sm transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 bg-slate-200 hover:bg-white text-slate-950 font-semibold rounded-xl text-sm transition flex items-center gap-2"
              >
                Seterusnya
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2"
              >
                {loading ? 'Sedang Mendaftar...' : 'Hantar & Jawab Penilaian Kendiri'}
                <Save className="w-4 h-4" />
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}
