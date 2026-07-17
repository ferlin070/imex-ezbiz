import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const entrepreneurSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  projectId: z.string().nullable(),
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
      return NextResponse.json({ error: 'Akses dinafikan. Hanya admin boleh mendaftar usahawan.' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = entrepreneurSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak sah.', details: parsed.error.format() }, { status: 400 })
    }

    const { name, email, projectId } = parsed.data

    // Insert entrepreneur profile record
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        name,
        email,
        role: 'entrepreneur',
        project_id: projectId
      })

    if (insertError) {
      console.error('Create entrepreneur profile error:', insertError)
      return NextResponse.json({ error: 'Gagal mendaftar usahawan.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: newProfile })
  } catch (err: any) {
    console.error('Create entrepreneur exception:', err)
    return NextResponse.json({ error: 'Ralat pelayan dalaman.' }, { status: 500 })
  }
}
