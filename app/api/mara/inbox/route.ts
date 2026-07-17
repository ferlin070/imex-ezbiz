import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Verify role: admin or mara_officer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'mara_officer' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Akses dinafikan. Anda bukan pegawai MARA yang sah.' }, { status: 403 })
    }

    // 3. Fetch loan applications
    const { data: applications, error: appError } = await supabase
      .from('loan_applications')
      .select(`
        id,
        project_id,
        loan_product_id,
        requested_amount_myr,
        requested_tenure_months,
        purpose,
        status,
        officer_id,
        officer_notes,
        approved_amount_myr,
        approved_tenure_months,
        approved_rate_percent,
        reviewed_at,
        created_at
      `)
      .order('created_at', { ascending: false })

    if (appError) {
      console.error('Fetch loan applications error:', appError)
      return NextResponse.json({ error: 'Gagal menarik data permohonan pinjaman.' }, { status: 500 })
    }

    if (!applications || applications.length === 0) {
      return NextResponse.json({ success: true, applications: [] })
    }

    // 4. Enrich with project, owner, and product details
    const projectIds = applications.map((a: any) => a.project_id)
    const productIds = applications.map((a: any) => a.loan_product_id).filter(Boolean)

    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, category, owner_user_id, state, institution')
      .in('id', projectIds)

    const { data: products } = await supabase
      .from('loan_products')
      .select('id, name, profit_rate_percent')
      .in('id', productIds)

    const { data: schedules } = await supabase
      .from('loan_repayment_schedules')
      .select('loan_application_id, monthly_installment_myr, total_repayment_myr, total_profit_myr')
      .in('loan_application_id', applications.map((a: any) => a.id))

    // Fetch project owners names
    const ownerIds = (projects || []).map((p: any) => p.owner_user_id).filter(Boolean)
    const { data: owners } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', ownerIds)

    const projectsMap = new Map<string, any>((projects || []).map((p: any) => [p.id, p]))
    const productsMap = new Map<string, any>((products || []).map((p: any) => [p.id, p]))
    const schedulesMap = new Map<string, any>((schedules || []).map((s: any) => [s.loan_application_id, s]))
    const ownersMap = new Map<string, any>((owners || []).map((o: any) => [o.id, o]))

    const enriched = applications.map((app: any) => {
      const p = projectsMap.get(app.project_id)
      const prod = productsMap.get(app.loan_product_id)
      const sched = schedulesMap.get(app.id)
      const ownerProfile = p ? ownersMap.get(p.owner_user_id) : null

      return {
        ...app,
        project_title: p?.title || 'Projek Terdelete',
        project_category: p?.category || 'Umum',
        project_state: p?.state || 'Tidak Dinyatakan',
        project_institution: p?.institution || 'Tidak Dinyatakan',
        owner_name: ownerProfile?.name || 'N/A',
        owner_email: ownerProfile?.email || 'N/A',
        loan_product_name: prod?.name || 'Skim Dihapus',
        profit_rate_percent: prod?.profit_rate_percent || 0,
        monthly_installment_myr: sched?.monthly_installment_myr || 0,
        total_repayment_myr: sched?.total_repayment_myr || 0,
        total_profit_myr: sched?.total_profit_myr || 0
      }
    })

    return NextResponse.json({ success: true, applications: enriched })
  } catch (error: any) {
    console.error('Inbox GET API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat pelayan semasa menarik permohonan.' }, { status: 500 })
  }
}
