import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mockClient'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDummy = !url || !key || url.includes('dummy')

  // R3 FIX: In production, never silently fall back to mock client.
  // If env vars are missing/dummy in production, throw a clear error immediately
  // so the problem is visible in Vercel logs — not silently swallowed.
  // Note: we detect "production" by checking if the hostname is NOT localhost.
  const isProduction =
    typeof window !== 'undefined'
      ? !window.location.hostname.includes('localhost') &&
        !window.location.hostname.includes('127.0.0.1')
      : process.env.NODE_ENV === 'production'

  if (isDummy && isProduction) {
    throw new Error(
      '[MARA AI-Advisor] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'tidak ditetapkan atau mengandungi nilai placeholder di production. ' +
      'Pergi ke Vercel Dashboard → Settings → Environment Variables dan tetapkan nilai sebenar.'
    )
  }

  if (isDummy) {
    return createMockSupabaseClient(null)
  }

  return createBrowserClient(url!, key!)
}
