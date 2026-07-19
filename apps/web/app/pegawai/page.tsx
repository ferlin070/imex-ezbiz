import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Landmark, Clock3 } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'
import ApplicationsBoard, { ApplicationRow } from '@/components/pegawai/ApplicationsBoard'

export const dynamic = 'force-dynamic'

export default async function PegawaiDashboard() {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'mara_officer' && profile.role !== 'admin')) {
    redirect('/login')
  }

  // 3. Fetch all loan applications (now including review `status`, officer notes & approved terms)
  const { data: applications } = await supabase
    .from('loan_applications')
    .select(`
      id,
      requested_amount_myr,
      requested_tenure_months,
      status,
      created_at,
      eligibility_status,
      eligibility_output,
      ai_action_plan,
      was_blocked_by_guardrail,
      officer_notes,
      approved_amount_myr,
      approved_tenure_months,
      loan_product:loan_product_id ( name ),
      project:project_id (
        id,
        title,
        owner_user_id
      )
    `)
    .order('created_at', { ascending: false })

  // 3b. Fetch owner profiles and business data separately
  const ownerIds = [...new Set((applications || []).map((a: any) => a.project?.owner_user_id).filter(Boolean))]
  const { data: ownerProfiles } = ownerIds.length > 0
    ? await supabase.from('profiles').select('id, name, email').in('id', ownerIds)
    : { data: [] }
  const ownerMap = Object.fromEntries((ownerProfiles || []).map((p: any) => [p.id, p]))

  // 3c. Fetch FULL company profiles for project owners (used for the officer's company-profile modal)
  const { data: companyProfiles } = ownerIds.length > 0
    ? await supabase.from('company_profiles').select('*').in('owner_user_id', ownerIds)
    : { data: [] }
  const companyMap = Object.fromEntries((companyProfiles || []).map((p: any) => [p.owner_user_id, p]))

  // 4. Normalize rows for the client board component
  const rows: ApplicationRow[] = (applications || []).map((app: any) => {
    const project = app.project || {}
    const company = companyMap[project.owner_user_id] || {}
    const owner = ownerMap[project.owner_user_id] || {}

    return {
      id: app.id,
      requestedAmount: Number(app.requested_amount_myr),
      requestedTenure: app.requested_tenure_months,
      status: app.status || 'submitted',
      eligibilityStatus: app.eligibility_status,
      createdAt: app.created_at,
      loanProductName: app.loan_product?.name || '-',
      businessName: company.business_name || project.title || 'Syarikat Belum Dinamakan',
      ssmNumber: company.ssm_number || '',
      ownerFullName: company.owner_full_name || owner.name || '',
      ownerEmail: owner.email || '',
      ownerId: project.owner_user_id || '',
      checks: app.eligibility_output || {},
      aiActionPlan: app.ai_action_plan,
      wasBlockedByGuardrail: !!app.was_blocked_by_guardrail,
      officerNotes: app.officer_notes,
      approvedAmount: app.approved_amount_myr,
      approvedTenure: app.approved_tenure_months,
      company,
    }
  })

  const pendingCount = rows.filter((r) => r.status === 'submitted' || r.status === 'under_review').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 relative overflow-hidden">
      {/* Glow background with corporate MARA gold */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-mara-gold/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <Landmark className="w-8 h-8 text-mara-gold" />
            <div>
              <h1 className="text-2xl font-bold text-white">Konsol Pegawai MARA</h1>
              <p className="text-xs text-slate-400">Penyemakan permohonan pembiayaan usahawan & laporan kelayakan AI</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Pegawai: {profile.name}</span>
              <span className="text-[10px] bg-mara-red/10 border border-mara-red/20 text-mara-red px-2 py-0.5 rounded font-bold uppercase tracking-wider">MARA Officer</span>
            </div>
            <LogoutButton />
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Jumlah Permohonan</span>
            <span className="text-2xl font-extrabold text-white">{rows.length}</span>
          </div>
          <div className="p-5 bg-slate-900/40 border border-sky-500/20 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-1">
              <Clock3 className="w-3 h-3" /> Menunggu Tindakan
            </span>
            <span className="text-2xl font-extrabold text-sky-400">{pendingCount}</span>
          </div>
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Status LULUS</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {rows.filter((r) => r.eligibilityStatus === 'LULUS').length}
            </span>
          </div>
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Status PERLU TINDAKAN</span>
            <span className="text-2xl font-extrabold text-amber-400">
              {rows.filter((r) => r.eligibilityStatus === 'PERLU_TINDAKAN').length}
            </span>
          </div>
          <div className="p-5 bg-slate-900/40 border border-slate-850 rounded-2xl">
            <span className="text-xs text-slate-500 font-bold uppercase block">Blocked By Guardrail</span>
            <span className="text-2xl font-extrabold text-rose-400">
              {rows.filter((r) => r.wasBlockedByGuardrail).length}
            </span>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-200">Senarai Permohonan Pembiayaan</h2>

          {rows.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950/40 border border-slate-905 text-slate-500 text-sm">
              Tiada permohonan pembiayaan usahawan dikemukakan setakat ini.
            </div>
          ) : (
            <ApplicationsBoard applications={rows} />
          )}
        </div>
      </div>
    </div>
  )
}
