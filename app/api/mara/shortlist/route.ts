import { logger } from '@/lib/logger'
import { requireRole } from '@/lib/auth/requireRole'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const shortlistSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(['berpotensi', 'dihubungi', 'ditolak', 'diluluskan']),
  notes: z.string().optional().default(''),
})

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['mara_officer', 'admin'], 'Akses dinafikan. Anda bukan pegawai MARA yang sah.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 3. Fetch shortlist entries for current officer
    const { data: shortlist, error: shortlistError } = await supabase
      .from('mara_shortlist')
      .select('*')
      .eq('officer_id', user.id)

    if (shortlistError) {
      logger.error('Fetch shortlist error:', shortlistError)
      return NextResponse.json({ error: 'Gagal menarik data senarai pendek.' }, { status: 500 })
    }

    if (!shortlist || shortlist.length === 0) {
      return NextResponse.json({ success: true, shortlist: [] })
    }

    // 4. Enrich entries with project details and feasibility scores/tiers
    const projectIds = shortlist.map((s: any) => s.project_id)
    const { data: projects } = await supabase
      .from('projects')
      .select('id, title, description, category, state, institution, entry_type, score_source')
      .in('id', projectIds)

    const { data: reports } = await supabase
      .from('ai_reports')
      .select('project_id, feasibility_score, feasibility_tier')
      .in('project_id', projectIds)

    const { data: selfAssessments } = await supabase
      .from('self_assessments')
      .select('project_id, computed_score')
      .in('project_id', projectIds)

    const projectsMap = new Map<string, any>((projects || []).map((p: any) => [p.id, p]))
    const reportsMap = new Map<string, any>((reports || []).map((r: any) => [r.project_id, r]))
    const selfAssessmentsMap = new Map<string, number>((selfAssessments || []).map((sa: any) => [sa.project_id, Number(sa.computed_score)]))

    const enriched = shortlist.map((item: any) => {
      const p = projectsMap.get(item.project_id)
      const r = reportsMap.get(item.project_id)
      
      let score = r?.feasibility_score ? Number(r.feasibility_score) : 0
      let tier = r?.feasibility_tier || 'Perlu Bimbingan'

      if (!r && p?.entry_type === 'direct') {
        score = selfAssessmentsMap.get(item.project_id) || 0
        if (score >= 80) tier = 'Sangat Berpotensi'
        else if (score >= 60) tier = 'Layak Komersial'
        else if (score >= 40) tier = 'Berpotensi Sederhana'
        else tier = 'Perlu Bimbingan'
      }

      return {
        id: item.id,
        officer_id: item.officer_id,
        project_id: item.project_id,
        status: item.status,
        notes: item.notes,
        created_at: item.created_at,
        updated_at: item.updated_at,
        project_title: p?.title || 'Projek Terdelete',
        project_description: p?.description || '',
        project_category: p?.category || 'Lain-lain',
        project_state: p?.state || 'Tidak Dinyatakan',
        project_institution: p?.institution || 'Tidak Dinyatakan',
        feasibility_score: score,
        feasibility_tier: tier,
        score_source: p?.score_source || 'expert_evaluated'
      }
    })

    return NextResponse.json({ success: true, shortlist: enriched })
  } catch (error: any) {
    logger.error('Shortlist GET API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa menarik senarai pendek.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['mara_officer', 'admin'], 'Akses dinafikan. Anda bukan pegawai MARA yang sah.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 3. Parse request payload
    const body = await request.json().catch(() => ({}))
    const parsed = shortlistSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input data.', details: parsed.error.format() }, { status: 400 })
    }

    const { projectId, status, notes } = parsed.data

    // 4. Upsert shortlist record
    const { data: saved, error: upsertError } = await supabase
      .from('mara_shortlist')
      .upsert({
        officer_id: user.id,
        project_id: projectId,
        status,
        notes,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      logger.error('Upsert shortlist error:', upsertError)
      return NextResponse.json({ error: 'Gagal mengemaskini senarai pendek di pangkalan data.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, shortlist: saved })
  } catch (error: any) {
    logger.error('Shortlist POST API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengemaskini senarai pendek.' }, { status: 500 })
  }
}
