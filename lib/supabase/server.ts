import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockSupabaseClient } from './mockClient'

export async function createClient() {
  const isDummy = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy')
  
  let mockSessionVal = null
  try {
    const cookieStore = await cookies()
    mockSessionVal = cookieStore.get('imex_mock_session')?.value
  } catch {}

  if (isDummy || mockSessionVal) {
    let userId = null
    if (mockSessionVal) {
      try {
        const parsed = JSON.parse(decodeURIComponent(mockSessionVal))
        userId = parsed.id
      } catch {}
    }
    return createMockSupabaseClient(userId)
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore setAll errors in Server Components
          }
        },
      },
    }
  )
}

export function createAdminClient() {
  const isDummy = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy')
  if (isDummy) {
    return createMockSupabaseClient('admin-id-mock-uuid')
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {}
      }
    }
  )
}
