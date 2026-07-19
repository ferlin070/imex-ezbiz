import { createAdminClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/requireRole'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  ownerId: z.string().uuid('ID pemilik tidak sah.'),
})

const SIGNED_URL_TTL_SECONDS = 300

const DOC_LABELS: Record<string, string> = {
  ssm_cert: 'Sijil Pendaftaran SSM',
  business_plan: 'Kertas Rancangan Perniagaan',
  bank_statement: 'Penyata Bank (3 bulan)',
  ic_copy: 'Salinan Kad Pengenalan',
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole(
      ['mara_officer', 'admin'],
      'Akses dinafikan. Hanya pegawai MARA boleh melihat dokumen usahawan.'
    )
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({ ownerId: searchParams.get('ownerId') })
    if (!parsed.success) {
      return NextResponse.json({ error: 'ID pemilik tidak sah.' }, { status: 400 })
    }
    const { ownerId } = parsed.data

    const adminSupabase = createAdminClient()

    const { data: docs, error } = await adminSupabase
      .from('business_documents')
      .select('doc_type, storage_path, uploaded_at')
      .eq('owner_user_id', ownerId)

    if (error) {
      return NextResponse.json({ error: 'Gagal mendapatkan senarai dokumen.' }, { status: 500 })
    }

    const documents = await Promise.all(
      (docs || []).map(async (doc) => {
        const { data: signed } = await adminSupabase
          .storage
          .from('business-documents')
          .createSignedUrl(doc.storage_path, SIGNED_URL_TTL_SECONDS)

        return {
          doc_type: doc.doc_type,
          label: DOC_LABELS[doc.doc_type] || doc.doc_type,
          uploaded_at: doc.uploaded_at,
          signed_url: signed?.signedUrl || null,
        }
      })
    )

    try {
      const { user } = auth
      await adminSupabase.from('mara_access_log').insert({
        officer_id: user.id,
        resource_type: 'company_documents',
      })
    } catch {
      // ignore
    }

    return NextResponse.json({ documents })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ralat semasa mendapatkan dokumen.' }, { status: 500 })
  }
}
