import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
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

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('event_id', id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, projects })
  } catch (error: any) {
    logger.error('Event projects GET exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengambil projek bagi event.' }, { status: 500 })
  }
}
