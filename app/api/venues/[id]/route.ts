import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
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
    const { name, description } = body

    if (name && name.trim().length < 3) {
      return NextResponse.json({ error: 'Nama tempat sekurang-kurangnya 3 aksara.' }, { status: 400 })
    }

    const { data: venue, error } = await supabase
      .from('venues')
      .update({
        name: name?.trim(),
        description: description?.trim(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, venue })
  } catch (error: any) {
    logger.error('Venue PUT exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengemaskini tempat.' }, { status: 500 })
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
      .from('venues')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Venue DELETE exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memadam tempat.' }, { status: 500 })
  }
}
