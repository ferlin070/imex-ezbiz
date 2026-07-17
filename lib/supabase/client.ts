import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mockClient'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDummy = !url || !key || url.includes('dummy')

  if (isDummy) {
    return createMockSupabaseClient(null)
  }

  return createBrowserClient(url!, key!)
}
