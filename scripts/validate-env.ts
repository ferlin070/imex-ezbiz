import { loadEnvConfig } from '@next/env'
import { z } from 'zod'

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
