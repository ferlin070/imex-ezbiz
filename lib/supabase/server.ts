import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockSupabaseClient } from './mockClient'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDummy = !url || !key || url.includes('dummy')
  
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
  const isDummy = !url || !serviceKey || url.includes('dummy')

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
