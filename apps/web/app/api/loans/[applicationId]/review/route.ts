import { logger } from '@/lib/logger'
import { requireRole } from '@/lib/auth/requireRole'
import { NextResponse } from 'next/server'
import { calculateLoan } from '@/lib/loanCalculator'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected', 'under_review']),
  officerNotes: z.string().min(3, 'Sila nyatakan ulasan pegawai (min 3 aksara)'),
  approvedAmountMyr: z.number().positive().optional(),
  approvedTenureMonths: z.number().int().positive().optional(),
  approvedRatePercent: z.number().nonnegative().optional()
})

interface RouteParams {
  params: Promise<{ applicationId: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const { applicationId } = await params

  try {
    const auth = await requireRole(['mara_officer', 'admin'], 'Akses dinafikan. Anda bukan pegawai MARA yang sah.')
    if (auth.error) return auth.error
    const { user, supabase } = auth

    // 3. Parse and validate review payload
    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Ralat validasi ulasan.', details: parsed.error.format() }, { status: 400 })
    }

    const { status, officerNotes, approvedAmountMyr, approvedTenureMonths, approvedRatePercent } = parsed.data

    // 4. Fetch the existing application details
    const { data: application, error: appError } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: 'Permohonan pembiayaan tidak ditemui.' }, { status: 404 })
    }

    const finalAmount = approvedAmountMyr || Number(application.requested_amount_myr)
    const finalTenure = approvedTenureMonths || application.requested_tenure_months
    
    // Fetch product rate if not specified
    let finalRate = approvedRatePercent
    if (finalRate === undefined) {
      const { data: product } = await supabase
        .from('loan_products')
        .select('profit_rate_percent')
        .eq('id', application.loan_product_id)
        .single()
      finalRate = product ? Number(product.profit_rate_percent) : 4.0
    }

    // 5. If approved, recalculate and upsert schedule
    if (status === 'approved') {
      const calculation = calculateLoan(finalAmount, finalRate, finalTenure)
      
      const { error: scheduleError } = await supabase
        .from('loan_repayment_schedules')
        .upsert({
          loan_application_id: applicationId,
          schedule: calculation.schedule,
          monthly_installment_myr: calculation.monthlyInstallment,
          total_repayment_myr: calculation.totalRepayment,
          total_profit_myr: calculation.totalProfit,
          generated_at: new Date().toISOString()
        }, {
          onConflict: 'loan_application_id'
        })

      if (scheduleError) {
        logger.error('Failed to update repayment schedule during approval:', scheduleError)
        return NextResponse.json({ error: 'Gagal mengemaskini jadual bayaran balik pembiayaan.' }, { status: 500 })
      }
    }

    // 6. Update loan application status & details
    const { error: updateError } = await supabase
      .from('loan_applications')
      .update({
        status,
        officer_id: user.id,
        officer_notes: officerNotes,
        approved_amount_myr: status === 'approved' ? finalAmount : null,
        approved_tenure_months: status === 'approved' ? finalTenure : null,
        approved_rate_percent: status === 'approved' ? finalRate : null,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (updateError) {
      logger.error('Failed to update loan application:', updateError)
      return NextResponse.json({ error: 'Gagal mengemaskini permohonan pinjaman.' }, { status: 500 })
    }

    // 7. Update project application status
    const projectStatusMap = {
      approved: 'shortlisted', // map approved to shortlisted / approved status
      rejected: 'rejected',
      under_review: 'under_review'
    }
    const nextProjectStatus = projectStatusMap[status]

    const { error: projectError } = await supabase
      .from('projects')
      .update({ application_status: nextProjectStatus })
      .eq('id', application.project_id)

    if (projectError) {
      logger.warn('Gagal mengemaskini status projek:', projectError)
    }

    // 8. Insert notification for entrepreneur
    const { data: project } = await supabase
      .from('projects')
      .select('owner_user_id, title')
      .eq('id', application.project_id)
      .single()

    if (project) {
      const notificationType = status === 'approved' ? 'application_approved' : 'application_rejected'
      const title = status === 'approved'
        ? 'Permohonan Pembiayaan Diluluskan'
        : 'Permohonan Pembiayaan Ditolak'
      const message = status === 'approved'
        ? `Permohonan ${application.loan_product_id} telah diluluskan oleh pegawai MARA.`
        : `Permohonan ${application.loan_product_id} telah ditolak. Ulasan pegawai: ${officerNotes}`

      const adminSupabase = createAdminClient()
      const { error: notifError } = await adminSupabase
        .from('notifications')
        .insert({
          user_id: project.owner_user_id,
          type: notificationType,
          title,
          message,
          link: '/usahawan',
        })

      if (notifError) {
        logger.warn('Gagal insert notifikasi:', notifError)
      }
    }

    // 9. Log the access/review action
    const { error: logError } = await supabase
      .from('mara_access_log')
      .insert({
        officer_id: user.id,
        project_id: application.project_id,
        resource_type: 'loan_application'
      })

    if (logError) {
      logger.warn('Failed to log audit for loan application review:', logError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Review application API exception:', error)
    return NextResponse.json({ error: error.message || 'Ralat server semasa memproses ulasan.' }, { status: 500 })
  }
}
