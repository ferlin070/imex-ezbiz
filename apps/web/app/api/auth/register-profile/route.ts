import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// POST /api/auth/register-profile
// Called by the signup page after supabase.auth.signUp() succeeds.
// Uses the ADMIN (service role) client to insert the profile row,
// bypassing RLS entirely — necessary because the user has NO session yet
// when email confirmation is enabled in Supabase.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, name } = body

    // Validate required fields
    if (!userId || !email || !name) {
      return NextResponse.json(
        { error: 'userId, email, dan name adalah wajib.' },
        { status: 400 }
      )
    }

    // Basic UUID format check to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'userId tidak sah.' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Verify the user actually exists in Supabase Auth (prevents forged requests)
    const { data: authUser, error: authLookupError } = await adminClient.auth.admin.getUserById(userId)
    if (authLookupError || !authUser?.user) {
      return NextResponse.json(
        { error: 'Pengguna tidak dijumpai dalam sistem Auth.' },
        { status: 404 }
      )
    }

    // Insert profile with ON CONFLICT DO NOTHING (safe to call multiple times)
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert(
        {
          id: userId,
          email: email,
          name: name.trim(),
          role: 'entrepreneur',
        },
        {
          // If profile already exists (e.g. created by DB trigger), skip silently
          onConflict: 'id',
          ignoreDuplicates: true,
        }
      )

    if (profileError) {
      console.error('[register-profile] Failed to insert profile:', profileError)
      return NextResponse.json(
        { error: 'Profil gagal dicipta: ' + profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[register-profile] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Ralat pelayan dalaman.' },
      { status: 500 }
    )
  }
}
