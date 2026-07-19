import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ACCEPTED_TYPES = ['ssm_cert', 'business_plan', 'bank_statement', 'ic_copy']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const uploadSchema = z.object({
  doc_type: z.enum(['ssm_cert', 'business_plan', 'bank_statement', 'ic_copy']),
})

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['entrepreneur', 'admin', 'mara_officer'])
    if (auth.error) return auth.error
    const { user, supabase } = auth

    const formData = await request.formData()
    const docType = formData.get('doc_type') as string
    const file = formData.get('file') as File | null

    const parsed = uploadSchema.safeParse({ doc_type: docType })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Jenis dokumen tidak sah.' }, { status: 400 })
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Sila pilih fail untuk dimuat naik.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Saiz fail maksimum 5MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const allowedExt = ['pdf', 'jpg', 'jpeg', 'png']
    if (!allowedExt.includes(ext)) {
      return NextResponse.json({ error: 'Format fail tidak sah. Gunakan PDF, JPG, atau PNG.' }, { status: 400 })
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Sila daftar profil syarikat terlebih dahulu.' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const adminSupabase = createAdminClient()
    const filePath = `${user.id}/${docType}.${ext}`

    const { error: uploadError } = await adminSupabase
      .storage
      .from('business-documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: 'Gagal muat naik dokumen: ' + uploadError.message }, { status: 500 })
    }

    const { data: existing } = await adminSupabase
      .from('business_documents')
      .select('id')
      .eq('project_id', project.id)
      .eq('doc_type', docType)
      .limit(1)
      .maybeSingle()

    if (existing) {
      const { error: dbError } = await adminSupabase
        .from('business_documents')
        .update({ storage_path: filePath })
        .eq('id', existing.id)

      if (dbError) {
        return NextResponse.json({ error: 'Gagal menyimpan rekod dokumen: ' + dbError.message }, { status: 500 })
      }
    } else {
      const { error: dbError } = await adminSupabase
        .from('business_documents')
        .insert({ project_id: project.id, doc_type: docType, storage_path: filePath })

      if (dbError) {
        return NextResponse.json({ error: 'Gagal menyimpan rekod dokumen: ' + dbError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Dokumen berjaya dimuat naik.' })
  } catch (err: any) {
    return NextResponse.json({ error: 'Ralat: ' + (err?.message || err?.stack || JSON.stringify(err)) }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['entrepreneur', 'admin', 'mara_officer'])
    if (auth.error) return auth.error
    const { user, supabase } = auth

    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_user_id', user.id)

    if (!projects || projects.length === 0) {
      return NextResponse.json({ documents: [] })
    }

    const projectIds = projects.map(p => p.id)

    const adminSupabase = createAdminClient()
    const { data: docs, error } = await adminSupabase
      .from('business_documents')
      .select('doc_type, storage_path, uploaded_at')
      .in('project_id', projectIds)

    if (error) {
      return NextResponse.json({ error: 'Gagal mendapatkan senarai dokumen.' }, { status: 500 })
    }

    return NextResponse.json({ documents: docs || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ralat.' }, { status: 500 })
  }
}
