import { calculateLoan } from '@/lib/loanCalculator'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const calculateSchema = z.object({
  amount: z.number().positive(),
  annualRate: z.number().nonnegative(),
  tenureMonths: z.number().int().positive()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = calculateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat input kalkulasi.' }, { status: 400 })
    }

    const { amount, annualRate, tenureMonths } = parsed.data
    const result = calculateLoan(amount, annualRate, tenureMonths)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Ralat semasa memproses perkiraan.' }, { status: 500 })
  }
}
