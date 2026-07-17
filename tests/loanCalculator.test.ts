import test from 'node:test'
import assert from 'node:assert'
import { calculateLoan } from '../lib/loanCalculator'

test('Loan Repayment Calculator - 0% rate division', () => {
  const result = calculateLoan(12000, 0, 12)
  
  assert.strictEqual(result.monthlyInstallment, 1000)
  assert.strictEqual(result.totalRepayment, 12000)
  assert.strictEqual(result.totalProfit, 0)
  assert.strictEqual(result.schedule.length, 12)
  assert.strictEqual(result.schedule[0].principal, 1000)
  assert.strictEqual(result.schedule[11].balance, 0)
})

test('Loan Repayment Calculator - Amortization reducing balance calculation', () => {
  // Amount = RM10,000, annual rate = 6%, tenure = 12 months
  const result = calculateLoan(10000, 6, 12)
  
  // M = 10000 * 0.005 * (1.005)^12 / ((1.005)^12 - 1) = 860.66
  assert.ok(Math.abs(result.monthlyInstallment - 860.66) < 0.1)
  assert.strictEqual(result.schedule.length, 12)
  
  // Total profit should be roughly ~327.97
  assert.ok(Math.abs(result.totalProfit - 327.97) < 0.5)
  assert.strictEqual(result.schedule[11].balance, 0)
})

test('Loan Repayment Calculator - Handles zero/negative inputs', () => {
  const result1 = calculateLoan(0, 5, 24)
  assert.strictEqual(result1.monthlyInstallment, 0)
  assert.strictEqual(result1.schedule.length, 0)

  const result2 = calculateLoan(50000, 5, 0)
  assert.strictEqual(result2.monthlyInstallment, 0)
  assert.strictEqual(result2.schedule.length, 0)
})
