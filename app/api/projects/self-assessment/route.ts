import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateSelfAssessment } from '@/lib/selfAssessment'
import { z } from 'zod'

const selfAssessmentSchema = z.object({
  projectId: z.string().uuid('ID projek tidak sah'),
  responses: z.object({
    k1_idea: z.enum(['A', 'B', 'C', 'D']),
    k2_innovation: z.enum(['A', 'B', 'C', 'D']),
    k3_impact: z.enum(['A', 'B', 'C', 'D']),
    k4_presentation: z.enum(['A', 'B', 'C', 'D']),
    k5_marketability: z.enum(['A', 'B', 'C', 'D']),
  })
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Parse and validate payload
    const body = await request.json()
    const parsed = selfAssessmentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi jawapan.', details: parsed.error.format() }, { status: 400 })
    }

    const { projectId, responses } = parsed.data

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

    // 4. Compute score
    const result = calculateSelfAssessment(responses)

    // 5. Save to self_assessments table
    const { error: saveError } = await supabase
      .from('self_assessments')
      .upsert({
        project_id: projectId,
        responses,
        computed_score: result.score,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'project_id'
      })

    if (saveError) {
      logger.error('Save self-assessment error:', saveError)
      return NextResponse.json({ error: 'Gagal menyimpan rekod penilaian kendiri.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, score: result.score, tier: result.tier })
  } catch (error: any) {
    logger.error('Self Assessment API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memproses penilaian.' }, { status: 500 })
  }
}
