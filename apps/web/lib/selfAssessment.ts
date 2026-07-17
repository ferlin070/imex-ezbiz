export interface SelfAssessmentResponses {
  k1_idea: 'A' | 'B' | 'C' | 'D'
  k2_innovation: 'A' | 'B' | 'C' | 'D'
  k3_impact: 'A' | 'B' | 'C' | 'D'
  k4_presentation: 'A' | 'B' | 'C' | 'D'
  k5_marketability: 'A' | 'B' | 'C' | 'D'
}

export interface SelfAssessmentResult {
  score: number
  tier: 'Sangat Berpotensi' | 'Layak Komersial' | 'Berpotensi Sederhana' | 'Perlu Bimbingan'
  breakdown: {
    criteriaCode: string
    label: string
    score: number
    maxScore: number
  }[]
}

const SCORE_MAPPING = {
  k1_idea: { A: 20, B: 14, C: 8, D: 2 },
  k2_innovation: { A: 30, B: 20, C: 12, D: 4 },
  k3_impact: { A: 20, B: 14, C: 8, D: 2 },
  k4_presentation: { A: 20, B: 14, C: 8, D: 2 },
  k5_marketability: { A: 10, B: 7, C: 4, D: 1 }
}

const LABELS = {
  k1_idea: { code: 'K1', label: 'Idea (Kreativiti)', max: 20 },
  k2_innovation: { code: 'K2', label: 'Hasil Inovasi (Output)', max: 30 },
  k3_impact: { code: 'K3', label: 'Impak (Efisien/Keberkesanan)', max: 20 },
  k4_presentation: { code: 'K4', label: 'Persembahan & Pitching', max: 20 },
  k5_marketability: { code: 'K5', label: 'Kebolehpasaran (USP)', max: 10 }
}

/**
 * Computes the Self-Assessment Feasibility Score based on entrepreneur responses.
 * Sums up mapped points from multiple-choice questions to get the final score percentage (0-100%).
 */
export function calculateSelfAssessment(responses: Partial<SelfAssessmentResponses>): SelfAssessmentResult {
  let totalScore = 0

  const breakdown = Object.keys(LABELS).map((key) => {
    const field = key as keyof typeof LABELS
    const userChoice = (responses[field] || 'D') as 'A' | 'B' | 'C' | 'D'
    const points = SCORE_MAPPING[field][userChoice] || 0
    totalScore += points

    return {
      criteriaCode: LABELS[field].code,
      label: LABELS[field].label,
      score: points,
      maxScore: LABELS[field].max
    }
  })

  // Since total maximum points = 100, the sum itself is the percentage score (0-100)
  const score = totalScore

  let tier: SelfAssessmentResult['tier'] = 'Perlu Bimbingan'
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
    breakdown
  }
}
