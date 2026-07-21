-- =========================================================================
-- Migration: Backfill owner_user_id on business_documents
-- Version: 20260725000000
-- Purpose:
--   BUG FIX — The document upload API (/api/documents/upload) was inserting
--   rows into business_documents WITHOUT populating the owner_user_id column
--   (added in migration 20260723000000_document_upload.sql).
--
--   This caused:
--     1. NULL owner_user_id on all existing document records.
--     2. The eligibility engine to show "Kurang: ssm_cert, business_plan"
--        even after the user had successfully uploaded those documents.
--
--   Fix: Backfill owner_user_id from projects.owner_user_id for all rows
--        where owner_user_id IS NULL but project_id IS NOT NULL.
-- =========================================================================

UPDATE business_documents bd
SET owner_user_id = p.owner_user_id
FROM projects p
WHERE bd.project_id = p.id
  AND bd.owner_user_id IS NULL;

-- Verify:
-- SELECT id, project_id, owner_user_id, doc_type
-- FROM business_documents
-- WHERE owner_user_id IS NULL;
-- (should return 0 rows after this migration)
