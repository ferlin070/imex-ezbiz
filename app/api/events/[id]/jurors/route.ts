import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin', 'judge', 'mara_officer'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { id } = await params

    // Fetch assigned jurors
    const { data: assignments, error: assignError } = await supabase
      .from('jury_assignments')
      .select('*, profiles:user_id(id, name, email)')
      .eq('event_id', id)

    if (assignError) throw assignError

    // Fetch all judge profiles for allocation
    const { data: allJudges, error: judgeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'judge')

    if (judgeError) throw judgeError

    return NextResponse.json({
      success: true,
      assigned: (assignments || []).map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        role: a.role,
        assigned_at: a.assigned_at,
        name: a.profiles?.name || 'Juri Tanpa Nama',
        email: a.profiles?.email || '',
      })),
      allJudges
    })
  } catch (error: any) {
    logger.error('Event jurors GET exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengambil juri.' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { id: eventId } = await params
    const body = await request.json()
    const { userId, role = 'member' } = body

    if (!userId) {
      return NextResponse.json({ error: 'ID Pengguna (Juri) diperlukan' }, { status: 400 })
    }

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('jury_assignments')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Juri telah dilantik untuk event ini.' }, { status: 400 })
    }

    // Insert assignment
    const { data: assignment, error } = await supabase
      .from('jury_assignments')
      .insert({
        event_id: eventId,
        user_id: userId,
        role
      })
      .select()
      .single()

    if (error) throw error

    // Backwards compatibility: add to 'judges' table too if it matches structure
    try {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single()
      
      await supabase.from('judges').insert({
        event_id: eventId,
        user_id: userId,
        name: userProfile?.name || 'Assigned Jury',
        panel_label: role === 'chair' ? 'Ketua Juri' : 'Panel Juri'
      })
    } catch (err) {
      logger.warn('Failed to insert into backward-compat judges table:', err)
    }

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    logger.error('Event jurors POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa melantik juri.' }, { status: 500 })
  }
}
