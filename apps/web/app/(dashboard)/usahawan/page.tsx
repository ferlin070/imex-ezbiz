import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Plus, Landmark, AlertCircle, FileText, ArrowRight, ShieldAlert, CheckCircle, HelpCircle, Edit2, FileCheck, Building2, AlertTriangle } from 'lucide-react'
import { evaluateEligibility, type EligibilityResult } from '@services/eligibility-engine'
import { getEligibilityRules } from '@/lib/config'
import ReadinessCheckCard from '@/components/usahawan/ReadinessCheckCard'
import DocumentChecklistMini from '@/components/usahawan/DocumentChecklistMini'
import RepaymentScheduleCard from '@/components/usahawan/RepaymentScheduleCard'
import ActionItemsBanner, { type ActionItem } from '@/components/usahawan/ActionItemsBanner'

export const dynamic = 'force-dynamic'

export default async function UsahawanDashboard({
  searchParams,
}: {
  searchParams: Promise<{ editProjectId?: string; new?: string }>
}) {
  const { editProjectId } = await searchParams
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch all projects (products/innovations)
  const { data: projects } = await supabase
    .from('projects')
    .select('*, business_profiles(*)')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  // 2b. Fasa B: Check if company profile exists (1:1 per user) — fetch FULL row
  //     (needed both for the readiness self-check and existing UI).
  const { data: companyProfile } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('owner_user_id', user.id)
    .maybeSingle()

  const hasCompanyProfile = !!companyProfile
  const hasProjects = projects && projects.length > 0
  
  // Find which project to edit/show in form
  let activeProject: any = null
  if (editProjectId && projects) {
    activeProject = projects.find((p: any) => p.id === editProjectId) || null
  }
  
  // Check if we have active applications
  let applications: any[] = []
  if (hasProjects) {
    // Collect all application details across all user projects
    const projectIds = projects.map((p: any) => p.id)
    const { data } = await supabase
      .from('loan_applications')
      .select('*, loan_products(name)')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    applications = data || []
  }

  // 3b. Fetch company-level documents (used by both the readiness check
  //     and the mini document checklist widget on this dashboard).
  const { data: myDocuments } = await supabase
    .from('business_documents')
    .select('doc_type')
    .eq('owner_user_id', user.id)
  const uploadedDocTypes = (myDocuments || []).map((d: any) => d.doc_type)

  // 3c. Live self-check: run the SAME deterministic eligibility engine used
  //     by the real loan application flow, so the entrepreneur can see
  //     exactly what's missing BEFORE submitting an application (instead of
  //     only finding out afterwards).
  let readinessResult: EligibilityResult | null = null
  if (hasCompanyProfile) {
    const eligibilityRules = await getEligibilityRules()
    readinessResult = await evaluateEligibility(
      {
        ssmNumber: companyProfile.ssm_number || 'TIDAK_DIISI',
        ownerAge: companyProfile.owner_age || 30,
        isBumiputera: companyProfile.is_bumiputera ?? true,
        operatingSince: companyProfile.operating_since || null,
        documents: uploadedDocTypes.map((doc_type: string) => ({ doc_type })),
      },
      eligibilityRules
    )
  }

  // 3d. Fetch repayment schedules for any APPROVED applications so the
  //     entrepreneur can actually see the schedule that was generated for
  //     them (previously only visible internally to MARA officers).
  const approvedApplicationIds = applications.filter((a: any) => a.status === 'approved').map((a: any) => a.id)
  const { data: schedules } = approvedApplicationIds.length > 0
    ? await supabase
        .from('loan_repayment_schedules')
        .select('*')
        .in('loan_application_id', approvedApplicationIds)
    : { data: [] }
  const scheduleMap = Object.fromEntries((schedules || []).map((s: any) => [s.loan_application_id, s]))

  // 3e. Aggregate a single prioritized "what to do next" list across
  //     the readiness check + any PERLU_TINDAKAN / TIDAK_LULUS applications.
  const actionItems: ActionItem[] = []
  if (!hasCompanyProfile) {
    actionItems.push({ text: 'Lengkapkan profil syarikat anda untuk mula memohon geran MARA.', href: '/usahawan/syarikat', ctaLabel: 'Isi Profil' })
  } else if (readinessResult && !readinessResult.eligible) {
    for (const c of readinessResult.criteria.filter((c) => !c.passed)) {
      actionItems.push({
        text: `${c.name}: ${c.actual} (perlu: ${c.required})`,
        href: c.name === 'Dokumen Mandatori' ? '/usahawan/syarikat' : '/usahawan/syarikat',
        ctaLabel: 'Kemaskini',
      })
    }
  }
  for (const app of applications) {
    if (app.eligibility_status === 'PERLU_TINDAKAN' && app.ai_action_plan) {
      actionItems.push({
        text: `Permohonan "${app.loan_products?.name}" perlu tindakan susulan — semak pelan tindakan AI di bawah.`,
        href: '#permohonan',
        ctaLabel: 'Lihat Butiran',
      })
    }
  }

  // 4. Server Action: Save product/innovation (product fields only)
  //    Company fields are stored in company_profiles — NOT repeated here.
  async function handleSaveProfile(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const businessName    = formData.get('businessName') as string
    const description     = formData.get('description') as string
    const category        = formData.get('category') as string
    const fundingRequested = parseInt(formData.get('fundingRequested') as string) || 10000
    const targetMarket    = formData.get('targetMarket') as string
    const usp             = formData.get('usp') as string
    const targetProjectId = formData.get('targetProjectId') as string

    let projectId = targetProjectId || null

    if (!projectId) {
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
      await supabase
        .from('projects')
        .update({ title: businessName, description, category })
        .eq('id', projectId)
    }

    // Upsert business profile — product-specific fields only
    // Company fields (SSM, IC, phone) come from company_profiles, not repeated here
    await supabase
      .from('business_profiles')
      .upsert({
        project_id: projectId,
        business_name: businessName,
        target_market: targetMarket,
        unique_selling_point: usp,
        funding_requested_myr: fundingRequested,
        business_stage: 'operasi_baru',
      }, { onConflict: 'project_id' })

    revalidatePath('/usahawan')
  }

  // Maps status to visual classes
  const eligibilityStatusMap = {
    LULUS: { label: 'LULUS KELAYAKAN', text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle },
    TIDAK_LULUS: { label: 'TIDAK MELEPASI SYARAT', text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', icon: AlertCircle },
    PERLU_TINDAKAN: { label: 'PERLU TINDAKAN', text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertCircle }
  }

  const officerStatusMap = {
    submitted: { label: 'Dalam Semakan', color: 'text-slate-300' },
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
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-black text-white bg-mara-red hover:bg-mara-red/80 rounded-xl transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Daftar Produk Baru
            </Link>
            <Link
              href="/loans"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black text-white bg-gradient-to-r from-mara-red to-mara-gold hover:from-mara-red/80 hover:to-mara-gold/80 rounded-xl transition active:scale-95 cursor-pointer"
            >
              <Landmark className="h-4 w-4 text-white" />
              Mohon Skim Pembiayaan
            </Link>
          </div>
        )}
      </div>

      <ActionItemsBanner items={actionItems} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Column: Company Link + Product Form */}
        <div className="lg:col-span-1 space-y-4">

          {/* Readiness self-check + document checklist */}
          <ReadinessCheckCard result={readinessResult} hasCompanyProfile={hasCompanyProfile} />
          {hasCompanyProfile && <DocumentChecklistMini uploadedDocTypes={uploadedDocTypes} />}

          {/* Company Profile check banner / link */}
          {!hasCompanyProfile ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-300">Profil Syarikat Belum Diisi</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Lengkapkan maklumat syarikat dahulu sebelum mendaftar produk baru.</p>
              </div>
              <Link
                href="/usahawan/syarikat"
                className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black rounded-lg text-[11px] transition"
              >
                Isi Sekarang
              </Link>
            </div>
          ) : (
            <Link
              href="/usahawan/syarikat"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-emerald-300">Profil Syarikat</p>
                <p className="text-[10px] text-slate-500 truncate">{companyProfile?.business_name}</p>
              </div>
              <Edit2 className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition" />
            </Link>
          )}

          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-mara-red" />
                {activeProject ? 'Kemaskini Produk' : 'Daftar Produk / Inovasi Baru'}
              </h2>
              {activeProject && (
                <span className="text-[10px] font-bold text-mara-red bg-mara-red/10 border border-mara-red/20 px-2 py-0.5 rounded uppercase">
                  Sedang Diedit
                </span>
              )}
            </div>

            <form action={handleSaveProfile} className="space-y-4 text-xs">
              <input type="hidden" name="targetProjectId" value={activeProject?.id || ''} />

              <div>
                <label className="block text-slate-400 mb-1">Nama Produk / Inovasi <span className="text-rose-400">*</span></label>
                <input
                  type="text" name="businessName" required
                  defaultValue={activeProject?.business_profiles?.business_name || activeProject?.title || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-mara-red"
                  placeholder="e.g. Sos Cili Premium Organik"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Penerangan Produk / Inovasi</label>
                <textarea
                  name="description"
                  defaultValue={activeProject?.description || ''}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-mara-red resize-none"
                  placeholder="Penerangan ringkas produk/inovasi anda..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Kategori Sektor</label>
                  <select
                    name="category"
                    defaultValue={activeProject?.category || 'Makanan & Minuman'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-mara-red"
                  >
                    {['Makanan & Minuman','Pertanian','Kraftangan','Fesyen & Tekstil',
                      'Teknologi','Perkhidmatan','Pelancongan','Pendidikan','Kesihatan','Lain-lain'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Pembiayaan Dipohon (RM)</label>
                  <input
                    type="number" name="fundingRequested" min={1000} max={500000}
                    defaultValue={activeProject?.business_profiles?.funding_requested_myr || 10000}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-mara-red"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Sasaran Pasaran</label>
                <input
                  type="text" name="targetMarket"
                  defaultValue={activeProject?.business_profiles?.target_market || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-mara-red"
                  placeholder="e.g. Ibu bapa urban usia 25-45 tahun"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Kelebihan Unik (USP)</label>
                <input
                  type="text" name="usp"
                  defaultValue={activeProject?.business_profiles?.unique_selling_point || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 outline-none focus:border-mara-red"
                  placeholder="e.g. Bahan organik tempatan bersijil Halal"
                />
              </div>

              <button
                type="submit"
                disabled={!hasCompanyProfile}
                className="w-full py-2.5 bg-mara-red hover:bg-mara-red/80 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-xs cursor-pointer"
              >
                {activeProject ? 'Kemaskini Produk' : 'Daftar Produk / Inovasi'}
              </button>

              {!hasCompanyProfile && (
                <p className="text-[10px] text-amber-400 text-center">
                  ⚠️ Sila isi <Link href="/usahawan/syarikat" className="underline">Profil Syarikat</Link> dahulu
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Projects List & Applications */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Registered Products List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-200">Produk & Inovasi Didaftarkan</h2>
            {!hasProjects ? (
              <div className="py-16 text-center rounded-2xl bg-slate-900/10 border border-dashed border-slate-800 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <p className="text-slate-300 font-bold text-sm">Tiada produk atau inovasi didaftarkan</p>
                  <p className="text-slate-500 text-xs mt-1">Mulakan perjalanan kelayakan MARA anda dengan mendaftarkan produk atau inovasi pertama.</p>
                </div>
                <Link
                  href="/usahawan?new=true"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-mara-red hover:bg-mara-red/80 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Daftar Produk Pertama Saya
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((p: any) => (
                  <div
                    key={p.id}
                    className="group p-5 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-mara-red/30 hover:bg-slate-900/60 transition-all duration-200 flex flex-col justify-between animate-scale-in"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-bold text-mara-red bg-mara-red/10 border border-mara-red/20 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                          {p.category || 'Umum'}
                        </span>
                        <Link
                          href={`/usahawan?editProjectId=${p.id}`}
                          className="text-slate-500 hover:text-mara-red text-xs font-bold flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                      </div>
                      <h3 className="font-extrabold text-slate-100 text-base leading-tight">{p.business_profiles?.business_name || p.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description || 'Tiada keterangan.'}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center gap-3">
                      <Link
                        href={`/project/${p.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-300 bg-slate-800/80 border border-slate-700 hover:bg-slate-700 hover:text-white rounded-xl transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-mara-red" />
                        Analisis SWOT
                      </Link>
                      <Link
                        href={`/loans?projectId=${p.id}`}
                        className="inline-flex items-center justify-center gap-1 px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-mara-red to-mara-gold hover:from-mara-red/80 hover:to-mara-gold/80 rounded-xl transition shadow-sm shadow-mara-red/20 cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                        Mohon Geran
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Active Applications status */}
          <div id="permohonan" className="space-y-4 scroll-mt-6">
            <h2 className="text-xl font-bold text-slate-200">Permohonan & Kelayakan MARA</h2>

            {!hasProjects ? (
              <div className="py-12 text-center rounded-2xl bg-slate-900/10 border border-dashed border-slate-800 flex flex-col items-center gap-3">
                <Landmark className="w-10 h-10 text-slate-700" />
                <div>
                  <p className="text-slate-400 font-bold text-sm">Belum ada permohonan dibuat</p>
                  <p className="text-slate-600 text-xs mt-1">Daftarkan produk terlebih dahulu, kemudian mohon skim pembiayaan MARA.</p>
                </div>
              </div>
            ) : applications.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-slate-900/10 border border-dashed border-slate-800 flex flex-col items-center gap-3">
                <FileText className="w-10 h-10 text-slate-700" />
                <div>
                  <p className="text-slate-400 font-bold text-sm">Tiada permohonan pembiayaan dikesan</p>
                  <p className="text-slate-600 text-xs mt-1">Klik &ldquo;Mohon Geran&rdquo; pada kad produk anda untuk memulakan permohonan.</p>
                </div>
                <Link
                  href="/loans"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-mara-red hover:bg-mara-red/80 rounded-xl transition active:scale-95 cursor-pointer"
                >
                  <Landmark className="w-3.5 h-3.5" />
                  Lihat Skim Pembiayaan
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {applications.map((app) => {
                  const statusKey = (app.eligibility_status || 'TIDAK_LULUS') as keyof typeof eligibilityStatusMap
                  const eligConfig = eligibilityStatusMap[statusKey] || eligibilityStatusMap.TIDAK_LULUS
                  const EligIcon = eligConfig.icon
                  const officerKey = (app.status || 'submitted') as keyof typeof officerStatusMap
                  const officerConfig = officerStatusMap[officerKey] || officerStatusMap.submitted
                  
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
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                            {app.eligibility_output.criteria.map((c: any, index: number) => (
                              <div
                                key={index}
                                className={`p-3 rounded-xl border flex flex-col justify-between min-h-[90px] ${
                                  c.passed
                                    ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-300'
                                    : 'bg-rose-500/5 border-rose-500/10 text-slate-300'
                                }`}
                              >
                                <span className="font-bold text-slate-300 text-[11px] block leading-snug">{c.name}</span>
                                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                                  <span className="text-[10px] text-slate-400 font-medium truncate" title={c.actual}>{c.actual || 'N/A'}</span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                                    c.passed 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}>
                                    {c.passed ? 'LULUS' : 'GAGAL'}
                                  </span>
                                </div>
                                {!c.passed && c.monthsRemaining != null && c.eligibleFromDate && (
                                  <div className="mt-2 text-[10px] text-amber-400 font-bold leading-tight">
                                    ✓ Layak:{' '}
                                    {new Date(c.eligibleFromDate).toLocaleDateString('ms-MY', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}{' '}
                                    ({c.monthsRemaining} bulan lagi)
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Action plan section */}
                      {app.ai_action_plan && (
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-900 space-y-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4.5 w-4.5 text-mara-red" />
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

                      {/* Repayment schedule — only visible once an officer has approved the application */}
                      {app.status === 'approved' && scheduleMap[app.id] && (
                        <RepaymentScheduleCard
                          applicationId={app.id}
                          monthlyInstallment={Number(scheduleMap[app.id].monthly_installment_myr)}
                          totalRepayment={Number(scheduleMap[app.id].total_repayment_myr)}
                          totalProfit={Number(scheduleMap[app.id].total_profit_myr)}
                          schedule={scheduleMap[app.id].schedule || []}
                        />
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
