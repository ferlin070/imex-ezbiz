import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Landmark, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import LoanApplicationFormClient from './LoanApplicationFormClient'

interface PageProps {
  params: Promise<{ loanProductId: string }>
  searchParams: Promise<{ amount?: string; tenure?: string }>
}

export default async function LoanApplyPage({ params, searchParams }: PageProps) {
  const { loanProductId } = await params
  const { amount, tenure } = await searchParams
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // 2. Fetch loan product details
  const { data: product, error: productError } = await supabase
    .from('loan_products')
    .select('*')
    .eq('id', loanProductId)
    .single()

  if (productError || !product) {
    redirect('/loans')
  }

  // 3. Fetch user's project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, title, category')
    .eq('owner_user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!project) {
    // Cannot apply without a business profile
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-xl font-bold text-red-400">Pendaftaran Profil Diperlukan</h2>
          <p className="text-sm text-slate-400">
            Anda perlu melengkapkan pendaftaran profil perniagaan usahawan terlebih dahulu sebelum boleh memohon skim pembiayaan MARA.
          </p>
          <Link href="/usahawan" className="inline-block px-5 py-2.5 bg-blue-500 hover:bg-blue-600 font-bold rounded-xl text-xs transition">
            Daftar Profil Perniagaan
          </Link>
        </div>
      </div>
    )
  }

  return (
    <LoanApplicationFormClient
      product={product}
      project={project}
      initialAmount={amount ? Number(amount) : undefined}
      initialTenure={tenure ? Number(tenure) : undefined}
    />
  )
}
