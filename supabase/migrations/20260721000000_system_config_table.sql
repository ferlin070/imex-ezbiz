-- System Configuration Table
-- Stores all configurable business rules & constants in one place.
-- MARA officers can update values without redeploying the app.

create table if not exists system_config (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz default now()
);

alter table system_config enable row level security;

-- Allow read for all authenticated users
create policy "Allow read system_config"
  on system_config for select
  using (true);

-- Only service_role can insert/update/delete
-- (managed via API or Supabase Dashboard)

-- Seed default configuration
insert into system_config (key, value, description) values
(
  'eligibility_rules',
  '{
    "minSSMAgeMonths": 12,
    "requiredDocTypes": ["ssm_cert", "business_plan"],
    "ssmActiveOnly": true,
    "bumiputeraOnly": true,
    "minOwnerAge": 18,
    "maxOwnerAge": 65
  }'::jsonb,
  'Peraturan kelayakan pembiayaan MARA'
),
(
  'feasibility_tiers',
  '{
    "thresholds": [
      { "min": 80, "label": "Sangat Berpotensi" },
      { "min": 60, "label": "Layak Komersial" },
      { "min": 40, "label": "Berpotensi Sederhana" }
    ],
    "defaultLabel": "Perlu Bimbingan"
  }'::jsonb,
  'Threshold skor kebolehlaksanaan (Biz-Feasibility)'
),
(
  'guardrail_blocked_terms',
  '[
    "tekun", "sme bank", "sme-bank", "bank komersial",
    "maybank", "cimb", "bsn", "public bank", "rhb", "ambank"
  ]'::jsonb,
  'Senarai istilah pesaing yang disekat oleh guardrail'
),
(
  'default_biz_profile',
  '{
    "ownerAge": 30,
    "isBumiputera": true,
    "ssmNumber": "SSM-NOT-FOUND"
  }'::jsonb,
  'Nilai lalai profil perniagaan apabila data tidak lengkap'
),
(
  'self_assessment_scores',
  '{
    "k1_idea": { "A": 20, "B": 14, "C": 8, "D": 2 },
    "k2_innovation": { "A": 30, "B": 20, "C": 12, "D": 4 },
    "k3_impact": { "A": 20, "B": 14, "C": 8, "D": 2 },
    "k4_presentation": { "A": 20, "B": 14, "C": 8, "D": 2 },
    "k5_marketability": { "A": 10, "B": 7, "C": 4, "D": 1 }
  }'::jsonb,
  'Pemarkahan penilaian kendiri usahawan'
),
(
  'ai_report_params',
  '{
    "model": "gemini-2.0-flash",
    "swotItemCount": "3-4",
    "blueprintFases": ["Technical", "Marketing", "Financial"],
    "blueprintStepsPerFasa": 3,
    "pitchDurationSeconds": 60
  }'::jsonb,
  'Parameter laporan AI'
)
on conflict (key) do nothing;
