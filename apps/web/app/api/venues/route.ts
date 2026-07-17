import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['admin', 'judge', 'entrepreneur', 'mara_officer'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { data: venues, error } = await supabase
      .from('venues')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, venues })
  } catch (error: any) {
    logger.error('Venues GET exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengambil senarai tempat.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const body = await request.json()
    const { name, description = '' } = body

    if (!name || name.trim().length < 3) {
      return NextResponse.json({ error: 'Nama tempat sekurang-kurangnya 3 aksara.' }, { status: 400 })
    }

    const { data: venue, error } = await supabase
      .from('venues')
      .insert({
        name: name.trim(),
        description: description.trim(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, venue })
  } catch (error: any) {
    logger.error('Venues POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mendaftar tempat.' }, { status: 500 })
  }
}
