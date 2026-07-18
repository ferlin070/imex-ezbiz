-- =========================================================================
-- Migration: Database trigger for auto-creating user profiles on signup
-- Version: 20260719000002
-- Author: Antigravity (requested by Kaihara)
-- Purpose: Automatically inserts a row into `profiles` table whenever a new
--          user signs up via Supabase Auth. This ensures profile always exists
--          even if the client-side insert fails (e.g., network error after signUp).
-- IMPORTANT: Review before applying. The function and trigger are idempotent
--            (safe to run multiple times due to OR REPLACE / CREATE OR REPLACE).
-- =========================================================================

-- Function to run after auth.users INSERT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'entrepreneur',  -- All self-registered users are entrepreneurs by default.
                     -- Only admins can change role to 'mara_officer' or 'admin'.
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Safety: if profile already exists, skip
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Attach trigger to auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- NOTE FOR KAIHARA:
-- After applying this migration, test it by:
-- 1. Creating a new user via the /daftar signup page
-- 2. Check Supabase Table Editor → profiles — new row should appear automatically
-- 3. The role column should be 'entrepreneur'
-- =========================================================================
