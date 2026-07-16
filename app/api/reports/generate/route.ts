import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateFeasibility } from '@/lib/feasibility'
import { generateBusinessReport } from '@/lib/gemini'
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

    // 3. Fetch project and verify ownership (or if user is admin)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, description, category, team_members, event_id, owner_user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projek tidak dijumpai.' }, { status: 404 })
    }

    // Verify user owns this project or is admin
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

    // 4. Rate Limiting: 1 request every 5 minutes per project
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

    // 5. Fetch all criteria and scores to compute feasibility score
    const { data: criteria } = await supabase
      .from('criteria')
      .select('id, code, label, max_score, weight')
      .eq('event_id', project.event_id)

    const { data: scores } = await supabase
      .from('scores')
      .select('project_id, judge_id, criteria_id, score')
      .eq('project_id', projectId)

    // Compute feasibility result server-side
    const feasibilityResult = calculateFeasibility(scores || [], criteria || [])

    // 6. Call Gemini AI to generate the report content
    const reportData = await generateBusinessReport(
      {
        title: project.title,
        description: project.description || '',
        category: project.category || '',
        team_members: project.team_members || [],
      },
      feasibilityResult.criteriaBreakdown,
      {
        score: feasibilityResult.score,
        tier: feasibilityResult.tier,
      }
    )

    // 7. Upsert generated report (Using admin client to ensure system bypasses any restrictive RLS)
    const adminSupabase = createAdminClient()
    const { data: savedReport, error: upsertError } = await adminSupabase
      .from('ai_reports')
      .upsert(
        {
          project_id: projectId,
          feasibility_score: feasibilityResult.score,
          feasibility_tier: feasibilityResult.tier,
          swot: reportData.swot,
          blueprint: reportData.blueprint,
          pitch_script: reportData.pitch_script,
          grant_notes: reportData.grant_notes,
          generated_at: new Date().toISOString(),
          model_version: 'gemini-1.5-flash',
        },
        {
          onConflict: 'project_id',
        }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('Upsert report error:', upsertError)
      return NextResponse.json({ error: 'Gagal menyimpan laporan AI.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, report: savedReport })
  } catch (error: any) {
    console.error('Generate Report exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa menjana laporan.' }, { status: 500 })
  }
}
