import { requireRole } from '@/lib/auth/requireRole'
import { logger } from '@/lib/logger'
import { eventSchema } from '@/lib/validations/event.schema'
import { NextResponse } from 'next/server'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['admin', 'judge', 'entrepreneur', 'mara_officer'])
    if (auth.error) return auth.error
    const { supabase } = auth

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, events })
  } catch (error: any) {
    logger.error('Events GET exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengambil event.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin'])
    if (auth.error) return auth.error
    const { user, supabase } = auth

    const body = await request.json()
    const parsed = eventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi data.', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data
    const slug = data.slug || `${slugify(data.name)}-${Math.floor(Math.random() * 1000)}`

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name: data.name,
        slug,
        description: data.description,
        venue: data.venue,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    logger.error('Events POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mencipta event.' }, { status: 500 })
  }
}
