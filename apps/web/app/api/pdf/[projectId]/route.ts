import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import ReportDocument from '@/lib/pdf/ReportDocument'

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

    // 2. Fetch project metadata (only columns that exist in current schema)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, description, category, owner_user_id')
      .eq('id', projectId)
      .limit(1)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projek tidak dijumpai.' }, { status: 404 })
    }

    // 3. Verify user has rights: owner OR admin/mara_officer only
    //    A2 FIX: Removed 'judge' role and query to non-existent 'judges' table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = project.owner_user_id === user.id
    const isStaff = profile?.role === 'admin' || profile?.role === 'mara_officer'

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'Akses dinafikan.' }, { status: 403 })
    }

    // 4. Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('ai_reports')
      .select('*')
      .eq('project_id', projectId)
      .limit(1)
      .maybeSingle()

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Laporan AI belum dijana untuk projek ini.' },
        { status: 404 }
      )
    }

    // 5. Render PDF Document to stream
    const pdfStream = await renderToStream(
      React.createElement(ReportDocument, {
        project: {
          title: project.title,
          description: project.description || '',
          category: project.category || '',
          team_members: [],
        },
        report: {
          feasibility_score: Number(report.feasibility_score) || 0,
          feasibility_tier: report.feasibility_tier || '',
          swot: report.swot || {},
          blueprint: report.blueprint || {},
          pitch_script: report.pitch_script || '',
          grant_notes: report.grant_notes || {},
          generated_at: report.generated_at || new Date().toISOString(),
        },
      }) as any
    )

    // Clean dynamic filename
    const cleanFilename = project.title.replace(/[^a-zA-Z0-9]/g, '_')

    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Laporan_IMEX_AI_Biz_${cleanFilename}.pdf"`,
      },
    })
  } catch (error: any) {
    logger.error('PDF API route exception:', error)
    return NextResponse.json({ error: 'Gagal menjana dokumen PDF.' }, { status: 500 })
  }
}
