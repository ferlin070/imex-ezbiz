export interface Criterion {
  id: string
  code: string
  label: string
  max_score: number
  weight: number
}

export interface Score {
  project_id: string
  judge_id: string
  criteria_id: string
  score: number
}

export interface FeasibilityResult {
  score: number
  tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan'
  criteriaBreakdown: {
    criteriaId: string
    code: string
    label: string
    average: number
    percentage: number
  }[]
}

/**
 * Calculates the Biz-Feasibility Score and maps to a performance tier.
 * Formula:
 * feasibility_score (%) = ( Σ (avg_skor_kriteria / max_score_kriteria * weight) / Σ weight ) * 100
 */
export function calculateFeasibility(
  scores: Score[],
  criteria: Criterion[]
): FeasibilityResult {
  if (criteria.length === 0) {
    return {
      score: 0,
      tier: 'Perlu Bimbingan',
      criteriaBreakdown: [],
    }
  }

  let totalWeightedRatioSum = 0
  let totalWeightSum = 0

  const criteriaBreakdown = criteria.map((c) => {
    // Filter scores for this specific criterion
    const critScores = scores.filter((s) => s.criteria_id === c.id)

    // Calculate average score across judges
    const avgScore =
      critScores.length > 0
        ? critScores.reduce((sum, s) => sum + Number(s.score), 0) / critScores.length
        : 0

    const maxScore = Number(c.max_score) || 1
    const weight = Number(c.weight) || 1

    // Ratio of average score relative to max score (0.0 to 1.0)
    const ratio = avgScore / maxScore
    
    totalWeightedRatioSum += ratio * weight
    totalWeightSum += weight

    const percentage = ratio * 100

    return {
      criteriaId: c.id,
      code: c.code,
      label: c.label,
      average: Number(avgScore.toFixed(1)),
      percentage: Number(percentage.toFixed(1)),
    }
  })

  const finalScoreRaw = totalWeightSum > 0 ? (totalWeightedRatioSum / totalWeightSum) * 100 : 0
  const score = Number(finalScoreRaw.toFixed(1))

  let tier: FeasibilityResult['tier'] = 'Perlu Bimbingan'
  if (score >= 80) {
    tier = 'Sangat Berpotensi'
  } else if (score >= 60) {
    tier = 'Layak Komersial'
  } else if (score >= 40) {
    tier = 'Berpotensi Sederhana'
  }

  return {
    score,
    tier,
    criteriaBreakdown,
  }
}
