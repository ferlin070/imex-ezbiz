import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { projectSchema } from '@/lib/validations/project.schema'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['entrepreneur', 'admin'])
    if (auth.error) return auth.error
    const { user, supabase } = auth

    const body = await request.json()
    const parsed = projectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi data.', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        team_members: data.team_members,
        event_id: data.event_id,
        owner_user_id: user.id,
        status: data.status || 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    logger.error('Projects POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mendaftar projek.' }, { status: 500 })
  }
}
