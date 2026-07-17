import { createBrowserClient } from '@supabase/ssr'
import { createMockSupabaseClient } from './mockClient'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDummy = !url || !key || url.includes('dummy')
  
  let mockSessionVal = null
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/imex_mock_session=([^;]+)/)
    if (match) {
      mockSessionVal = decodeURIComponent(match[1])
    }
  }

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

  return createBrowserClient(url!, key!)
}
