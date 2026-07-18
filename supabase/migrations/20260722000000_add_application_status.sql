ALTER TABLE projects ADD COLUMN IF NOT EXISTS application_status text DEFAULT 'submitted' NOT NULL;

-- Update existing projects that have loan applications to reflect their status
UPDATE projects p
SET application_status = la.status
FROM loan_applications la
WHERE la.project_id = p.id
  AND la.status IS NOT NULL;
