import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const judgeSchema = z.object({
  name: z.string().min(1),
  panelLabel: z.string().min(1),
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Auth verification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // Role verification
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Akses dinafikan. Hanya admin boleh mendaftar juri.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = judgeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak sah.', details: parsed.error.format() }, { status: 400 })
    }

    const { name, panelLabel, email } = parsed.data

    // Insert judge record
    const { data: newJudge, error: insertError } = await supabase
      .from('judges')
      .insert({
        name,
        panel_label: panelLabel,
        email
      })

    if (insertError) {
      console.error('Create judge error:', insertError)
      return NextResponse.json({ error: 'Gagal mendaftar juri.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, judge: newJudge })
  } catch (err: any) {
    console.error('Create judge exception:', err)
    return NextResponse.json({ error: 'Ralat pelayan dalaman.' }, { status: 500 })
  }
}
