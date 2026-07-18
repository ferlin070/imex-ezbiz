import { logger } from '@/lib/logger'
import { requireRole } from '@/lib/auth/requireRole'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateActionPlan } from '@services/ai-advisor'
import { runGuardrail } from '@services/guardrail'

interface RouteContext {
  params: Promise<{ applicationId: string }>
}

// POST /api/loans/ai-plan/[applicationId]
// A4 OPSYEN B: Generates AI action plan for a submitted loan application ASYNCHRONOUSLY.
// This is called AFTER /api/loans/apply returns — the client polls this endpoint
// (or listens via Supabase Realtime on loan_applications.ai_action_plan) to get the plan.
// Separating this prevents Vercel Hobby 10s timeout for the main apply flow.
export async function POST(request: Request, context: RouteContext) {
  try {
    const { applicationId } = await context.params

    // 1. Auth check
    const auth = await requireRole(['entrepreneur', 'admin', 'mara_officer'])
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 2. Fetch the loan application
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .select('id, project_id, eligibility_status, eligibility_output, ai_action_plan')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Permohonan tidak dijumpai.' }, { status: 404 })
    }

    // 3. Verify ownership (via project)
    const { data: project } = await supabase
      .from('projects')
      .select('owner_user_id')
      .eq('id', application.project_id)
      .single()

    if (!project || project.owner_user_id !== user.id) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const isStaff = profile?.role === 'admin' || profile?.role === 'mara_officer'
      if (!isStaff) {
        return NextResponse.json({ error: 'Akses dinafikan.' }, { status: 403 })
      }
    }

    // 4. If AI plan already exists, return it immediately (idempotent)
    if (application.ai_action_plan) {
      return NextResponse.json({
        success: true,
        aiPlanStatus: 'ready',
        actionPlan: application.ai_action_plan,
      })
    }

    // 5. Fetch business profile for AI context
    const { data: bizProfile } = await supabase
      .from('business_profiles')
      .select('business_name, owner_age, is_bumiputera, ssm_number, business_stage, funding_requested_myr')
      .eq('project_id', application.project_id)
      .maybeSingle()

    const eligibility = application.eligibility_output as any

    // 6. Generate AI action plan (this is the slow Gemini call)
    const rawActionPlan = await generateActionPlan(eligibility, {
      ssmNumber: bizProfile?.ssm_number || 'SSM-NOT-FOUND',
      businessName: bizProfile?.business_name,
      ownerAge: bizProfile?.owner_age || 30,
      isBumiputera: bizProfile?.is_bumiputera ?? true,
    })

    // 7. Run guardrail on the action plan text
    const guardrailResult = await runGuardrail(rawActionPlan)

    const finalPlan = guardrailResult.passed ? rawActionPlan : guardrailResult.cleanText

    if (!guardrailResult.passed) {
      logger.warn(
        `[Guardrail] AI action plan untuk permohonan ${applicationId} gagal guardrail. ` +
        `Sebab: ${guardrailResult.blockedReason || 'tidak diketahui'}.`
      )
    }

    // 8. Update the loan application with the AI plan using admin client
    //    (admin client bypasses RLS for system-level update)
    const adminSupabase = createAdminClient()
    const { error: updateError } = await adminSupabase
      .from('loan_applications')
      .update({
        ai_action_plan: finalPlan,
        was_blocked_by_guardrail: !guardrailResult.passed,
      })
      .eq('id', applicationId)

    if (updateError) {
      logger.error('[AIPlan] Gagal kemaskini ai_action_plan:', updateError)
      return NextResponse.json({ error: 'Gagal menyimpan pelan tindakan AI.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      aiPlanStatus: 'ready',
      actionPlan: finalPlan,
    })
  } catch (error: any) {
    logger.error('[AIPlan] Exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa menjana pelan AI.' }, { status: 500 })
  }
}

// GET /api/loans/ai-plan/[applicationId]
// Poll endpoint: returns current status of AI plan generation.
// Frontend polls this every 3 seconds until aiPlanStatus === 'ready'.
export async function GET(request: Request, context: RouteContext) {
  try {
    const { applicationId } = await context.params

    const auth = await requireRole(['entrepreneur', 'admin', 'mara_officer'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { data: application, error } = await supabase
      .from('loan_applications')
      .select('id, ai_action_plan, eligibility_status')
      .eq('id', applicationId)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: 'Permohonan tidak dijumpai.' }, { status: 404 })
    }

    return NextResponse.json({
      aiPlanStatus: application.ai_action_plan ? 'ready' : 'pending',
      actionPlan: application.ai_action_plan ?? null,
      eligibilityStatus: application.eligibility_status,
    })
  } catch (error: any) {
    logger.error('[AIPlan GET] Exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server.' }, { status: 500 })
  }
}
