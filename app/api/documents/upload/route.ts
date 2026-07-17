import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Fail tidak ditemui dalam permintaan.' }, { status: 400 })
    }

    // 3. Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half'
      } as any)

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal memuat naik fail ke storan.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, storage_path: uploadData.path })
  } catch (error: any) {
    console.error('Upload API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa muat naik.' }, { status: 500 })
  }
}
