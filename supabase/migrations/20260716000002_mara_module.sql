-- ========== ALTER: projects ==========
alter table projects add column if not exists mara_visible boolean default false;
alter table projects add column if not exists state text;              -- negeri usahawan/institusi
alter table projects add column if not exists institution text;        -- e.g. 'IKM Besut' (untuk sokong multi-IKM)

-- ========== ALTER: profiles ==========
-- Kemas kini check constraint bagi membolehkan peranan 'mara_officer'
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('judge', 'entrepreneur', 'admin', 'mara_officer'));
