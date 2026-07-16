import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteContext {
  params: Promise<{ projectId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params
    const supabase = await createClient()

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, owner_user_id, event_id')
      .eq('id', projectId)
      .limit(1)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projek tidak dijumpai.' }, { status: 404 })
    }

    // 3. Verify user has rights (owner, judge for the event, or admin)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = project.owner_user_id === user.id
    const isAdmin = profile?.role === 'admin'
    
    // Check if judge for this project's event
    let isJudge = false
    if (profile?.role === 'judge') {
      const { data: judge } = await supabase
        .from('judges')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', project.event_id)
        .limit(1)
        .maybeSingle()
      if (judge) isJudge = true;
    }

    if (!isOwner && !isAdmin && !isJudge) {
      return NextResponse.json({ error: 'Akses dinafikan.' }, { status: 403 })
    }

    // 4. Fetch the report from cache
    const { data: report, error: reportError } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle()

    if (reportError) {
      console.error('Fetch report cache error:', reportError)
      return NextResponse.json({ error: 'Ralat pangkalan data semasa mengambil laporan.' }, { status: 500 })
    }

    if (!report) {
      return NextResponse.json({ found: false, message: 'Laporan AI belum dijana.' }, { status: 200 })
    }

    return NextResponse.json({ found: true, report })
  } catch (error) {
    console.error('Get Report Cache exception:', error)
    return NextResponse.json({ error: 'Ralat server dalaman.' }, { status: 500 })
  }
}
