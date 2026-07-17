import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const consentSchema = z.object({
  projectId: z.string().min(1),
  maraVisible: z.boolean(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Parse payload
    const body = await request.json().catch(() => ({}))
    const parsed = consentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input data.', details: parsed.error.format() }, { status: 400 })
    }

    const { projectId, maraVisible } = parsed.data

    // 3. Verify user is owner of the project (or admin)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_user_id')
      .eq('id', projectId)
      .limit(1)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projek tidak dijumpai.' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = project.owner_user_id === user.id
    const isAdmin = profile?.role === 'admin'

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Akses dinafikan. Anda bukan pemilik projek ini.' }, { status: 403 })
    }

    // 4. Update project's mara_visible status on the server
    const { error: updateError } = await supabase
      .from('projects')
      .update({ mara_visible: maraVisible })
      .eq('id', projectId)

    if (updateError) {
      logger.error('Update consent error:', updateError)
      return NextResponse.json({ error: 'Gagal mengemas kini kebenaran di pangkalan data.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, maraVisible })
  } catch (error: any) {
    logger.error('Consent API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengemas kini kebenaran.' }, { status: 500 })
  }
}
