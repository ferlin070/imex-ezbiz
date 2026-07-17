import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schemeSchema = z.object({
  name: z.string().min(2),
  agency: z.string().min(2),
  description: z.string().min(5),
  eligibility_criteria: z.string().min(5),
  sector_tags: z.array(z.string()).min(1),
  max_amount_myr: z.number().positive(),
  active: z.boolean().optional().default(true),
})

const updateSchemeSchema = schemeSchema.extend({
  id: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: schemes, error } = await supabase
      .from('grant_schemes')
      .select('*')

    if (error) {
      console.error('Fetch grant schemes error:', error)
      return NextResponse.json({ error: 'Gagal menarik data skim geran.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, schemes: schemes || [] })
  } catch (error: any) {
    console.error('Grant schemes GET exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa menarik skim geran.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Verify role: strictly admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Akses dinafikan. Hanya Pentadbir (Admin) dibenarkan.' }, { status: 403 })
    }

    // 3. Parse and validate input
    const body = await request.json().catch(() => ({}))
    const parsed = schemeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input data.', details: parsed.error.format() }, { status: 400 })
    }

    // 4. Insert scheme record
    const { data: saved, error: insertError } = await supabase
      .from('grant_schemes')
      .insert({
        name: parsed.data.name,
        agency: parsed.data.agency,
        description: parsed.data.description,
        eligibility_criteria: parsed.data.eligibility_criteria,
        sector_tags: parsed.data.sector_tags,
        max_amount_myr: parsed.data.max_amount_myr,
        active: parsed.data.active,
      })

    if (insertError) {
      console.error('Insert grant scheme error:', insertError)
      return NextResponse.json({ error: 'Gagal menyimpan skim geran baharu.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, scheme: saved })
  } catch (error: any) {
    console.error('Grant schemes POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa menambah skim geran.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Verify role: strictly admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Akses dinafikan. Hanya Pentadbir (Admin) dibenarkan.' }, { status: 403 })
    }

    // 3. Parse and validate input
    const body = await request.json().catch(() => ({}))
    const parsed = updateSchemeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input data.', details: parsed.error.format() }, { status: 400 })
    }

    // 4. Update scheme record
    const { data: saved, error: updateError } = await supabase
      .from('grant_schemes')
      .update({
        name: parsed.data.name,
        agency: parsed.data.agency,
        description: parsed.data.description,
        eligibility_criteria: parsed.data.eligibility_criteria,
        sector_tags: parsed.data.sector_tags,
        max_amount_myr: parsed.data.max_amount_myr,
        active: parsed.data.active,
      })
      .eq('id', parsed.data.id)

    if (updateError) {
      console.error('Update grant scheme error:', updateError)
      return NextResponse.json({ error: 'Gagal mengemaskini skim geran.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, scheme: saved })
  } catch (error: any) {
    console.error('Grant schemes PUT exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengemaskini skim geran.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    // 2. Verify role: strictly admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Akses dinafikan. Hanya Pentadbir (Admin) dibenarkan.' }, { status: 403 })
    }

    // 3. Extract scheme ID from query params
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID skim geran diperlukan.' }, { status: 400 })
    }

    // 4. Delete scheme record
    const { error: deleteError } = await supabase
      .from('grant_schemes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete grant scheme error:', deleteError)
      return NextResponse.json({ error: 'Gagal memadam skim geran.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Grant schemes DELETE exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memadam skim geran.' }, { status: 500 })
  }
}
