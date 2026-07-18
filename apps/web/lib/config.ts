import { createAdminClient } from './supabase/server'

// ---------------------------------------------------------------------------
// SYSTEM CONFIG — reads from DB (system_config table) with fallback chain:
//   DB → environment variable → hardcoded default
// ---------------------------------------------------------------------------

const configDefaults = {
  eligibility_rules: {
    minSSMAgeMonths: 12,
    requiredDocTypes: ['ssm_cert', 'business_plan'],
    ssmActiveOnly: true,
    bumiputeraOnly: true,
    minOwnerAge: 18,
    maxOwnerAge: 65,
  },
  feasibility_tiers: {
    thresholds: [
      { min: 80, label: 'Sangat Berpotensi' },
      { min: 60, label: 'Layak Komersial' },
      { min: 40, label: 'Berpotensi Sederhana' },
    ],
    defaultLabel: 'Perlu Bimbingan',
  },
  guardrail_blocked_terms: [
    'tekun', 'sme bank', 'sme-bank', 'bank komersial',
    'maybank', 'cimb', 'bsn', 'public bank', 'rhb', 'ambank',
  ],
  default_biz_profile: {
    ownerAge: 30,
    isBumiputera: true,
    ssmNumber: 'SSM-NOT-FOUND',
  },
  self_assessment_scores: {
    k1_idea: { A: 20, B: 14, C: 8, D: 2 },
    k2_innovation: { A: 30, B: 20, C: 12, D: 4 },
    k3_impact: { A: 20, B: 14, C: 8, D: 2 },
    k4_presentation: { A: 20, B: 14, C: 8, D: 2 },
    k5_marketability: { A: 10, B: 7, C: 4, D: 1 },
  },
  ai_report_params: {
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    swotItemCount: '3-4',
    blueprintFases: ['Technical', 'Marketing', 'Financial'],
    blueprintStepsPerFasa: 3,
    pitchDurationSeconds: 60,
  },
} as const

export type ConfigKey = keyof typeof configDefaults

// In-memory cache (resets per request in serverless, but avoids repeated DB calls within one request)
let cache: Record<string, unknown> | null = null

async function loadAll(): Promise<Record<string, unknown>> {
  if (cache) return cache
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.from('system_config').select('key, value')
    if (error || !data) throw error
    const map: Record<string, unknown> = {}
    for (const row of data) {
      map[row.key] = row.value
    }
    cache = map
    return map
  } catch {
    return {}
  }
}

export function clearConfigCache() {
  cache = null
}

export async function getConfig<T = unknown>(key: ConfigKey): Promise<T> {
  const dbConfig = await loadAll()
  return (dbConfig[key] ?? configDefaults[key]) as T
}

// Convenience accessors
export async function getEligibilityRules() {
  return getConfig<typeof configDefaults.eligibility_rules>('eligibility_rules')
}

export async function getFeasibilityTier(score: number): Promise<string> {
  const config = await getConfig<typeof configDefaults.feasibility_tiers>('feasibility_tiers')
  for (const t of config.thresholds) {
    if (score >= t.min) return t.label
  }
  return config.defaultLabel
}

export async function getGuardrailBlockedTerms(): Promise<string[]> {
  return getConfig<string[]>('guardrail_blocked_terms')
}

export async function getDefaultBizProfile() {
  return getConfig<typeof configDefaults.default_biz_profile>('default_biz_profile')
}

export async function getSelfAssessmentScores() {
  return getConfig<typeof configDefaults.self_assessment_scores>('self_assessment_scores')
}

export async function getAiReportParams() {
  return getConfig<typeof configDefaults.ai_report_params>('ai_report_params')
}
