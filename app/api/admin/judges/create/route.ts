import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const judgeSchema = z.object({
  name: z.string().min(1),
  panelLabel: z.string().min(1),
  email: z.string().email(),
  eventId: z.string().min(1),
})

function generateRandomPassword(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin'], 'Akses dinafikan. Hanya admin boleh mendaftar juri.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    const body = await request.json()
    const parsed = judgeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Input tidak sah.', details: parsed.error.format() }, { status: 400 })
    }

    const { name, panelLabel, email, eventId } = parsed.data

    const supabaseAdmin = createAdminClient()
    const tempPassword = generateRandomPassword()

    // 1. Create auth user (Admin API)
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true }
    })

    if (authCreateError || !authData?.user) {
      console.error('Auth user creation error for judge:', authCreateError)
      const msg = authCreateError?.message?.toLowerCase().includes('already')
        ? 'E-mel ini sudah berdaftar dengan akaun lain.'
        : 'Gagal mencipta akaun juri.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const newUserId = authData.user.id

    // 2. Insert profile record (role: 'judge')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        name,
        email,
        role: 'judge',
      })

    if (profileError) {
      console.error('Create judge profile error:', profileError)
      return NextResponse.json({
        error: 'Akaun dicipta tetapi profil juri gagal disimpan. Sila hubungi pembangun.',
        userId: newUserId
      }, { status: 500 })
    }

    // 3. Insert judge record
    const { data: newJudge, error: insertError } = await supabaseAdmin
      .from('judges')
      .insert({
        name,
        panel_label: panelLabel,
        email,
        event_id: eventId,
        user_id: newUserId,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Create judge record error:', insertError)
      return NextResponse.json({
        error: 'Akaun dicipta tetapi profil juri gagal dipautkan. Sila kaitkan secara manual.',
        userId: newUserId
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, judge: newJudge, tempPassword })
  } catch (err: any) {
    console.error('Create judge exception:', err)
    return NextResponse.json({ error: 'Ralat pelayan dalaman.' }, { status: 500 })
  }
}
