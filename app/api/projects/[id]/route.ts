import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { projectSchema } from '@/lib/validations/project.schema'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin', 'judge', 'entrepreneur', 'mara_officer'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { id } = await params

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    logger.error('Project GET exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengambil maklumat projek.' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin', 'entrepreneur'])
    if (auth.error) return auth.error
    const { user, role, supabase } = auth

    const { id } = await params
    const body = await request.json()

    // Retrieve original project first to check ownership
    const { data: original, error: origError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (origError || !original) {
      return NextResponse.json({ error: 'Projek tidak ditemui.' }, { status: 404 })
    }

    // Entrepreneur security boundaries
    if (role === 'entrepreneur') {
      if (original.owner_user_id !== user.id) {
        return NextResponse.json({ error: 'Akses dinafikan. Projek ini milik usahawan lain.' }, { status: 403 })
      }
      // Entrepreneurs cannot force transition to admin-only statuses
      if (body.status && !['draft', 'submitted'].includes(body.status)) {
        return NextResponse.json({ error: 'Usahawan tidak boleh menukar status penjurian secara terus.' }, { status: 403 })
      }
    }

    const parsed = projectSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi data.', details: parsed.error.format() }, { status: 400 })
    }

    const updatePayload = {
      ...parsed.data,
      updated_at: new Date().toISOString()
    }

    const { data: project, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, project })
  } catch (error: any) {
    logger.error('Project PUT exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengemaskini projek.' }, { status: 500 })
  }
}
