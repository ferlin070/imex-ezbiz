import { test } from 'node:test'
import assert from 'node:assert'
import { calculateFeasibility, Criterion, Score } from '../lib/feasibility'

const mockCriteria: Criterion[] = [
  { id: 'c1', code: 'A', label: 'Persembahan', max_score: 65, weight: 1.5 },
  { id: 'c2', code: 'B', label: 'Semangat Berpasukan', max_score: 40, weight: 1.0 },
  { id: 'c3', code: 'C', label: 'Idea Boleh Dipasarkan', max_score: 65, weight: 2.0 },
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
  assert.strictEqual(result.criteriaBreakdown.length, 3)
  assert.strictEqual(result.criteriaBreakdown[0].average, 0)
  assert.strictEqual(result.criteriaBreakdown[0].percentage, 0)
})

test('calculateFeasibility - Single judge, perfect score', () => {
  const scores: Score[] = [
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c1', score: 65 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c2', score: 40 },
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c3', score: 65 },
  ]
  const result = calculateFeasibility(scores, mockCriteria)
  assert.strictEqual(result.score, 100)
  assert.strictEqual(result.tier, 'Sangat Berpotensi')
  assert.strictEqual(result.criteriaBreakdown[0].percentage, 100)
})

test('calculateFeasibility - Multiple judges with weighted scores (Statistical Calculation)', () => {
  const scores: Score[] = [
    // Judge 1
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c1', score: 52 },      // 52/65 = 80%
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c2', score: 30 },      // 30/40 = 75%
    { project_id: 'p1', judge_id: 'j1', criteria_id: 'c3', score: 45.5 },    // 45.5/65 = 70%

    // Judge 2
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c1', score: 58.5 },    // 58.5/65 = 90% (avg = 85%)
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c2', score: 34 },      // 34/40 = 85%  (avg = 80%)
    { project_id: 'p1', judge_id: 'j2', criteria_id: 'c3', score: 52 },      // 52/65 = 80%  (avg = 75%)
  ]

  // Expected computation:
  // Avg A: (52+58.5)/2 = 55.25 (85%)
  // Avg B: (30+34)/2 = 32 (80%)
  // Avg C: (45.5+52)/2 = 48.75 (75%)
  // Weighted Ratio: (0.85 * 1.5) + (0.80 * 1.0) + (0.75 * 2.0) = 1.275 + 0.80 + 1.50 = 3.575
  // Total Weights: 1.5 + 1.0 + 2.0 = 4.5
  // Final Score: 3.575 / 4.5 * 100 = 79.4444...% -> rounded to 79.4%
  // Tier: "Layak Komersial"

  const result = calculateFeasibility(scores, mockCriteria)
  assert.strictEqual(result.score, 79.4)
  assert.strictEqual(result.tier, 'Layak Komersial')
  
  assert.strictEqual(result.criteriaBreakdown[0].average, 55.3)
  assert.strictEqual(result.criteriaBreakdown[0].percentage, 85)

  assert.strictEqual(result.criteriaBreakdown[1].average, 32)
  assert.strictEqual(result.criteriaBreakdown[1].percentage, 80)

  assert.strictEqual(result.criteriaBreakdown[2].average, 48.8)
  assert.strictEqual(result.criteriaBreakdown[2].percentage, 75)
})
