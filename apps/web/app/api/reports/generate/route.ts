import { logger } from '@/lib/logger'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateBusinessReport } from '@/lib/gemini'
import { runGuardrail } from '@services/guardrail'
import { z } from 'zod'

const generateSchema = z.object({
  projectId: z.string().min(1),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const parsed = generateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input data.', details: parsed.error.format() }, { status: 400 })
    }

    const { projectId } = parsed.data

    // 3. Fetch project — only query columns that exist in the current schema
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, description, category, owner_user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projek tidak dijumpai.' }, { status: 404 })
    }

    // 4. Verify user owns this project or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = project.owner_user_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Akses dinafikan. Anda bukan pemilik projek ini.' }, { status: 403 })
    }

    // 5. Rate Limiting: 1 request every 5 minutes per project
    const { data: existingReport } = await supabase
      .from('ai_reports')
      .select('generated_at')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle()

    if (existingReport?.generated_at) {
      const lastGenerated = new Date(existingReport.generated_at).getTime()
      const now = Date.now()
      const diffMins = (now - lastGenerated) / 1000 / 60
      if (diffMins < 5) {
        const secondsLeft = Math.round((5 - diffMins) * 60)
        return NextResponse.json(
          {
            error: `Had kadar terlampau. Sila tunggu ${secondsLeft} saat sebelum menjana semula laporan.`,
            secondsLeft,
          },
          { status: 429 }
        )
      }
    }

    // 6. Fetch business profile and loan application for context
    //    This replaces the old broken query to non-existent `criteria` and `scores` tables.
    const { data: bizProfile } = await supabase
      .from('business_profiles')
      .select(
        'business_name, entity_type, business_stage, funding_requested_myr, ' +
        'target_market, unique_selling_point, is_bumiputera, owner_age, monthly_revenue_range'
      )
      .eq('project_id', projectId)
      .maybeSingle()

    const { data: loanApp } = await supabase
      .from('loan_applications')
      .select(
        'eligibility_status, eligibility_output, requested_amount_myr, requested_tenure_months'
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Build context for AI from real MARA loan eligibility data
    const businessContext = {
      title: project.title,
      description: project.description || '',
      category: project.category || 'Umum',
      businessName: bizProfile?.business_name || project.title,
      stage: bizProfile?.business_stage || 'operasi_baru',
      fundingRequested: bizProfile?.funding_requested_myr || loanApp?.requested_amount_myr || 0,
      targetMarket: bizProfile?.target_market || 'Pasaran tempatan',
      usp: bizProfile?.unique_selling_point || '',
      eligibilityStatus: loanApp?.eligibility_status || 'BELUM_DINILAI',
      eligibilityCriteria: (loanApp?.eligibility_output as any)?.criteria || [],
    }

    // 7. Call Gemini AI to generate the report content using MARA-relevant context
    const rawReportData = await generateBusinessReport(businessContext)

    // 8. CRITICAL: Run guardrail on generated content to ensure MARA domain-lock
    //    This strips any mention of TEKUN, MDEC, or non-MARA funders from the output.
    const guardrailResult = runGuardrail(JSON.stringify(rawReportData))

    let finalReportData = rawReportData
    let guardrailPassed = guardrailResult.passed

    if (!guardrailResult.passed) {
      logger.warn(
        `[Guardrail] AI report untuk projek ${projectId} gagal guardrail. ` +
        `Sebab: ${guardrailResult.blockedReason || 'tidak diketahui'}. ` +
        `Menggunakan output yang telah dibersihkan.`
      )
      // Attempt to re-parse the cleaned text back to structured data
      try {
        finalReportData = JSON.parse(guardrailResult.cleanText)
      } catch {
        // If re-parsing fails, use original but mark that guardrail flagged it
        logger.error('[Guardrail] Gagal parse cleaned output — guna original data tetapi tandakan.')
        guardrailPassed = false
      }
    }

    // 9. Compute a simple feasibility score from eligibility output
    const eligibilityCriteria = (loanApp?.eligibility_output as any)?.criteria || []
    const passedCount = eligibilityCriteria.filter((c: any) => c.passed).length
    const totalCount = eligibilityCriteria.length || 5
    const feasibilityScore = Math.round((passedCount / totalCount) * 100)
    const feasibilityTier =
      feasibilityScore >= 80 ? 'Sangat Berpotensi' :
      feasibilityScore >= 60 ? 'Layak Komersial' :
      feasibilityScore >= 40 ? 'Berpotensi Sederhana' :
      'Perlu Bimbingan'

    // 10. Upsert generated report using admin client (bypasses RLS for system write)
    const adminSupabase = createAdminClient()
    const { data: savedReport, error: upsertError } = await adminSupabase
      .from('ai_reports')
      .upsert(
        {
          project_id: projectId,
          feasibility_score: feasibilityScore,
          feasibility_tier: feasibilityTier,
          swot: finalReportData.swot,
          blueprint: finalReportData.blueprint,
          pitch_script: finalReportData.pitch_script,
          grant_notes: finalReportData.grant_notes,
          generated_at: new Date().toISOString(),
          model_version: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
          guardrail_passed: guardrailPassed,
        },
        {
          onConflict: 'project_id',
        }
      )
      .select()
      .single()

    if (upsertError) {
      logger.error('Upsert ai_report error:', upsertError)
      return NextResponse.json({ error: 'Gagal menyimpan laporan AI.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, report: savedReport })
  } catch (error: any) {
    logger.error('Generate Report exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa menjana laporan.' }, { status: 500 })
  }
}
