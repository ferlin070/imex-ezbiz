import { NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'doc/api/openapi.json')
    const jsonContent = fs.readFileSync(filePath, 'utf8')
    return NextResponse.json(JSON.parse(jsonContent))
  } catch (error: any) {
    logger.error({ err: error }, 'Exposing API documentation exception')
    return NextResponse.json({ error: 'Gagal memuat spesifikasi OpenAPI.' }, { status: 500 })
  }
}
