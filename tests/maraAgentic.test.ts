import { test } from 'node:test'
import assert from 'node:assert'
import { verifySSM } from '../services/integration/ssm'
import { evaluateEligibility } from '../services/eligibility-engine'
import { runGuardrail } from '../services/guardrail'

test('SSM Integration Mock Tests', async (t) => {
  await t.test('SSM-12345-UNDERHAUL registration date is exactly 3 months ago', async () => {
    const res = await verifySSM('SSM-12345-UNDERHAUL')
    assert.strictEqual(res.registered, true)
    assert.strictEqual(res.status, 'active')
    assert.ok(res.registrationDate)
    
    const regDate = new Date(res.registrationDate)
    const diffMonths = Math.floor((new Date().getTime() - regDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375))
    assert.strictEqual(diffMonths, 3)
  })

  await t.test('SSM-NOT-FOUND registers false', async () => {
    const res = await verifySSM('SSM-NOT-FOUND')
    assert.strictEqual(res.registered, false)
  })
})

test('Eligibility Engine Rules Validation Tests', async (t) => {
  await t.test('Eligible profiles pass rules checks', async () => {
    const result = await evaluateEligibility({
      ssmNumber: 'SSM-12345-ACTIVE', // Default falls back to 2 years ago (under haul limit of 12m)
      ownerAge: 25,
      isBumiputera: true,
      documents: [{ doc_type: 'ssm_cert' }, { doc_type: 'business_plan' }],
    })

    assert.strictEqual(result.eligible, true)
    assert.strictEqual(result.status, 'LULUS')
  })

  await t.test('Profile under haul fails criteria and returns TIDAK_LULUS', async () => {
    const result = await evaluateEligibility({
      ssmNumber: 'SSM-12345-UNDERHAUL', // 3 months old registration
      ownerAge: 30,
      isBumiputera: true,
      documents: [{ doc_type: 'ssm_cert' }, { doc_type: 'business_plan' }],
    })

    assert.strictEqual(result.eligible, false)
    assert.strictEqual(result.status, 'TIDAK_LULUS')
    const haul = result.criteria.find((c) => c.name === 'Haul Perniagaan')
    assert.ok(haul)
    assert.strictEqual(haul.passed, false)
  })

  await t.test('Missing compulsory documents triggers PERLU_TINDAKAN status', async () => {
    const result = await evaluateEligibility({
      ssmNumber: 'SSM-12345-ACTIVE',
      ownerAge: 40,
      isBumiputera: true,
      documents: [{ doc_type: 'ssm_cert' }], // Missing business_plan
    })

    assert.strictEqual(result.eligible, false)
    assert.strictEqual(result.status, 'PERLU_TINDAKAN')
  })
})

test('Post-Processing Domain Guardrail Tests', async (t) => {
  await t.test('Blocks competitor financing mentions (TEKUN) and replaces output with standard MARA response', async () => {
    const result = await runGuardrail('Sila mohon dana alternatif daripada TEKUN Nasional.')
    assert.strictEqual(result.passed, false)
    assert.ok(result.cleanText.includes('ekosistem MARA sahaja'))
    assert.ok(result.cleanText.includes('Pegawai MARA'))
  })

  await t.test('Blocks SME Bank financing suggestions', async () => {
    const result = await runGuardrail('Anda boleh menghubungi SME Bank untuk khidmat pembiayaan tambahan.')
    assert.strictEqual(result.passed, false)
    assert.ok(result.cleanText.includes('ekosistem MARA sahaja'))
  })

  await t.test('Passes valid domain-locked MARA content', async () => {
    const validAdvice = 'Anda disarankan memohon Skim Pembiayaan SPIKE di bawah MARA.'
    const result = await runGuardrail(validAdvice)
    assert.strictEqual(result.passed, true)
    assert.strictEqual(result.cleanText, validAdvice)
  })
})
