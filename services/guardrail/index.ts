import { getGuardrailBlockedTerms } from '../../apps/web/lib/config'

export interface GuardrailResult {
  passed: boolean
  cleanText: string
  blockedReason?: string
}

export async function runGuardrail(text: string): Promise<GuardrailResult> {
  const blockedTerms = await getGuardrailBlockedTerms()

  const forbiddenPatterns = blockedTerms.map((term) => new RegExp(`\\b${term.replace(/\s+/g, '\\s*')}\\b`, 'i'))

  const hasForbidden = forbiddenPatterns.some((pattern) => pattern.test(text))

  if (hasForbidden) {
    return {
      passed: false,
      blockedReason: 'Penyebutan pembiaya alternatif luar MARA dikesan.',
      cleanText: 'Penyemakan kami hanya membenarkan nasihat bagi skim pembiayaan di bawah ekosistem MARA sahaja. Sila hubungi Pegawai MARA / PMN secara terus untuk bimbingan permohonan selanjutnya.',
    }
  }

  return {
    passed: true,
    cleanText: text,
  }
}
