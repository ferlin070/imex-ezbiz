export interface SSMVerifyResult {
  registered: boolean
  businessName?: string
  status?: 'active' | 'expired'
  registrationDate?: string // ISO format
  isBumiputera?: boolean
}

/**
 * Verify SSM registration.
 *
 * In production, this function should call the official MySSM / SSM API.
 * Until that integration is live, it uses the data stored in company_profiles
 * (ssm_number, operating_since, is_bumiputera) which the entrepreneur filled in.
 *
 * @param ssmNumber  SSM number as entered by the entrepreneur
 * @param opts.registrationDate  operating_since date from company_profiles (ISO string or Date)
 * @param opts.isBumiputera      is_bumiputera flag from company_profiles
 */
export async function verifySSM(
  ssmNumber: string,
  opts?: { registrationDate?: string | Date | null; isBumiputera?: boolean }
): Promise<SSMVerifyResult> {
  const normalized = ssmNumber.trim().toUpperCase()

  // ─── Dev / Test stubs (remove when real API is connected) ─────────────
  if (normalized === 'SSM-TEST-HAUL') {
    const registrationDate = new Date()
    registrationDate.setMonth(registrationDate.getMonth() - 3)
    return {
      registered: true,
      businessName: 'Inovasi Baru Enterprise',
      status: 'active',
      registrationDate: registrationDate.toISOString().split('T')[0],
      isBumiputera: true,
    }
  }

  if (normalized === 'SSM-TEST-EXPIRED') {
    const registrationDate = new Date()
    registrationDate.setFullYear(registrationDate.getFullYear() - 2)
    return {
      registered: true,
      businessName: 'Expired Tekno Enterprise',
      status: 'expired',
      registrationDate: registrationDate.toISOString().split('T')[0],
      isBumiputera: true,
    }
  }

  if (normalized === 'SSM-TEST-NONBUMI') {
    const registrationDate = new Date()
    registrationDate.setFullYear(registrationDate.getFullYear() - 3)
    return {
      registered: true,
      businessName: 'Global Tech Solution',
      status: 'active',
      registrationDate: registrationDate.toISOString().split('T')[0],
      isBumiputera: false,
    }
  }

  if (normalized === 'TIDAK_DIISI' || normalized === 'SSM-NOT-FOUND' || !normalized) {
    return { registered: false }
  }
  // ─── End of dev stubs ────────────────────────────────────────────────

  // Real path: Use data from company_profiles (entrepreneur self-declared)
  // When MySSM API is available, replace this block with the real API call.
  const regDate = opts?.registrationDate
    ? new Date(opts.registrationDate).toISOString().split('T')[0]
    : undefined

  return {
    registered: true,
    status: 'active',
    registrationDate: regDate,
    isBumiputera: opts?.isBumiputera ?? true,
  }
}
