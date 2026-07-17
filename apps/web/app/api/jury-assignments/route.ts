import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const body = await request.json()
    const { event_id, user_id, role = 'member' } = body

    if (!event_id || !user_id) {
      return NextResponse.json({ error: 'event_id dan user_id diperlukan.' }, { status: 400 })
    }

    // Check if assignment exists
    const { data: existing } = await supabase
      .from('jury_assignments')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Juri telah dilantik untuk event ini.' }, { status: 400 })
    }

    const { data: assignment, error } = await supabase
      .from('jury_assignments')
      .insert({
        event_id,
        user_id,
        role
      })
      .select()
      .single()

    if (error) throw error

    // Backwards compatibility: add to judges table
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user_id)
        .single()
      
      await supabase.from('judges').insert({
        event_id,
        user_id,
        name: userProfile?.name || 'Assigned Jury',
        panel_label: role === 'chair' ? 'Ketua Juri' : 'Panel Juri'
      })
    } catch (err) {
      logger.warn('Failed to insert into backward-compat judges table:', err)
    }

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    logger.error('Jury assignment POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa melantik juri.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { searchParams } = new URL(request.url)
    const event_id = searchParams.get('event_id')
    const user_id = searchParams.get('user_id')

    if (!event_id || !user_id) {
      return NextResponse.json({ error: 'event_id dan user_id diperlukan.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('jury_assignments')
      .delete()
      .eq('event_id', event_id)
      .eq('user_id', user_id)

    if (error) throw error

    // Backwards compatibility: delete from judges table too
    try {
      await supabase
        .from('judges')
        .delete()
        .eq('event_id', event_id)
        .eq('user_id', user_id)
    } catch (err) {
      logger.warn('Failed to delete from backward-compat judges table:', err)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Jury assignment DELETE exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengeluarkan juri.' }, { status: 500 })
  }
}
