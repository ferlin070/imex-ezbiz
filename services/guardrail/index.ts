export interface GuardrailResult {
  passed: boolean
  cleanText: string
  blockedReason?: string
}

export function runGuardrail(text: string): GuardrailResult {
  const forbiddenPatterns = [
    /\btekun\b/i,
    /\bsme\s*bank\b/i,
    /\bsme-bank\b/i,
    /\bbank\s*komersial\b/i,
    /\bmaybank\b/i,
    /\bcimb\b/i,
    /\bbsn\b/i,
    /\bpublic\s*bank\b/i,
    /\brhb\b/i,
    /\bambank\b/i
  ]

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
