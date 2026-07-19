import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { renderToStream } from '@react-pdf/renderer'
import React from 'react'
import RepaymentScheduleDocument from '@/lib/pdf/RepaymentScheduleDocument'

interface RouteContext {
  params: Promise<{ applicationId: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { applicationId } = await context.params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Tidak dibenarkan. Sila log masuk.' }, { status: 401 })
    }

    const { data: app, error: appError } = await supabase
      .from('loan_applications')
      .select(`
        *,
        loan_products!inner(name, profit_rate_percent),
        projects!inner(owner_user_id, title)
      `)
      .eq('id', applicationId)
      .limit(1)
      .maybeSingle()

    if (appError || !app) {
      return NextResponse.json({ error: 'Permohonan tidak dijumpai.' }, { status: 404 })
    }

    if (app.status !== 'approved') {
      return NextResponse.json({ error: 'Jadual bayaran hanya tersedia untuk permohonan yang diluluskan.' }, { status: 403 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwner = app.projects?.owner_user_id === user.id
    const isStaff = profile?.role === 'admin' || profile?.role === 'mara_officer'

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'Akses dinafikan.' }, { status: 403 })
    }

    const { data: scheduleRec, error: scheduleError } = await supabase
      .from('loan_repayment_schedules')
      .select('*')
      .eq('loan_application_id', applicationId)
      .limit(1)
      .maybeSingle()

    if (scheduleError || !scheduleRec) {
      return NextResponse.json({ error: 'Jadual bayaran tidak dijumpai.' }, { status: 404 })
    }

    const profileResult = await supabase
      .from('profiles')
      .select('name')
      .eq('id', app.projects?.owner_user_id)
      .single()
    const applicantName = profileResult.data?.name || 'Pemohon'

    const finalAmount = app.approved_amount_myr ?? app.requested_amount_myr
    const finalTenure = app.approved_tenure_months ?? app.requested_tenure_months
    const finalRate = app.approved_rate_percent ?? app.loan_products?.profit_rate_percent ?? 0

    const schedule = (scheduleRec.schedule as any[]) || []

    const pdfStream = await renderToStream(
      React.createElement(RepaymentScheduleDocument, {
        applicantName,
        productName: app.loan_products?.name || '',
        amount: Number(finalAmount),
        tenureMonths: Number(finalTenure),
        profitRate: Number(finalRate),
        monthlyInstallment: Number(scheduleRec.monthly_installment_myr),
        totalRepayment: Number(scheduleRec.total_repayment_myr),
        totalProfit: Number(scheduleRec.total_profit_myr),
        schedule: schedule.map((s: any) => ({
          month: s.month,
          installment: s.installment,
          principal: s.principal,
          profit: s.profit,
          balance: s.balance,
        })),
        generatedAt: scheduleRec.generated_at || new Date().toISOString(),
      }) as any
    )

    const cleanFilename = `Jadual_Bayaran_${app.loan_products?.name || 'Pembiayaan'}_${applicantName}`.replace(/[^a-zA-Z0-9]/g, '_')

    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cleanFilename}.pdf"`,
      },
    })
  } catch (error: any) {
    logger.error('Repayment PDF API route exception:', error)
    return NextResponse.json({ error: 'Gagal menjana dokumen PDF.' }, { status: 500 })
  }
}
