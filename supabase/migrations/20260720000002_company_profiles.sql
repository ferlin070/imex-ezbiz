-- =========================================================================
-- Migration: Company Profiles Table + Products Restructure
-- Version: 20260720000002
-- Author: Antigravity (requested by Kaihara)
-- Purpose:
--   Fasa B: Separate "company identity" (1:1 per user) from
--           "products/innovations" (many per user) so usahawan only
--           needs to fill company info ONCE, then register multiple products.
--
-- Strategy: ADDITIVE only — no DROP on existing columns.
--   - New table: company_profiles (1:1 with auth.users)
--   - Add FK column: projects.company_profile_id
--   - Backfill: migrate existing business_profiles data → company_profiles
--
-- IMPORTANT:
--   1. Apply AFTER 20260720000000_fix_rls_recursion.sql (needs is_staff())
--   2. Run this in TWO steps: first the DDL, then the backfill section below.
--   3. Review backfill output before committing to production.
-- =========================================================================

-- =========================================================================
-- STEP 1: Create company_profiles table (1 per usahawan)
-- =========================================================================

CREATE TABLE IF NOT EXISTS company_profiles (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id    uuid        REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  business_name    text        NOT NULL,
  ssm_number       text,
  ssm_registered   boolean     DEFAULT true,
  entity_type      text        DEFAULT 'milikan_tunggal',
  operating_since  date,
  address          text,
  state            text,
  district         text,
  owner_full_name  text        NOT NULL,
  owner_ic_number  text        NOT NULL,
  is_bumiputera    boolean     NOT NULL DEFAULT true,
  owner_age        int,
  phone            text        NOT NULL,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_profiles_owner ON company_profiles(owner_user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_company_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER trg_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW EXECUTE FUNCTION update_company_profiles_updated_at();

-- RLS
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner company_profiles all"
  ON company_profiles FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Staff company_profiles read"
  ON company_profiles FOR SELECT
  USING (is_staff(auth.uid()));

-- =========================================================================
-- STEP 2: Add company_profile_id FK to projects table (nullable for backcompat)
-- =========================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS company_profile_id uuid REFERENCES company_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_company_profile_id ON projects(company_profile_id);

-- =========================================================================
-- STEP 3: Idempotent backfill — migrate existing business_profiles data
--         into company_profiles for users who already have projects.
--
--         Uses DISTINCT ON (owner_user_id) to pick ONE business_profiles row
--         per user (the most recently created project's profile).
--         ON CONFLICT (owner_user_id) DO NOTHING = idempotent/re-runnable.
-- =========================================================================

INSERT INTO company_profiles (
  owner_user_id,
  business_name,
  ssm_number,
  ssm_registered,
  entity_type,
  operating_since,
  owner_full_name,
  owner_ic_number,
  is_bumiputera,
  owner_age,
  phone
)
SELECT DISTINCT ON (p.owner_user_id)
  p.owner_user_id,
  COALESCE(bp.business_name, p.title, 'Perniagaan Tanpa Nama'),
  bp.ssm_number,
  COALESCE(bp.ssm_registered, true),
  COALESCE(bp.entity_type, 'milikan_tunggal'),
  bp.operating_since,
  COALESCE(bp.owner_full_name, 'TIDAK_DIISI'),
  COALESCE(bp.owner_ic_number, 'TIDAK_DIISI'),
  COALESCE(bp.is_bumiputera, true),
  bp.owner_age,
  COALESCE(bp.phone, '0000000000')
FROM projects p
LEFT JOIN business_profiles bp ON bp.project_id = p.id
ORDER BY p.owner_user_id, p.created_at DESC
ON CONFLICT (owner_user_id) DO NOTHING;

-- =========================================================================
-- STEP 4: Update projects.company_profile_id from the backfill
-- =========================================================================

UPDATE projects p
SET company_profile_id = cp.id
FROM company_profiles cp
WHERE cp.owner_user_id = p.owner_user_id
  AND p.company_profile_id IS NULL;

-- =========================================================================
-- Verification (run after applying):
-- SELECT COUNT(*) FROM company_profiles;
-- SELECT COUNT(*) FROM projects WHERE company_profile_id IS NOT NULL;
-- SELECT owner_user_id, business_name FROM company_profiles LIMIT 10;
-- =========================================================================
