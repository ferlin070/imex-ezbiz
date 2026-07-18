import { loadEnvConfig } from '@next/env'
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL mesti URL yang sah.'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY mesti sekurang-kurangnya 10 aksara.'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, 'SUPABASE_SERVICE_ROLE_KEY mesti sekurang-kurangnya 10 aksara.'),
  GEMINI_API_KEY: z.string().min(5, 'GEMINI_API_KEY mesti sekurang-kurangnya 5 aksara.'),
  GEMINI_MODEL: z.string().optional().default('gemini-2.0-flash')
})

// Also check for known placeholder values
const placeholderPatterns = ['dummy', 'placeholder', 'your-', 'changeme', 'xxxxx']

function isPlaceholder(val: string): boolean {
  return placeholderPatterns.some(p => val.toLowerCase().includes(p))
}

function validate(env: Record<string, unknown>) {
  console.log('🔍 Validating environment variables...')
  const parsed = envSchema.safeParse(env)
  if (!parsed.success) {
    console.error('❌ Environment validation failed:')
    parsed.error.issues.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`)
    })
    process.exit(1)
  }
  // Check placeholders on required keys
  const requiredKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY']
  for (const key of requiredKeys) {
    const val = env[key]
    if (typeof val === 'string' && isPlaceholder(val)) {
      console.error(`❌ ${key} mengandungi nilai placeholder ("${val.substring(0, 30)}...") — guna nilai sebenar.`)
      process.exit(1)
    }
  }
  console.log('✅ Environment variables validated successfully.')
}

const isCI = !!(process.env.CI || process.env.VERCEL)
if (isCI) {
  // CI/Vercel: no .env files, check process.env directly
  validate(process.env)
} else {
  // Local dev: load .env.local first, then validate
  loadEnvConfig(process.cwd())
  validate(process.env)
}
