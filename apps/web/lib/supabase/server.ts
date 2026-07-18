import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('dummy')) {
    throw new Error(
      '[MARA AI-Advisor] SUPABASE environment variables tidak ditetapkan atau mengandungi nilai placeholder. ' +
      'Pergi ke Vercel Dashboard → Settings → Environment Variables dan tetapkan ' +
      'NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY dengan nilai sebenar.'
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    url,
    key,
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

  if (!url || !serviceKey || url.includes('dummy')) {
    throw new Error(
      '[MARA AI-Advisor] SUPABASE_SERVICE_ROLE_KEY tidak ditetapkan atau mengandungi nilai placeholder. ' +
      'Pergi ke Vercel Dashboard → Settings → Environment Variables dan tetapkan nilai sebenar.'
    )
  }

  return createServerClient(
    url,
    serviceKey,
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
