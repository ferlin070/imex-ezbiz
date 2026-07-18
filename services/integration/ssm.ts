export interface SSMVerifyResult {
  registered: boolean
  businessName?: string
  status?: 'active' | 'expired'
  registrationDate?: string // ISO format
  isBumiputera?: boolean
}

export async function verifySSM(ssmNumber: string): Promise<SSMVerifyResult> {
  const normalized = ssmNumber.trim().toUpperCase()

  // Pre-configured mocks for testing logic
  if (normalized === 'SSM-12345-UNDERHAUL') {
    const registrationDate = new Date()
    registrationDate.setMonth(registrationDate.getMonth() - 3) // 3 months ago
    return {
      registered: true,
      businessName: 'Inovasi Baru Enterprise',
      status: 'active',
      registrationDate: registrationDate.toISOString().split('T')[0],
      isBumiputera: true,
    }
  }

  if (normalized === 'SSM-12345-EXPIRED') {
    const registrationDate = new Date()
    registrationDate.setFullYear(registrationDate.getFullYear() - 2) // 2 years ago
    return {
      registered: true,
      businessName: 'Expired Tekno Enterprise',
      status: 'expired',
      registrationDate: registrationDate.toISOString().split('T')[0],
      isBumiputera: true,
    }
  }

  if (normalized === 'SSM-12345-NONBUMI') {
    const registrationDate = new Date()
    registrationDate.setFullYear(registrationDate.getFullYear() - 3) // 3 years ago
    return {
      registered: true,
      businessName: 'Global Tech Solution',
      status: 'active',
      registrationDate: registrationDate.toISOString().split('T')[0],
      isBumiputera: false,
    }
  }

  if (normalized === 'SSM-NOT-FOUND') {
    return {
      registered: false,
    }
  }

  // Default fallback: registered but with SHORT age to test real validation
  const defaultDate = new Date()
  defaultDate.setFullYear(defaultDate.getFullYear() - 10) // 10 years ago
  return {
    registered: true,
    businessName: 'Unknown Enterprise',
    status: 'active',
    registrationDate: defaultDate.toISOString().split('T')[0],
    isBumiputera: true,
  }
}
