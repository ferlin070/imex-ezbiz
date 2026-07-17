import * as fs from 'fs'
import * as path from 'path'
import { verifySSM } from '../integration/ssm'

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
}

export interface EligibilityResult {
  eligible: boolean
  status: 'LULUS' | 'TIDAK_LULUS' | 'PERLU_TINDAKAN'
  reason: string
  criteria: CriterionResult[]
}

export async function evaluateEligibility(input: EligibilityInput): Promise<EligibilityResult> {
  // 1. Load configuration rules
  const configPath = path.join(process.cwd(), 'data/criteria-config/rules.json')
  const rules = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  const criteria: CriterionResult[] = []

  // 2. Fetch SSM Verification
  const ssmResult = await verifySSM(input.ssmNumber)

  // 3. Evaluate criteria

  // a. Registration check
  const ssmRegistered = ssmResult.registered
  criteria.push({
    name: 'Pendaftaran SSM',
    passed: ssmRegistered,
    actual: ssmRegistered ? 'Berdaftar' : 'Tiada dalam rekod',
    required: 'Berdaftar dengan SSM',
  })

  // b. SSM Status check
  if (ssmRegistered) {
    const ssmActive = ssmResult.status === 'active'
    criteria.push({
      name: 'Status SSM Aktif',
      passed: ssmActive,
      actual: ssmResult.status === 'active' ? 'Aktif' : 'Tamat Tempoh/Tidak Aktif',
      required: 'Aktif',
    })

    // c. Haul / Business Age check
    if (ssmResult.registrationDate) {
      const regDate = new Date(ssmResult.registrationDate)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - regDate.getTime())
      const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.4375))
      const haulPassed = diffMonths >= rules.minSSMAgeMonths

      criteria.push({
        name: 'Haul Perniagaan',
        passed: haulPassed,
        actual: `${diffMonths} bulan`,
        required: `>= ${rules.minSSMAgeMonths} bulan`,
      })
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
      required: `>= ${rules.minSSMAgeMonths} bulan`,
    })
  }

  // d. Bumiputera check
  const bumiPassed = input.isBumiputera && (ssmResult.isBumiputera !== false)
  criteria.push({
    name: 'Status Bumiputera',
    passed: bumiPassed,
    actual: bumiPassed ? 'Bumiputera' : 'Bukan Bumiputera / Bercampur',
    required: 'Pemilik Bumiputera sahaja',
  })

  // e. Owner Age check
  const agePassed = input.ownerAge >= rules.minOwnerAge && input.ownerAge <= rules.maxOwnerAge
  criteria.push({
    name: 'Had Umur Pemohon',
    passed: agePassed,
    actual: `${input.ownerAge} tahun`,
    required: `${rules.minOwnerAge} - ${rules.maxOwnerAge} tahun`,
  })

  // f. Document completeness check
  const uploadedDocTypes = input.documents.map((d) => d.doc_type)
  const missingDocs = rules.requiredDocTypes.filter((docType: string) => !uploadedDocTypes.includes(docType))
  const docsPassed = missingDocs.length === 0

  criteria.push({
    name: 'Dokumen Mandatori',
    passed: docsPassed,
    actual: docsPassed ? 'Lengkap' : `Kurang: ${missingDocs.join(', ')}`,
    required: rules.requiredDocTypes.join(', '),
  })

  // 4. Summarize results
  const allPassed = criteria.every((c) => c.passed)
  
  let status: EligibilityResult['status'] = 'LULUS'
  let reason = 'Semua kriteria kelayakan pembiayaan MARA dipenuhi.'

  if (!allPassed) {
    // If only document is missing, it's PERLU_TINDAKAN (needs upload)
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
