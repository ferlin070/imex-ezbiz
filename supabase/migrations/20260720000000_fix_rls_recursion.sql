-- =========================================================================
-- Migration: Fix RLS Infinite Recursion + Cleanup
-- Version: 20260720000000
-- Author: Antigravity (requested by Kaihara)
-- Purpose:
--   R1: Fix potential infinite recursion in "Allow staff profiles read" policy
--       by introducing a SECURITY DEFINER helper function (is_staff).
--       The original policy had a self-referencing subquery on the profiles table
--       inside a policy ON profiles — PostgreSQL can detect this as infinite recursion.
--   Cleanup: Fix "Allow staff schedule select" which also had the same self-reference.
-- IMPORTANT: Review carefully before applying to production.
--            Apply AFTER 20260719000000_security_fixes.sql
-- =========================================================================

-- =========================================================================
-- Step 1: Create SECURITY DEFINER helper function
-- This function runs as the table owner (bypasses RLS), so it can safely
-- query profiles without triggering the recursion.
-- =========================================================================

CREATE OR REPLACE FUNCTION is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = uid
      AND role IN ('admin', 'mara_officer')
  );
$$;

-- Grant execute to authenticated users (needed for RLS policy evaluation)
GRANT EXECUTE ON FUNCTION is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_staff(uuid) TO service_role;

-- =========================================================================
-- Step 2: Fix "Allow staff profiles read" — drop old recursive policy,
--         replace with one that uses is_staff() function
-- =========================================================================

DROP POLICY IF EXISTS "Allow staff profiles read" ON profiles;

CREATE POLICY "Allow staff profiles read"
  ON profiles FOR SELECT
  USING (is_staff(auth.uid()));

-- =========================================================================
-- Step 3: Fix "Allow staff schedule select" on loan_repayment_schedules
--         (same self-reference pattern via profiles)
-- =========================================================================

DROP POLICY IF EXISTS "Allow staff schedule select" ON loan_repayment_schedules;

CREATE POLICY "Allow staff schedule select"
  ON loan_repayment_schedules FOR SELECT
  USING (is_staff(auth.uid()));

-- =========================================================================
-- Step 4: Fix similar pattern in ai_reports (if exists)
-- =========================================================================

DROP POLICY IF EXISTS "Allow staff ai_reports read" ON ai_reports;

CREATE POLICY "Allow staff ai_reports read"
  ON ai_reports FOR SELECT
  USING (is_staff(auth.uid()));

-- =========================================================================
-- Verification query (run separately after applying):
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('profiles', 'loan_repayment_schedules', 'ai_reports')
-- ORDER BY tablename, policyname;
-- =========================================================================
