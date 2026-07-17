import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { eventSchema } from '@/lib/validations/event.schema'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { id } = await params
    const body = await request.json()
    const parsed = eventSchema.partial().safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi data.', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data

    const { data: event, error } = await supabase
      .from('events')
      .update({
        ...data,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    logger.error('Event PUT exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengemaskini event.' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { id } = await params

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Event DELETE exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memadam event.' }, { status: 500 })
  }
}
