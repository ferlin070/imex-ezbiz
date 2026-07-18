import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('dummy')) {
    throw new Error(
      '[MARA AI-Advisor] NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'tidak ditetapkan atau mengandungi nilai placeholder. ' +
      'Tetapkan nilai sebenar dalam .env.local (dev) atau Vercel Dashboard → Settings → Environment Variables (production).'
    )
  }

  return createBrowserClient(url, key)
}
