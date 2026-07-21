-- =========================================================================
-- Migration: Add missing columns to projects table
-- Version: 20260720000002
-- Purpose: projects table was missing team_members and mara_visible columns
-- =========================================================================

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS team_members text[] DEFAULT '{}';

ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS mara_visible boolean DEFAULT false;
