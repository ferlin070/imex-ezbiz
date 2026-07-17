import { requireRole } from '@/lib/auth/requireRole'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateLoan } from '@/lib/loanCalculator'
import { z } from 'zod'

const loanApplicationSchema = z.object({
  projectId: z.string().uuid('ID projek tidak sah'),
  loanProductId: z.string().uuid('ID skim pembiayaan tidak sah'),
  requestedAmountMyr: z.number().positive('Jumlah pembiayaan mestilah positif'),
  requestedTenureMonths: z.number().int().positive('Tempoh pembiayaan mestilah positif'),
  purpose: z.string().min(5, 'Sila nyatakan tujuan pembiayaan dengan jelas (min 5 aksara)')
})

export async function POST(request: Request) {
  let createdApplicationId: string | null = null
  let supabaseClient: Awaited<ReturnType<typeof createClient>> | null = null

  try {
    const auth = await requireRole(['entrepreneur', 'admin', 'mara_officer', 'judge'])
    if (auth.error) return auth.error
    const { user, supabase } = auth
    supabaseClient = supabase

    // 2. Parse and validate payload
    const body = await request.json()
    const parsed = loanApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi input.', details: parsed.error.format() }, { status: 400 })
    }

    const { projectId, loanProductId, requestedAmountMyr, requestedTenureMonths, purpose } = parsed.data

    // 3. Verify project ownership & details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projek tidak ditemui.' }, { status: 404 })
    }

    if (project.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Akses dinafikan. Anda bukan pemilik projek ini.' }, { status: 403 })
    }

    // 4. Fetch loan product constraints
    const { data: product, error: productError } = await supabase
      .from('loan_products')
      .select('*')
      .eq('id', loanProductId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Skim pembiayaan tidak ditemui.' }, { status: 404 })
    }

    if (requestedAmountMyr < Number(product.min_amount_myr) || requestedAmountMyr > Number(product.max_amount_myr)) {
      return NextResponse.json({ error: `Had pembiayaan adalah antara RM${Number(product.min_amount_myr).toLocaleString()} dan RM${Number(product.max_amount_myr).toLocaleString()}.` }, { status: 400 })
    }

    if (requestedTenureMonths < product.min_tenure_months || requestedTenureMonths > product.max_tenure_months) {
      return NextResponse.json({ error: `Tempoh bayaran balik mestilah antara ${product.min_tenure_months} dan ${product.max_tenure_months} bulan.` }, { status: 400 })
    }

    // 5. Create loan application
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .insert({
        project_id: projectId,
        loan_product_id: loanProductId,
        requested_amount_myr: requestedAmountMyr,
        requested_tenure_months: requestedTenureMonths,
        purpose,
        status: 'submitted'
      })
      .select('id')
      .single()

    if (appError || !application) {
      console.error('Insert loan application error:', appError)
      return NextResponse.json({ error: 'Gagal membuat permohonan pembiayaan.' }, { status: 500 })
    }

    createdApplicationId = application.id

    // 6. Generate and save repayment schedule
    const calculation = calculateLoan(requestedAmountMyr, Number(product.profit_rate_percent), requestedTenureMonths)
    
    const { error: scheduleError } = await supabase
      .from('loan_repayment_schedules')
      .insert({
        loan_application_id: createdApplicationId,
        schedule: calculation.schedule,
        monthly_installment_myr: calculation.monthlyInstallment,
        total_repayment_myr: calculation.totalRepayment,
        total_profit_myr: calculation.totalProfit
      })

    if (scheduleError) {
      console.error('Insert schedule error, rolling back application:', scheduleError)
      await supabase.from('loan_applications').delete().eq('id', createdApplicationId)
      return NextResponse.json({ error: 'Gagal menjana jadual bayaran balik.' }, { status: 500 })
    }

    // 7. Update project application status to 'under_review'
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ application_status: 'under_review' })
      .eq('id', projectId)

    if (projectUpdateError) {
      console.warn('Gagal menaik taraf status projek kepada under_review:', projectUpdateError)
    }

    return NextResponse.json({ success: true, applicationId: createdApplicationId })
  } catch (error: any) {
    console.error('Loan apply API exception:', error)
    if (createdApplicationId && supabaseClient) {
      await supabaseClient.from('loan_applications').delete().eq('id', createdApplicationId)
    }
    return NextResponse.json({ error: error.message || 'Ralat server semasa menghantar permohonan.' }, { status: 500 })
  }
}
