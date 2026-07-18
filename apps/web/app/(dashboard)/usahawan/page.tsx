import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Plus, Landmark, AlertCircle, FileText, ArrowRight, ShieldAlert, CheckCircle, HelpCircle, Edit2, FileCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ new?: string; editProjectId?: string }>
}

export default async function UsahawanDashboard({ searchParams }: PageProps) {
  const { new: isNew, editProjectId } = await searchParams
  const supabase = await createClient()

  // 1. Resolve user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 2. Fetch all projects (Business profiles)
  const { data: projects } = await supabase
    .from('projects')
    .select('*, business_profiles(*)')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  const hasProjects = projects && projects.length > 0
  
  // Find which project to edit/show in form
  let activeProject = null
  if (editProjectId) {
    activeProject = projects?.find((p: any) => p.id === editProjectId) || null
  } else if (!hasProjects || isNew === 'true') {
    activeProject = null // showing empty form for new project
  } else {
    activeProject = projects?.[0] || null // default to first one for form values if not explicitly new/edit
  }

  // 3. Fetch loan applications for all projects owned by the user
  let applications: any[] = []
  if (hasProjects) {
    const projectIds = projects.map((p: any) => p.id)
    const { data } = await supabase
      .from('loan_applications')
      .select('*, loan_products(name, profit_rate_percent)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
    applications = data || []
  }

  // 4. Server Action for saving profile and seeding documents
  async function handleSaveProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const businessName = formData.get('businessName') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const ssmNumber = formData.get('ssmNumber') as string
    const ownerFullName = formData.get('ownerFullName') as string
    const ownerIcNumber = formData.get('ownerIcNumber') as string
    const ownerAge = parseInt(formData.get('ownerAge') as string) || 30
    const phone = formData.get('phone') as string
    const isBumiputera = formData.get('isBumiputera') === 'true'
    const operatingSince = formData.get('operatingSince') as string || '2023-01-01'
    const targetProjectId = formData.get('targetProjectId') as string

    let projectId = targetProjectId || null

    if (!projectId) {
      // Create project
      const { data: newProj, error } = await supabase
        .from('projects')
        .insert({
          title: businessName,
          description,
          category,
          owner_user_id: user.id
        })
        .select()
        .single()
      
      if (error || !newProj) return
      projectId = newProj.id
    } else {
      // Update project
      await supabase
        .from('projects')
        .update({
          title: businessName,
          description,
          category
        })
        .eq('id', projectId)
    }

    // Upsert business profile
    const { error: profileErr } = await supabase
      .from('business_profiles')
      .upsert({
        project_id: projectId,
        business_name: businessName,
        ssm_number: ssmNumber,
        ssm_registered: true,
        entity_type: 'milikan_tunggal',
        operating_since: operatingSince,
        owner_full_name: ownerFullName,
        owner_ic_number: ownerIcNumber,
        is_bumiputera: isBumiputera,
        owner_age: ownerAge,
        phone: phone,
        business_stage: 'operasi_baru',
        funding_requested_myr: 10000
      }, { onConflict: 'project_id' })

    // Automatically seed compulsory checking documents
    const { data: docs } = await supabase
      .from('business_documents')
      .select('id')
      .eq('project_id', projectId)

    if (!docs || docs.length === 0) {
      await supabase
        .from('business_documents')
        .insert([
          { project_id: projectId, doc_type: 'ssm_cert', storage_path: '/documents/ssm_cert.pdf' },
          { project_id: projectId, doc_type: 'business_plan', storage_path: '/documents/business_plan.pdf' }
        ])
    }

    revalidatePath('/usahawan')
  }

  const eligibilityStatusMap: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    LULUS: {
      label: 'LULUS KELAYAKAN ASAS',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      text: 'text-emerald-400',
      icon: CheckCircle
    },
    TIDAK_LULUS: {
      label: 'TIDAK MELEPASI SYARAT',
      bg: 'bg-rose-500/10 border-rose-500/20',
      text: 'text-rose-400',
      icon: AlertCircle
    },
    PERLU_TINDAKAN: {
      label: 'PERLU TINDAKAN',
      bg: 'bg-amber-500/10 border-amber-500/20',
      text: 'text-amber-400',
      icon: HelpCircle
    }
  }

  const officerStatusMap: Record<string, { label: string; color: string }> = {
    submitted: { label: 'Dihantar', color: 'text-slate-400' },
    under_review: { label: 'Dalam Semakan', color: 'text-blue-400' },
    approved: { label: 'Diluluskan', color: 'text-emerald-400' },
    rejected: { label: 'Ditolak', color: 'text-rose-400' }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Konsol Kelayakan Usahawan
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Daftar produk/inovasi perniagaan, semak kelayakan geran/loan MARA secara deterministik, dan peroleh nasihat AI.
          </p>
        </div>

        {hasProjects && (
          <div className="flex items-center gap-3">
            <Link
              href="/usahawan?new=true"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-xl transition active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Daftar Produk Baru
            </Link>
            <Link
              href="/loans"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition active:scale-95"
            >
              <Landmark className="h-4 w-4 text-slate-900" />
              Mohon Skim Pembiayaan
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Profile Form / Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-teal-400" />
                {activeProject ? 'Kemaskini Profil Produk' : 'Daftar Produk & Inovasi Baru'}
              </h2>
              {activeProject && (
                <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                  Sedang Diedit
                </span>
              )}
            </div>

            <form action={handleSaveProfile} className="space-y-4 text-xs">
              <input type="hidden" name="targetProjectId" value={activeProject?.id || ''} />

              <div>
                <label className="block text-slate-400 mb-1">Nama Syarikat / Perniagaan</label>
                <input
                  type="text"
                  name="businessName"
                  required
                  defaultValue={activeProject?.business_profiles?.business_name || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                  placeholder="e.g. Indah Cipta Sdn Bhd"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nombor Pendaftaran SSM</label>
                <input
                  type="text"
                  name="ssmNumber"
                  required
                  defaultValue={activeProject?.business_profiles?.ssm_number || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                  placeholder="e.g. 202601019999 (1234567-X)"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Penerangan Bisnes / Produk / Inovasi</label>
                <textarea
                  name="description"
                  defaultValue={activeProject?.description || ''}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500 resize-none"
                  placeholder="Penerangan ringkas operasi bisnes..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Kategori Sektor</label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={activeProject?.category || 'Makanan'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tarikh Daftar SSM</label>
                  <input
                    type="date"
                    name="operatingSince"
                    defaultValue={activeProject?.business_profiles?.operating_since || '2023-01-01'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-850 pt-4 space-y-4">
                <h3 className="font-bold text-slate-300">Maklumat Pemilik Asal</h3>
                <div>
                  <label className="block text-slate-400 mb-1">Nama Penuh Pemilik</label>
                  <input
                    type="text"
                    name="ownerFullName"
                    required
                    defaultValue={activeProject?.business_profiles?.owner_full_name || ''}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                    placeholder="Sama seperti dalam IC"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">No. Kad Pengenalan</label>
                    <input
                      type="text"
                      name="ownerIcNumber"
                      required
                      defaultValue={activeProject?.business_profiles?.owner_ic_number || ''}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                      placeholder="e.g. 900101115555"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Umur Pemilik</label>
                    <input
                      type="number"
                      name="ownerAge"
                      required
                      defaultValue={activeProject?.business_profiles?.owner_age || '30'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">No. Telefon Bimbit</label>
                    <input
                      type="text"
                      name="phone"
                      required
                      defaultValue={activeProject?.business_profiles?.phone || ''}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                      placeholder="e.g. 0123456789"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Status Bumiputera</label>
                    <select
                      name="isBumiputera"
                      defaultValue={activeProject?.business_profiles?.is_bumiputera?.toString() || 'true'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-teal-500"
                    >
                      <option value="true">Bumiputera</option>
                      <option value="false">Non-Bumiputera</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mock Upload Banner */}
              <div className="p-3 bg-slate-950 border border-slate-800 text-[10px] text-slate-500 rounded-xl space-y-1.5">
                <span className="font-bold text-slate-400 block">Dokumen Compulsory Disimulasikan:</span>
                <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-teal-400" /> Sijil Pendaftaran SSM (ssm_cert.pdf)</span>
                <span className="flex items-center gap-1"><FileCheck className="w-3.5 h-3.5 text-teal-400" /> Kertas Rancangan Perniagaan (business_plan.pdf)</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg transition"
              >
                {activeProject ? 'Kemaskini Produk / Inovasi' : 'Daftar Produk / Inovasi'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Projects List & Applications */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Registered Products List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-200">Produk & Inovasi Didaftarkan</h2>
            {!hasProjects ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/10 border border-slate-850 text-slate-500 text-sm">
                Tiada produk atau inovasi didaftarkan setakat ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-slate-900/20 border border-slate-850 hover:border-slate-800 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                          {p.category || 'Umum'}
                        </span>
                        <Link
                          href={`/usahawan?editProjectId=${p.id}`}
                          className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                      </div>
                      <h3 className="font-extrabold text-slate-200 text-base">{p.business_profiles?.business_name || p.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description || 'Tiada keterangan.'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center gap-3">
                      <Link
                        href={`/project/${p.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-black text-slate-100 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        Analisis SWOT &amp; Pitch
                      </Link>
                      <Link
                        href={`/loans/apply/7bc6b4b4-02ba-4da8-963d-4c748c089cb1?amount=50000&tenure=60`}
                        className="inline-flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-black text-slate-900 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 rounded-xl transition"
                      >
                        Mohon Geran
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Active Applications status */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-200">Permohonan & Kelayakan MARA</h2>

            {!hasProjects ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/10 border border-slate-850 text-slate-500 text-sm">
                Sila daftarkan produk/inovasi pertama anda terlebih dahulu.
              </div>
            ) : applications.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/10 border border-slate-850 text-slate-500 text-sm">
                Tiada permohonan pembiayaan dikesan. Klik &quot;Mohon Geran&quot; di atas kad produk untuk memulakan permohonan.
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map((app) => {
                  const eligConfig = eligibilityStatusMap[app.eligibility_status || 'TIDAK_LULUS'] || eligibilityStatusMap.TIDAK_LULUS
                  const EligIcon = eligConfig.icon
                  const officerConfig = officerStatusMap[app.status || 'submitted'] || officerStatusMap.submitted
                  
                  return (
                    <div
                      key={app.id}
                      className="p-6 rounded-2xl bg-slate-900/20 border border-slate-850 space-y-6 hover:border-slate-800 transition"
                    >
                      {/* Top Header Card */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-4">
                        <div>
                          <h3 className="font-extrabold text-base text-slate-200">{app.loan_products?.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">
                            Amaun Dimohon: <span className="font-bold text-slate-200">RM{Number(app.requested_amount_myr).toLocaleString()}</span> | 
                            Tenure: <span className="font-bold text-slate-200"> {app.requested_tenure_months} Bulan</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl border ${eligConfig.bg} ${eligConfig.text}`}>
                            <EligIcon className="h-4 w-4" />
                            {eligConfig.label}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            Status Permohonan: <span className={`font-black ${officerConfig.color}`}>{officerConfig.label}</span>
                          </span>
                        </div>
                      </div>

                      {/* Criteria details table/blocks if not LULUS */}
                      {app.eligibility_output && app.eligibility_output.criteria && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pecahan Semakan Kriteria Automatik:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                            {app.eligibility_output.criteria.map((c: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-xl border flex flex-col justify-between min-h-[80px] ${
                                  c.passed
                                    ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-300'
                                    : 'bg-rose-500/5 border-rose-500/10 text-slate-300'
                                }`}
                              >
                                <span className="font-bold text-slate-400 block truncate">{c.name}</span>
                                <div className="mt-2 flex justify-between items-center">
                                  <span className="text-[10px] text-slate-500">{c.actual}</span>
                                  <span className={`font-extrabold ${c.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {c.passed ? 'LULUS' : 'GAGAL'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Action plan section */}
                      {app.ai_action_plan && (
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4.5 w-4.5 text-teal-400" />
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Pelan Tindakan AI Penasihat (Action Plan):
                            </h4>
                          </div>
                          
                          {app.was_blocked_by_guardrail && (
                            <div className="p-3 mb-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-1.5 font-bold">
                              <ShieldAlert className="w-4 h-4" />
                              <span>Nota: Penapisan keselamatan domain (guardrails) telah memadamkan cadangan pembiayaan luaran.</span>
                            </div>
                          )}

                          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                            {app.ai_action_plan}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
