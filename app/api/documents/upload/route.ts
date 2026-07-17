import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
]

const MIME_TO_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
}

const fileUploadSchema = z.object({
  file: z.any()
    .refine((file) => file instanceof File, 'Fail tidak sah atau tiada fail dipilih.')
    .refine((file) => file instanceof File && file.size <= MAX_FILE_SIZE_BYTES, 'Saiz fail melebihi had maksimum 10MB.')
    .refine((file) => file instanceof File && ALLOWED_MIME_TYPES.includes(file.type), 'Format fail tidak dibenarkan. Hanya PDF, JPEG, PNG, dan DOCX sahaja dibenarkan.')
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Parse form data
    const formData = await request.formData()
    const file = formData.get('file')

    // 3. Validate file upload using Zod schema
    const parsedResult = fileUploadSchema.safeParse({ file })
    if (!parsedResult.success) {
      const errorMsg = parsedResult.error.issues[0]?.message || 'Validasi fail gagal.'
      const isTooLarge = errorMsg.includes('maksimum 10MB')
      return NextResponse.json(
        { error: errorMsg },
        { status: isTooLarge ? 413 : 400 }
      )
    }

    const validatedFile = file as File

    // 4. Upload to Supabase Storage
    const arrayBuffer = await validatedFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = MIME_TO_EXTENSION[validatedFile.type]
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-documents')
      .upload(fileName, buffer, {
        contentType: validatedFile.type,
        duplex: 'half'
      } as any)

    if (uploadError) {
      logger.error({ err: uploadError }, 'Storage upload error')
      return NextResponse.json({ error: 'Gagal memuat naik fail ke storan.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, storage_path: uploadData.path })
  } catch (error: any) {
    logger.error({ err: error }, 'Upload API exception')
    return NextResponse.json({ error: error.message || 'Ralat server semasa muat naik.' }, { status: 500 })
  }
}
