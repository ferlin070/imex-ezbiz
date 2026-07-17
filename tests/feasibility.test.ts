import { test } from 'node:test'
import assert from 'node:assert'
import { calculateFeasibility, Criterion, Score } from '../lib/feasibility'

const mockCriteria: Criterion[] = [
  { id: 'c1', code: 'K1', label: 'Idea (Kreativiti)', max_score: 20, weight: 20 },
  { id: 'c2', code: 'K2', label: 'Hasil Inovasi (Output)', max_score: 30, weight: 30 },
  { id: 'c3', code: 'K3', label: 'Impak (Efisien / Keberkesanan)', max_score: 20, weight: 20 },
  { id: 'c4', code: 'K4', label: 'Impak (Signifikal / Relevan)', max_score: 25, weight: 25 },
  { id: 'c5', code: 'K5', label: 'Pengurusan (Komitmen)', max_score: 5, weight: 5 },
]

test('calculateFeasibility - Empty inputs', () => {
  const result = calculateFeasibility([], [])
  assert.strictEqual(result.score, 0)
  assert.strictEqual(result.tier, 'Perlu Bimbingan')
  assert.deepStrictEqual(result.criteriaBreakdown, [])
})

test('calculateFeasibility - No scores submitted yet', () => {
  const result = calculateFeasibility([], mockCriteria)
  assert.strictEqual(result.score, 0)
  assert.strictEqual(result.tier, 'Perlu Bimbingan')
  assert.strictEqual(result.criteriaBreakdown.length, 5)
  assert.strictEqual(result.criteriaBreakdown[0].average, 0)
  assert.strictEqual(result.criteriaBreakdown[0].percentage, 0)
})

test('calculateFeasibility - Single judge, perfect score', () => {
  const scores: Score[] = [
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c1', score: 20 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c2', score: 30 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c3', score: 20 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c4', score: 25 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c5', score: 5 },
  ]
  const result = calculateFeasibility(scores, mockCriteria)
  assert.strictEqual(result.score, 100)
  assert.strictEqual(result.tier, 'Sangat Berpotensi')
  assert.strictEqual(result.criteriaBreakdown[0].percentage, 100)
})

test('calculateFeasibility - Multiple judges with weighted scores (i-MARATeCH 2021)', () => {
  const scores: Score[] = [
    // Judge 1: Total = 18 + 25 + 17 + 20 + 4 = 84 marks
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c1', score: 18 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c2', score: 25 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c3', score: 17 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c4', score: 20 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c5', score: 4 },

    // Judge 2: Total = 19 + 27 + 18 + 21 + 5 = 90 marks
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c1', score: 19 },
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c2', score: 27 },
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c3', score: 18 },
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c4', score: 21 },
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c5', score: 5 },
  ]

  // Average per criteria:
  // K1: (18+19)/2 = 18.5
  // K2: (25+27)/2 = 26
  // K3: (17+18)/2 = 17.5
  // K4: (20+21)/2 = 20.5
  // K5: (4+5)/2 = 4.5
  // Total Average = 18.5 + 26 + 17.5 + 20.5 + 4.5 = 87 marks (out of 100) -> 87%
  // Tier: "Sangat Berpotensi" (since score >= 80)

  const result = calculateFeasibility(scores, mockCriteria)
  assert.strictEqual(result.score, 87)
  assert.strictEqual(result.tier, 'Sangat Berpotensi')
  
  assert.strictEqual(result.criteriaBreakdown[0].average, 18.5)
  assert.strictEqual(result.criteriaBreakdown[0].percentage, 92.5) // 18.5 / 20 * 100

  assert.strictEqual(result.criteriaBreakdown[1].average, 26)
  assert.strictEqual(result.criteriaBreakdown[1].percentage, 86.7) // 26 / 30 * 100

  assert.strictEqual(result.criteriaBreakdown[2].average, 17.5)
  assert.strictEqual(result.criteriaBreakdown[2].percentage, 87.5) // 17.5 / 20 * 100

  assert.strictEqual(result.criteriaBreakdown[3].average, 20.5)
  assert.strictEqual(result.criteriaBreakdown[3].percentage, 82)   // 20.5 / 25 * 100

  assert.strictEqual(result.criteriaBreakdown[4].average, 4.5)
  assert.strictEqual(result.criteriaBreakdown[4].percentage, 90)   // 4.5 / 5 * 100
})
