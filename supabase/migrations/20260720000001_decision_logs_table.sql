-- =========================================================================
-- Migration: Decision Logs Table (Audit Trail)
-- Version: 20260720000001
-- Author: Antigravity (requested by Kaihara)
-- Purpose:
--   A1: Create decision_logs table to replace fs.writeFileSync audit logs
--       which fail silently on Vercel serverless (read-only filesystem).
--       This provides a persistent, queryable audit trail for compliance.
-- IMPORTANT: Apply AFTER 20260720000000_fix_rls_recursion.sql
--            (depends on is_staff() function)
-- =========================================================================

CREATE TABLE IF NOT EXISTS decision_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id     uuid        REFERENCES projects(id) ON DELETE SET NULL,
  loan_product_id uuid,
  payload        jsonb       NOT NULL,
  created_at     timestamptz DEFAULT now()
);

-- Index for fast lookup by user and project
CREATE INDEX IF NOT EXISTS idx_decision_logs_user_id    ON decision_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_project_id ON decision_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_decision_logs_created_at ON decision_logs(created_at DESC);

ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;

-- Audit logs are governance data — only staff can read them.
-- Usahawan cannot read their own audit trail (prevents gaming the system).
-- INSERT is done exclusively via service_role (admin client) — no INSERT policy needed for authenticated.
CREATE POLICY "Staff only decision_logs select"
  ON decision_logs FOR SELECT
  USING (is_staff(auth.uid()));

-- =========================================================================
-- Verification query (run after applying):
-- SELECT COUNT(*) FROM decision_logs;
-- =========================================================================
