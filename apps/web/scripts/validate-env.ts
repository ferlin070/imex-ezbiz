import { loadEnvConfig } from '@next/env'
import { z } from 'zod'

// Validate environment variables. On CI/Vercel: still validate — fail the build early 
// if vars are missing or are placeholder values. Prevents silent production fallback to mock data.
const isCI = !!(process.env.CI || process.env.VERCEL)
if (isCI) {
  console.log('ℹ️  CI/Vercel build detected — validating required environment variables...')
  // On CI, env vars must be present and not be placeholder values.
  // We check them directly from process.env (not .env files, which don't exist in CI).
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
  ]
  const placeholderPatterns = ['dummy', 'placeholder', 'your-', 'changeme', 'xxxxx']
  const errors: string[] = []
  for (const key of required) {
    const val = process.env[key]
    if (!val) {
      errors.push(`${key} tidak ditetapkan (missing).`)
    } else if (placeholderPatterns.some(p => val.toLowerCase().includes(p))) {
      errors.push(`${key} mengandungi nilai placeholder ("${val.substring(0, 20)}...") — guna nilai sebenar.`)
    }
  }
  if (errors.length > 0) {
    console.error('❌ Environment validation GAGAL di Vercel/CI:')
    errors.forEach(e => console.error(`   - ${e}`))
    console.error('   Pastikan semua environment variables ditetapkan dengan betul di Vercel Dashboard → Settings → Environment Variables.')
    process.exit(1)
  }
  console.log('✅ Environment variables Vercel/CI disahkan berjaya.')
  process.exit(0)
}


// Load environment variables from .env.local/env files
loadEnvConfig(process.cwd())

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid string.'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY must be a valid string.'),
  GEMINI_API_KEY: z.string().min(5, 'GEMINI_API_KEY must be a valid string.'),
  GEMINI_MODEL: z.string().optional().default('gemini-1.5-flash')
})

try {
  console.log('🔍 Validating environment variables...')
  envSchema.parse(process.env)
  console.log('✅ Environment variables validated successfully.')
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment validation failed:')
    error.issues.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`)
    })
    process.exit(1)
  } else {
    console.error('❌ Environment validation failed with unknown error:', error)
    process.exit(1)
  }
}
