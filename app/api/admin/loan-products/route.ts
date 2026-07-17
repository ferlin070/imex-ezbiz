import { requireRole } from '@/lib/auth/requireRole'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const loanProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, 'Nama produk diperlukan'),
  description: z.string().optional().default(''),
  min_amount_myr: z.number().positive('Jumlah minimum mestilah positif'),
  max_amount_myr: z.number().positive('Jumlah maksimum mestilah positif'),
  profit_rate_percent: z.number().nonnegative('Kadar keuntungan mestilah sifar atau positif'),
  min_tenure_months: z.number().int().positive('Tempoh minimum mestilah positif'),
  max_tenure_months: z.number().int().positive('Tempoh maksimum mestilah positif'),
  sector_tags: z.array(z.string()).default([]),
  active: z.boolean().default(true)
})

export async function GET(request: Request) {
  try {
    const auth = await requireRole(['admin'], 'Akses dinafikan. Hanya admin dibenarkan.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 3. Fetch loan products
    const { data: products, error } = await supabase
      .from('loan_products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, products })
  } catch (error: any) {
    console.error('Loan products GET exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengambil skim pinjaman.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(['admin'], 'Akses dinafikan. Hanya admin dibenarkan.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 3. Parse and validate payload
    const body = await request.json()
    const parsed = loanProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi data.', details: parsed.error.format() }, { status: 400 })
    }

    const data = parsed.data

    // 4. Insert loan product
    const { data: saved, error } = await supabase
      .from('loan_products')
      .insert({
        name: data.name,
        description: data.description,
        min_amount_myr: data.min_amount_myr,
        max_amount_myr: data.max_amount_myr,
        profit_rate_percent: data.profit_rate_percent,
        min_tenure_months: data.min_tenure_months,
        max_tenure_months: data.max_tenure_months,
        sector_tags: data.sector_tags,
        active: data.active
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: saved })
  } catch (error: any) {
    console.error('Loan products POST exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mendaftar skim pinjaman.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(['admin'], 'Akses dinafikan. Hanya admin dibenarkan.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 3. Parse and validate payload
    const body = await request.json()
    const parsed = loanProductSchema.safeParse(body)
    if (!parsed.success || !parsed.data.id) {
      return NextResponse.json({ error: 'Ralat validasi data atau ID tidak lengkap.' }, { status: 400 })
    }

    const { id, ...data } = parsed.data

    // 4. Update loan product
    const { data: updated, error } = await supabase
      .from('loan_products')
      .update({
        name: data.name,
        description: data.description,
        min_amount_myr: data.min_amount_myr,
        max_amount_myr: data.max_amount_myr,
        profit_rate_percent: data.profit_rate_percent,
        min_tenure_months: data.min_tenure_months,
        max_tenure_months: data.max_tenure_months,
        sector_tags: data.sector_tags,
        active: data.active
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: updated })
  } catch (error: any) {
    console.error('Loan products PUT exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa mengemaskini skim pinjaman.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireRole(['admin'], 'Akses dinafikan. Hanya admin dibenarkan.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 3. Parse request param
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID skim pinjaman diperlukan.' }, { status: 400 })
    }

    // 4. Delete record
    const { error } = await supabase
      .from('loan_products')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Loan products DELETE exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memadam skim pinjaman.' }, { status: 500 })
  }
}
