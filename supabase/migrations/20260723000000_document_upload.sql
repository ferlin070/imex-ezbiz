-- Add owner_user_id column to business_documents
ALTER TABLE business_documents ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Make project_id nullable (documents can be at company level)
ALTER TABLE business_documents ALTER COLUMN project_id DROP NOT NULL;

-- Add unique constraint so each user can have only one of each doc type
ALTER TABLE business_documents ADD CONSTRAINT business_documents_user_doc_type_unique UNIQUE (owner_user_id, doc_type);

-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-documents', 'business-documents', false)
ON CONFLICT (id) DO NOTHING;
