import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { businessProfileSchema } from '@/schemas/business-profile.schema'

export async function POST(request: Request) {
  let createdProjectId: string | null = null
  const supabase = await createClient()

  try {
    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Parse and validate payload
    const body = await request.json()
    const { documents, ...profileData } = body

    const parsed = businessProfileSchema.safeParse(profileData)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi input.', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data

    // 3. Create Project record (sequential transaction implementation)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_user_id: user.id,
        title: data.business_name,
        description: data.unique_selling_point || 'Tiada deskripsi tambahan.',
        category: data.business_stage === 'idea' ? 'Am' : 'Teknologi', // Default fallback
        entry_type: 'direct',
        score_source: 'self_declared',
        application_status: 'submitted',
        state: data.state || 'Tidak Dinyatakan',
        institution: 'Laluan Terus MARA'
      })
      .select('id')
      .single()

    if (projectError || !project) {
      console.error('Insert project error:', projectError)
      return NextResponse.json({ error: 'Gagal mendaftar projek baru.' }, { status: 500 })
    }

    createdProjectId = project.id

    // 4. Create Business Profile linked to project
    const { error: profileError } = await supabase
      .from('business_profiles')
      .insert({
        project_id: createdProjectId,
        business_name: data.business_name,
        ssm_number: data.ssm_number,
        ssm_registered: data.ssm_registered,
        entity_type: data.entity_type,
        operating_since: data.operating_since,
        address: data.address,
        state: data.state,
        district: data.district,
        owner_full_name: data.owner_full_name,
        owner_ic_number: data.owner_ic_number,
        is_bumiputera: data.is_bumiputera,
        owner_age: data.owner_age,
        education_level: data.education_level,
        phone: data.phone,
        business_stage: data.business_stage,
        monthly_revenue_range: data.monthly_revenue_range,
        employee_count: data.employee_count,
        funding_requested_myr: data.funding_requested_myr,
        fund_usage_breakdown: data.fund_usage_breakdown,
        has_existing_financing: data.has_existing_financing,
        existing_financing_notes: data.existing_financing_notes,
        target_market: data.target_market,
        unique_selling_point: data.unique_selling_point,
      })

    if (profileError) {
      console.error('Insert business_profiles error, rolling back project:', profileError)
      // Rollback inserted project
      await supabase.from('projects').delete().eq('id', createdProjectId)
      return NextResponse.json({ error: 'Gagal mendaftar profil perniagaan usahawan.' }, { status: 500 })
    }

    // 5. Create Business Documents (if provided)
    if (documents && Array.isArray(documents) && documents.length > 0) {
      const documentRecords = documents.map((doc: any) => ({
        project_id: createdProjectId,
        doc_type: doc.doc_type,
        storage_path: doc.storage_path,
      }))

      const { error: docsError } = await supabase
        .from('business_documents')
        .insert(documentRecords)

      if (docsError) {
        console.error('Insert business_documents error, rolling back project & profile:', docsError)
        // Rollback all
        await supabase.from('projects').delete().eq('id', createdProjectId)
        return NextResponse.json({ error: 'Gagal menyimpan rekod dokumen perniagaan.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, projectId: createdProjectId })
  } catch (error: any) {
    console.error('Register Direct API exception:', error)
    if (createdProjectId) {
      // Rollback fallback
      await supabase.from('projects').delete().eq('id', createdProjectId)
    }
    return NextResponse.json({ error: error.message || 'Ralat pelayan semasa mendaftar perniagaan.' }, { status: 500 })
  }
}
