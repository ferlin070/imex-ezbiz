import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function GET() {
  const status: Record<string, string> = {
    supabase: 'unknown',
    gemini: 'unknown',
    database: 'unknown'
  }

  // 1. Check Supabase / DB Connection
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    if (error) {
      status.supabase = 'down'
      status.database = 'down'
      logger.error({ err: error }, 'Health check database query error')
    } else {
      status.supabase = 'up'
      status.database = 'up'
    }
  } catch (error) {
    status.supabase = 'down'
    status.database = 'down'
    logger.error({ err: error }, 'Health check database connection exception')
  }

  // 2. Check Gemini API
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      status.gemini = 'down'
    } else {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      if (model) {
        status.gemini = 'up'
      } else {
        status.gemini = 'down'
      }
    }
  } catch (error) {
    status.gemini = 'down'
    logger.error({ err: error }, 'Health check Gemini API exception')
  }

  const isHealthy = status.supabase === 'up' && status.gemini === 'up' && status.database === 'up'

  return NextResponse.json(
    { status: isHealthy ? 'healthy' : 'unhealthy', details: status },
    { status: isHealthy ? 200 : 503 }
  )
}
