-- =========================================================================
-- Migration: Security Fixes & Schema Sync
-- Version: 20260719000000
-- Author: Antigravity (requested by Kaihara)
-- Purpose:
--   C1: Fix RLS policies that use `using (true)` (data exposure risk)
--   C2: Make storage bucket business-documents private
--   Schema: Add missing columns to projects table (team_members, mara_visible, entry_type)
--   Schema: Add missing column to loan_applications (ai_reports linkage)
-- IMPORTANT: Review carefully before applying. Do NOT apply to production 
--            without Kaihara approval.
-- =========================================================================

-- =========================================================================
-- SCHEMA SYNC: Add columns to `projects` that were added in code but not in 
-- the original migration. Safe to run even if columns already exist (IF NOT EXISTS).
-- =========================================================================

ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS team_members text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mara_visible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS entry_type text DEFAULT 'direct';

-- =========================================================================
-- C1 FIX: RLS on `profiles` table
-- OLD (INSECURE): using (true) — anyone with anon key can read ALL profiles
-- NEW: Entrepreneurs can only read their own profile. Officers/admins can read all.
-- =========================================================================

-- Drop the insecure blanket read policy
DROP POLICY IF EXISTS "Allow all profiles read" ON profiles;

-- Allow users to read ONLY their own profile
CREATE POLICY "Allow owner profile read" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- Allow admin and mara_officer to read ALL profiles (needed for officer dashboard)
CREATE POLICY "Allow staff profiles read" 
  ON profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'mara_officer')
    )
  );

-- Keep the existing write own policy (it is correct)
-- "Allow all profiles write own" — using (auth.uid() = id) — this is fine, keep it

-- =========================================================================
-- C1 FIX: RLS on `loan_repayment_schedules` table
-- OLD (INSECURE): using (true) — anyone can read ALL repayment schedules
-- NEW: Entrepreneur can only read schedules for their own loan applications
--      Officers/admins can read all schedules
-- =========================================================================

DROP POLICY IF EXISTS "Allow select schedules" ON loan_repayment_schedules;

-- Allow owners: trace through loan_applications → projects → owner_user_id
CREATE POLICY "Allow owner schedule select"
  ON loan_repayment_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM loan_applications la
      JOIN projects p ON p.id = la.project_id
      WHERE la.id = loan_repayment_schedules.loan_application_id
        AND p.owner_user_id = auth.uid()
    )
  );

-- Allow officers and admins to read all schedules
CREATE POLICY "Allow staff schedule select"
  ON loan_repayment_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'mara_officer')
    )
  );

-- =========================================================================
-- C2 FIX: Make storage bucket `business-documents` PRIVATE
-- This prevents direct public URL access to sensitive documents (SSM cert, IC, etc.)
-- After this, all access must go through Supabase signed URLs (createSignedUrl).
-- =========================================================================

UPDATE storage.buckets 
  SET public = false 
  WHERE id = 'business-documents';

-- Storage RLS: Only allow owners to upload/read their own documents
-- (These policies operate on storage.objects table)

-- Drop any existing insecure storage policies if they exist
DROP POLICY IF EXISTS "Allow public read business-documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Allow owners to upload documents to their own folder (folder = user_id)
CREATE POLICY "Allow owner upload business-documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'business-documents'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow owners to read their own documents
CREATE POLICY "Allow owner read business-documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'business-documents'
    AND (
      -- Owner: must be their folder
      (storage.foldername(name))[1] = auth.uid()::text
      -- OR admin/officer (for document review)
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'mara_officer')
      )
    )
  );

-- Allow owners to delete their own documents
CREATE POLICY "Allow owner delete business-documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'business-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
