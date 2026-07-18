-- =========================================================================
-- Migration: Create ai_reports table
-- Version: 20260719000001
-- Author: Antigravity (requested by Kaihara)
-- Purpose: Creates the ai_reports table that was referenced in code but
--          never existed in the database schema. Required for SWOT/Blueprint/Pitch
--          AI Business Report feature to function correctly.
-- IMPORTANT: Apply AFTER 20260719000000_security_fixes.sql
-- =========================================================================

CREATE TABLE IF NOT EXISTS ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE UNIQUE NOT NULL,
  feasibility_score int CHECK (feasibility_score BETWEEN 0 AND 100),
  feasibility_tier text CHECK (feasibility_tier IN ('Sangat Berpotensi', 'Layak Komersial', 'Berpotensi Sederhana', 'Perlu Bimbingan')),
  swot jsonb,
  blueprint jsonb,
  pitch_script text,
  grant_notes jsonb,
  generated_at timestamptz DEFAULT now(),
  model_version text DEFAULT 'gemini-1.5-flash',
  guardrail_passed boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Owner can read their own AI reports
CREATE POLICY "Allow owner ai_reports select"
  ON ai_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = ai_reports.project_id 
        AND owner_user_id = auth.uid()
    )
  );

-- Officers and admins can read all reports (for grant review)
CREATE POLICY "Allow staff ai_reports select"
  ON ai_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND role IN ('admin', 'mara_officer')
    )
  );

-- Only owners can insert/update their reports (via the API route with service role)
-- Note: The generate API uses service role client for upsert, bypassing RLS
-- This policy is a safety net for direct API calls
CREATE POLICY "Allow owner ai_reports write"
  ON ai_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = ai_reports.project_id 
        AND owner_user_id = auth.uid()
    )
  );
