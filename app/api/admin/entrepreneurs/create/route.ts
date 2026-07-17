import { createClient, createAdminClient } from '@/lib/supabase/server'
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

    // 1. Verify project ownership before creating user
    if (projectId) {
      const { data: existingProject, error: projectFetchError } = await supabase
        .from('projects')
        .select('owner_user_id')
        .eq('id', projectId)
        .limit(1)
        .maybeSingle()

      if (projectFetchError) {
        return NextResponse.json({ error: 'Ralat semasa menyemak projek.' }, { status: 500 })
      }
      if (!existingProject) {
        return NextResponse.json({ error: 'Projek tidak dijumpai.' }, { status: 404 })
      }
      if (existingProject.owner_user_id) {
        return NextResponse.json({
          error: 'Projek ini sudah mempunyai pemilik.'
        }, { status: 409 })
      }
    }

    const supabaseAdmin = createAdminClient()

    // 2. Create auth user (Admin API)
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
    })

    if (authCreateError || !authData?.user) {
      console.error('Auth user creation error:', authCreateError)
      const msg = authCreateError?.message?.toLowerCase().includes('already')
        ? 'E-mel ini sudah berdaftar dengan akaun lain.'
        : 'Gagal mencipta akaun usahawan.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const newUserId = authData.user.id

    // 3. Insert profile record using the generated user ID
    const { data: newProfile, error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        name,
        email,
        role: 'entrepreneur',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Create entrepreneur profile error:', insertError)
      return NextResponse.json({
        error: 'Akaun dicipta tetapi profil usahawan gagal disimpan. Sila hubungi pembangun.',
        userId: newUserId
      }, { status: 500 })
    }

    // 4. Link project if projectId was provided
    if (projectId) {
      const { error: linkError } = await supabaseAdmin
        .from('projects')
        .update({ owner_user_id: newUserId })
        .eq('id', projectId)

      if (linkError) {
        console.error('Project link error:', linkError)
        return NextResponse.json({
          error: 'Akaun dicipta tetapi gagal dikaitkan dengan projek. Sila kaitkan secara manual.',
          userId: newUserId
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, profile: newProfile })
  } catch (err: any) {
    console.error('Create entrepreneur exception:', err)
    return NextResponse.json({ error: 'Ralat pelayan dalaman.' }, { status: 500 })
  }
}
