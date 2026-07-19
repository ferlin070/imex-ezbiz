'use client'

import { useRouter } from 'next/navigation'
import LoanCalculatorWidget from './LoanCalculatorWidget'

interface LoanProduct {
  id: string
  name: string
  description: string
  min_amount_myr: number
  max_amount_myr: number
  profit_rate_percent: number
  min_tenure_months: number
  max_tenure_months: number
  sector_tags: string[]
}

export default function LoanCalculatorWrapper({ products }: { products: LoanProduct[] }) {
  const router = useRouter()

  const handleApply = (productId: string, amount: number, tenureMonths: number) => {
    router.push(`/loans/apply/${productId}?amount=${amount}&tenure=${tenureMonths}`)
  }

  return <LoanCalculatorWidget products={products} onApply={handleApply} />
}
