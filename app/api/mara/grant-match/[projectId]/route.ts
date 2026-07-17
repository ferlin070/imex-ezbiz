import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calculateFeasibility } from '@/lib/feasibility'
import { generateGrantMatches } from '@/lib/grantMatch'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Verify role: admin or mara_officer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'mara_officer' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Akses dinafikan. Anda bukan pegawai MARA yang sah.' }, { status: 403 })
    }

    // 3. Log access in audit log (mara_access_log)
    const { error: logError } = await supabase
      .from('mara_access_log')
      .insert({
        officer_id: user.id,
        project_id: projectId,
      })

    if (logError) {
      console.warn('Gagal merekod log audit akses pegawai MARA:', logError)
    }

    // 4. Fetch project metadata
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, title, description, category, state, institution, event_id')
      .eq('id', projectId)
      .limit(1)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projek tidak dijumpai.' }, { status: 404 })
    }

    // 5. Fetch scores and criteria to calculate feasibility
    const { data: scores } = await supabase
      .from('scores')
      .select('*')
      .eq('project_id', projectId)

    const { data: criteria } = await supabase
      .from('criteria')
      .select('*')
      .eq('event_id', project.event_id)

    const feasibility = calculateFeasibility(scores || [], criteria || [])

    // 6. Fetch all active grant schemes
    const { data: schemes, error: schemesError } = await supabase
      .from('grant_schemes')
      .select('*')
      .eq('active', true)

    if (schemesError || !schemes || schemes.length === 0) {
      return NextResponse.json({ error: 'Tiada skim geran aktif ditemui dalam sistem.' }, { status: 404 })
    }

    // 7. Run the AI matching engine
    const matches = await generateGrantMatches(
      {
        id: project.id,
        title: project.title,
        description: project.description || '',
        category: project.category || 'Lain-lain',
        state: project.state || 'Tidak Dinyatakan',
        institution: project.institution || 'Tidak Dinyatakan',
      },
      feasibility,
      schemes
    )

    // 8. Upsert matches to the database
    for (const match of matches) {
      const { error: upsertError } = await supabase
        .from('grant_matches')
        .upsert({
          project_id: projectId,
          scheme_id: match.scheme_id,
          match_score: match.match_score,
          match_reasoning: match.match_reasoning,
          generated_at: new Date().toISOString(),
          model_version: 'gemini-1.5-flash',
        })

      if (upsertError) {
        console.error(`Gagal menyimpan padanan geran untuk scheme_id ${match.scheme_id}:`, upsertError)
      }
    }

    // 9. Fetch and return saved matches sorted by score descending
    const { data: savedMatches } = await supabase
      .from('grant_matches')
      .select('*')
      .eq('project_id', projectId)

    // Map scheme names for return payload
    const schemesMap = new Map<string, any>(schemes.map((s: any) => [s.id, s]))
    const enrichedMatches = (savedMatches || []).map((m: any) => {
      const scheme = schemesMap.get(m.scheme_id)
      return {
        ...m,
        scheme_name: scheme?.name || 'Skim Geran',
        scheme_agency: scheme?.agency || 'MARA',
        scheme_max_amount: scheme?.max_amount_myr || 0,
      }
    })

    // Sort by match_score descending
    enrichedMatches.sort((a: any, b: any) => b.match_score - a.match_score)

    return NextResponse.json({ success: true, matches: enrichedMatches })
  } catch (error: any) {
    console.error('Grant matching engine route exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat semasa memproses padanan geran.' }, { status: 500 })
  }
}
