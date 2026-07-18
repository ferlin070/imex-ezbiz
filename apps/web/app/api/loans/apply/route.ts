import { logger } from '@/lib/logger'
import { requireRole } from '@/lib/auth/requireRole'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateLoan } from '@/lib/loanCalculator'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import { evaluateEligibility } from '@services/eligibility-engine'
import { generateActionPlan } from '@services/ai-advisor'
import { runGuardrail } from '@services/guardrail'

const loanApplicationSchema = z.object({
  projectId: z.string().uuid('ID projek tidak sah'),
  loanProductId: z.string().uuid('ID skim pembiayaan tidak sah'),
  requestedAmountMyr: z.number().positive('Jumlah pembiayaan mestilah positif'),
  requestedTenureMonths: z.number().int().positive('Tempoh pembiayaan mestilah positif'),
  purpose: z.string().min(5, 'Sila nyatakan tujuan pembiayaan dengan jelas (min 5 aksara)')
})

function writeDecisionLog(userId: string, data: any) {
  try {
    const logDir = path.join(process.cwd(), 'audit/decision-logs')
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    const filepath = path.join(logDir, `log-${Date.now()}-${userId}.json`)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    logger.warn('Gagal menulis audit log keputusan:', err)
  }
}

export async function POST(request: Request) {
  let createdApplicationId: string | null = null
  let supabaseClient: Awaited<ReturnType<typeof createClient>> | null = null

  try {
    const auth = await requireRole(['entrepreneur', 'admin', 'mara_officer'])
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

    // 4. Fetch business profile & uploaded documents
    const { data: bizProfile } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('project_id', projectId)
      .single()

    const { data: documents } = await supabase
      .from('business_documents')
      .select('doc_type')
      .eq('project_id', projectId)

    // 5. Run deterministic rules engine check
    const ownerAge = bizProfile?.owner_age || 30
    const isBumiputera = bizProfile?.is_bumiputera ?? true
    const ssmNumber = bizProfile?.ssm_number || 'SSM-NOT-FOUND'

    const eligibility = await evaluateEligibility({
      ssmNumber,
      ownerAge,
      isBumiputera,
      documents: documents || []
    })

    // 6. Generate action plan & filter through guardrails
    const rawActionPlan = await generateActionPlan(eligibility, {
      ssmNumber,
      businessName: bizProfile?.business_name,
      ownerAge,
      isBumiputera
    })

    const guardrailResult = runGuardrail(rawActionPlan)

    // Log the entire evaluation sequence for auditing
    writeDecisionLog(user.id, {
      userId: user.id,
      projectId,
      loanProductId,
      ssmNumber,
      bizProfile,
      eligibility,
      rawActionPlan,
      guardrailPassed: guardrailResult.passed,
      finalActionPlan: guardrailResult.cleanText,
      timestamp: new Date().toISOString()
    })

    // 7. Fetch loan product constraints
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

    // 8. Create loan application with eligibility data
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .insert({
        project_id: projectId,
        loan_product_id: loanProductId,
        requested_amount_myr: requestedAmountMyr,
        requested_tenure_months: requestedTenureMonths,
        purpose,
        status: 'submitted',
        eligibility_status: eligibility.status,
        eligibility_output: eligibility,
        ai_action_plan: guardrailResult.cleanText,
        was_blocked_by_guardrail: !guardrailResult.passed
      })
      .select('id')
      .single()

    if (appError || !application) {
      logger.error('Insert loan application error:', appError)
      return NextResponse.json({ error: 'Gagal membuat permohonan pembiayaan.' }, { status: 500 })
    }

    createdApplicationId = application.id

    // 9. Generate and save repayment schedule
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
      logger.error('Insert schedule error, rolling back application:', scheduleError)
      await supabase.from('loan_applications').delete().eq('id', createdApplicationId)
      return NextResponse.json({ error: 'Gagal menjana jadual bayaran balik.' }, { status: 500 })
    }

    // 10. Update project application status to 'under_review'
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ application_status: 'under_review' })
      .eq('id', projectId)

    if (projectUpdateError) {
      logger.warn('Gagal menaik taraf status projek kepada under_review:', projectUpdateError)
    }

    return NextResponse.json({
      success: true,
      applicationId: createdApplicationId,
      eligibilityStatus: eligibility.status,
      actionPlan: guardrailResult.cleanText
    })
  } catch (error: any) {
    logger.error('Loan apply API exception:', error)
    if (createdApplicationId && supabaseClient) {
      await supabaseClient.from('loan_applications').delete().eq('id', createdApplicationId)
    }
    return NextResponse.json({ error: error.message || 'Ralat server semasa menghantar permohonan.' }, { status: 500 })
  }
}
