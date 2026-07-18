import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// A2 FIX: Removed 'judge' — not a valid role in current MARA system.
// (Legacy from competition/event architecture that no longer exists)
export type Role = 'entrepreneur' | 'admin' | 'mara_officer'

export async function requireRole(allowed: Role[], customErrorMessage?: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: 'Tidak dibenarkan. Sila log masuk.' },
        { status: 401 }
      )
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile || !allowed.includes(profile.role as Role)) {
    const defaultMsg = allowed.includes('mara_officer')
      ? 'Akses dinafikan. Anda bukan pegawai MARA yang sah.'
      : 'Akses dinafikan. Anda tiada kebenaran.'
    return {
      error: NextResponse.json(
        { error: customErrorMessage || defaultMsg },
        { status: 403 }
      )
    }
  }

  return { user, role: profile.role as Role, supabase }
}
