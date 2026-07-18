import { logger } from '@/lib/logger'
import { requireRole } from '@/lib/auth/requireRole'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateLoan } from '@/lib/loanCalculator'
import { z } from 'zod'
import { evaluateEligibility, type EligibilityRules } from '@services/eligibility-engine'
import { getEligibilityRules } from '@/lib/config'
import { runGuardrail } from '@services/guardrail'

// A1 FIX: Replaced fs.writeFileSync (fails silently on Vercel serverless —
// read-only filesystem) with Supabase insert using admin client.
// Failure to log NEVER blocks the user's loan application.
async function writeDecisionLog(userId: string, data: Record<string, unknown>) {
  try {
    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
      .from('decision_logs')
      .insert({
        user_id: userId,
        project_id: data.projectId as string ?? null,
        loan_product_id: data.loanProductId as string ?? null,
        payload: data,
      })
    if (error) {
      // Use logger.error (not warn) so failures are clearly visible in Vercel logs
      logger.error('[AuditLog] Gagal insert decision_logs ke Supabase:', error)
    }
  } catch (err) {
    logger.error('[AuditLog] Exception semasa menulis audit log keputusan:', err)
  }
}

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
  let adminSupabaseClient: ReturnType<typeof createAdminClient> | null = null

  try {
    // 1. Auth check
    const auth = await requireRole(['entrepreneur', 'admin', 'mara_officer'])
    if (auth.error) return auth.error
    const { user, supabase } = auth
    supabaseClient = supabase
    adminSupabaseClient = createAdminClient()

    // 2. Parse and validate payload
    const body = await request.json()
    const parsed = loanApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi input.', details: parsed.error.format() }, { status: 400 })
    }

    const { projectId, loanProductId, requestedAmountMyr, requestedTenureMonths, purpose } = parsed.data

    // 3. Verify project ownership
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

    // 4. A5 FIX: Fetch business profile & uploaded documents IN PARALLEL
    //    (saves ~50-150ms per request vs sequential await)
    const [{ data: bizProfile }, { data: documents }] = await Promise.all([
      supabase
        .from('business_profiles')
        .select('*')
        .eq('project_id', projectId)
        .single(),
      supabase
        .from('business_documents')
        .select('doc_type')
        .or(`project_id.eq.${projectId},owner_user_id.eq.${user.id}`),
    ])

    // 5. Run deterministic rules engine (synchronous — fast)
    const ownerAge = bizProfile?.owner_age || 30
    const isBumiputera = bizProfile?.is_bumiputera ?? true
    const ssmNumber = bizProfile?.ssm_number || 'SSM-NOT-FOUND'

    const eligibilityRules = await getEligibilityRules()
    const eligibility = await evaluateEligibility({
      ssmNumber,
      ownerAge,
      isBumiputera,
      documents: documents || []
    }, eligibilityRules)

    // 6. A4 OPSYEN B: Guardrail check on plain text eligibility summary only (fast)
    //    Full AI report is generated ASYNC in a separate background route.
    //    This prevents Vercel Hobby 10s timeout and gives users immediate feedback.
    const guardrailResult = await runGuardrail(
      `Kelayakan: ${eligibility.status}. SSM: ${ssmNumber}. Bumiputera: ${isBumiputera}.`
    )

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

    // 8. Create loan application — eligibility saved immediately (synchronous)
    //    ai_action_plan is NULL initially; filled asynchronously by /api/loans/ai-plan/[id]
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
        ai_action_plan: null,        // Will be filled async by /api/loans/ai-plan/[id]
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

    const { error: scheduleError } = await adminSupabaseClient
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
      await adminSupabaseClient.from('loan_applications').delete().eq('id', createdApplicationId)
      return NextResponse.json({ error: 'Gagal menjana jadual bayaran balik.' }, { status: 500 })
    }

    // 10. Update project status
    const { error: projectUpdateError } = await supabase
      .from('projects')
      .update({ application_status: 'under_review' })
      .eq('id', projectId)

    if (projectUpdateError) {
      logger.warn('Gagal menaik taraf status projek kepada under_review:', projectUpdateError)
    }

    // 11. A1 FIX: Write audit log to Supabase (non-blocking, fire & forget)
    //     Failure here NEVER fails the request — logged to Vercel logs only.
    writeDecisionLog(user.id, {
      userId: user.id,
      projectId,
      loanProductId,
      ssmNumber,
      eligibilityStatus: eligibility.status,
      guardrailPassed: guardrailResult.passed,
      requestedAmountMyr,
      requestedTenureMonths,
      timestamp: new Date().toISOString(),
    }).catch(err => logger.error('[AuditLog] Fire-and-forget gagal:', err))

    return NextResponse.json({
      success: true,
      applicationId: createdApplicationId,
      eligibilityStatus: eligibility.status,
      // A4 Opsyen B: AI plan not ready yet — client should poll /api/loans/ai-plan/[id]
      aiPlanStatus: 'pending',
      message: 'Permohonan berjaya dihantar. Pelan tindakan AI sedang dijana secara latar belakang.'
    })
  } catch (error: any) {
    logger.error('Loan apply API exception:', error)
    if (createdApplicationId && adminSupabaseClient) {
      await adminSupabaseClient.from('loan_applications').delete().eq('id', createdApplicationId)
    }
    return NextResponse.json({ error: error.message || 'Ralat server semasa menghantar permohonan.' }, { status: 500 })
  }
}
