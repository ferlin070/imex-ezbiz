import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { evaluationSchema } from '@/lib/validations/score.schema'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['judge', 'admin'])
    if (auth.error) return auth.error
    const { user, supabase } = auth

    const { id: projectId } = await params
    const body = await request.json()
    const parsed = evaluationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi data.', details: parsed.error.format() }, { status: 400 })
    }

    const { score, comment } = parsed.data

    // Upsert the evaluation
    const { data: evaluation, error } = await supabase
      .from('evaluations')
      .upsert({
        project_id: projectId,
        jury_id: user.id,
        score,
        comment,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,jury_id'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, evaluation })
  } catch (error: any) {
    logger.error('Project evaluation POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa menilai projek.' }, { status: 500 })
  }
}
