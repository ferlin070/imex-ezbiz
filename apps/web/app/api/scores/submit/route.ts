import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const submitSchema = z.object({
  projectId: z.string().min(1),
  criteriaId: z.string().min(1),
  score: z.number().nonnegative(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // Verify user is a judge for this event
    const { data: judge, error: judgeError } = await supabase
      .from('judges')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (judgeError || !judge) {
      return NextResponse.json({ error: 'Akses dinafikan. Anda bukan juri yang sah.' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const parsed = submitSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input data.', details: parsed.error.format() }, { status: 400 })
    }

    const { projectId, criteriaId, score } = parsed.data

    // Upsert score (avoiding duplicates via the unique constraint)
    const { error: upsertError } = await supabase
      .from('scores')
      .upsert({
        project_id: projectId,
        judge_id: judge.id,
        criteria_id: criteriaId,
        score: score,
        submitted_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id,judge_id,criteria_id'
      })

    if (upsertError) {
      logger.error('Upsert score error:', upsertError)
      return NextResponse.json({ error: 'Gagal menyimpan markah ke pangkalan data.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Markah berjaya dihantar!' })
  } catch (error) {
    logger.error('Submit API exception:', error)
    return NextResponse.json({ error: 'Ralat server dalaman.' }, { status: 500 })
  }
}
