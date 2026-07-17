export interface RepaymentScheduleItem {
  month: number
  installment: number
  principal: number
  profit: number
  balance: number
}

export interface LoanCalculationResult {
  monthlyInstallment: number
  totalRepayment: number
  totalProfit: number
  schedule: RepaymentScheduleItem[]
}

/**
 * Calculates the monthly amortization payment and generates a detailed reducing-balance repayment schedule.
 * Uses standard formula: M = P * r * (1 + r)^n / ((1 + r)^n - 1)
 */
export function calculateLoan(
  amount: number,
  annualRate: number,
  tenureMonths: number
): LoanCalculationResult {
  if (amount <= 0 || tenureMonths <= 0) {
    return { monthlyInstallment: 0, totalRepayment: 0, totalProfit: 0, schedule: [] }
  }

  // Monthly interest/profit rate
  const monthlyRate = annualRate / 12 / 100

  let monthlyInstallment = 0

  if (monthlyRate === 0) {
    monthlyInstallment = amount / tenureMonths
  } else {
    monthlyInstallment =
      (amount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
  }

  // Round monthly installment to 2 decimal places
  monthlyInstallment = parseFloat(monthlyInstallment.toFixed(2))

  const schedule: RepaymentScheduleItem[] = []
  let balance = amount
  let totalProfit = 0

  for (let month = 1; month <= tenureMonths; month++) {
    let profit = balance * monthlyRate
    profit = parseFloat(profit.toFixed(2))

    let principal = monthlyInstallment - profit
    principal = parseFloat(principal.toFixed(2))

    // Handle last month rounding adjust
    if (month === tenureMonths) {
      principal = balance
      monthlyInstallment = principal + profit
      balance = 0
    } else {
      balance = balance - principal
      balance = parseFloat(balance.toFixed(2))
    }

    totalProfit += profit

    schedule.push({
      month,
      installment: parseFloat(monthlyInstallment.toFixed(2)),
      principal: parseFloat(principal.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
    })
  }

  const totalRepayment = parseFloat((amount + totalProfit).toFixed(2))

  return {
    monthlyInstallment,
    totalRepayment,
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    schedule,
  }
}
