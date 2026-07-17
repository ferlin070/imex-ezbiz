import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockSupabaseClient } from './mockClient'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDummy = !url || !key || url.includes('dummy')
  
  const isProd = process.env.NODE_ENV === 'production'
  const mockSessionVal = !isProd ? (process.env.MOCK_SESSION_FOR_TEST || null) : null

  if (isDummy || mockSessionVal) {
    let userId = null
    if (mockSessionVal) {
      try {
        const parsed = JSON.parse(mockSessionVal)
        userId = parsed.id
      } catch {}
    }
    return createMockSupabaseClient(userId)
  }

  const cookieStore = await cookies()

  return createServerClient(
    url!,
    key!,
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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const isProd = process.env.NODE_ENV === 'production'
  const hasMockSession = !isProd && !!process.env.MOCK_SESSION_FOR_TEST
  const isDummy = !url || !serviceKey || url.includes('dummy') || hasMockSession

  if (isDummy) {
    return createMockSupabaseClient('admin-id-mock-uuid')
  }

  return createServerClient(
    url!,
    serviceKey!,
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
