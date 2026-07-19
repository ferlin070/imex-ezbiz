import { verifySSM } from '../integration/ssm'

export interface EligibilityRules {
  minSSMAgeMonths: number
  requiredDocTypes: readonly string[]
  ssmActiveOnly?: boolean
  bumiputeraOnly?: boolean
  minOwnerAge: number
  maxOwnerAge: number
}

const defaultRules: EligibilityRules = {
  minSSMAgeMonths: 12,
  requiredDocTypes: ['ssm_cert', 'business_plan'],
  ssmActiveOnly: true,
  bumiputeraOnly: true,
  minOwnerAge: 18,
  maxOwnerAge: 65,
}

export interface EligibilityInput {
  ssmNumber: string
  ownerAge: number
  isBumiputera: boolean
  documents: { doc_type: string }[]
}

export interface CriterionResult {
  name: string
  passed: boolean
  actual: string
  required: string
  monthsRemaining?: number
  eligibleFromDate?: string
}

export interface EligibilityResult {
  eligible: boolean
  status: 'LULUS' | 'TIDAK_LULUS' | 'PERLU_TINDAKAN'
  reason: string
  criteria: CriterionResult[]
}

export async function evaluateEligibility(
  input: EligibilityInput,
  rules?: EligibilityRules
): Promise<EligibilityResult> {
  const finalRules = rules || defaultRules
  const criteria: CriterionResult[] = []

  const ssmResult = await verifySSM(input.ssmNumber)

  const ssmRegistered = ssmResult.registered
  criteria.push({
    name: 'Pendaftaran SSM',
    passed: ssmRegistered,
    actual: ssmRegistered ? 'Berdaftar' : 'Tiada dalam rekod',
    required: 'Berdaftar dengan SSM',
  })

  if (ssmRegistered) {
    const ssmActive = ssmResult.status === 'active'
    criteria.push({
      name: 'Status SSM Aktif',
      passed: ssmActive,
      actual: ssmResult.status === 'active' ? 'Aktif' : 'Tamat Tempoh/Tidak Aktif',
      required: 'Aktif',
    })

    if (ssmResult.registrationDate) {
      const regDate = new Date(ssmResult.registrationDate)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - regDate.getTime())
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375))
      const haulPassed = diffMonths >= finalRules.minSSMAgeMonths

      const haulCriterion: CriterionResult = {
        name: 'Haul Perniagaan',
        passed: haulPassed,
        actual: `${diffMonths} bulan`,
        required: `>= ${finalRules.minSSMAgeMonths} bulan`,
      }

      if (!haulPassed) {
        const eligibleDate = new Date(regDate)
        eligibleDate.setMonth(eligibleDate.getMonth() + finalRules.minSSMAgeMonths)
        const msRemaining = eligibleDate.getTime() - now.getTime()
        const monthsRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24 * 30.4375))
        haulCriterion.monthsRemaining = monthsRemaining
        haulCriterion.eligibleFromDate = eligibleDate.toISOString()
      }

      criteria.push(haulCriterion)
    }
  } else {
    criteria.push({
      name: 'Status SSM Aktif',
      passed: false,
      actual: 'N/A',
      required: 'Aktif',
    })
    criteria.push({
      name: 'Haul Perniagaan',
      passed: false,
      actual: 'N/A',
      required: `>= ${finalRules.minSSMAgeMonths} bulan`,
    })
  }

  const bumiPassed = input.isBumiputera && (ssmResult.isBumiputera !== false)
  criteria.push({
    name: 'Status Bumiputera',
    passed: bumiPassed,
    actual: bumiPassed ? 'Bumiputera' : 'Bukan Bumiputera / Bercampur',
    required: 'Pemilik Bumiputera sahaja',
  })

  const agePassed = input.ownerAge >= finalRules.minOwnerAge && input.ownerAge <= finalRules.maxOwnerAge
  criteria.push({
    name: 'Had Umur Pemohon',
    passed: agePassed,
    actual: `${input.ownerAge} tahun`,
    required: `${finalRules.minOwnerAge} - ${finalRules.maxOwnerAge} tahun`,
  })

  const uploadedDocTypes = input.documents.map((d) => d.doc_type)
  const missingDocs = finalRules.requiredDocTypes.filter((docType: string) => !uploadedDocTypes.includes(docType))
  const docsPassed = missingDocs.length === 0

  criteria.push({
    name: 'Dokumen Mandatori',
    passed: docsPassed,
    actual: docsPassed ? 'Lengkap' : `Kurang: ${missingDocs.join(', ')}`,
    required: finalRules.requiredDocTypes.join(', '),
  })

  const allPassed = criteria.every((c) => c.passed)

  let status: EligibilityResult['status'] = 'LULUS'
  let reason = 'Semua kriteria kelayakan pembiayaan MARA dipenuhi.'

  if (!allPassed) {
    const onlyDocsMissing = criteria.every((c) => c.name === 'Dokumen Mandatori' || c.passed)
    if (onlyDocsMissing) {
      status = 'PERLU_TINDAKAN'
      reason = 'Permohonan ditangguhkan kerana terdapat dokumen mandatori yang belum dimuat naik.'
    } else {
      status = 'TIDAK_LULUS'
      const failedCriteriaNames = criteria.filter((c) => !c.passed).map((c) => c.name)
      reason = `Gagal memenuhi kriteria pembiayaan MARA: ${failedCriteriaNames.join(', ')}.`
    }
  }

  return {
    eligible: allPassed,
    status,
    reason,
    criteria,
  }
}
