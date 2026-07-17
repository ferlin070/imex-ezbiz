-- ========== CLEAN SLATE (DROP EVERYTHING UNRELATED) ==========
drop table if exists loan_repayment_schedules cascade;
drop table if exists loan_applications cascade;
drop table if exists loan_products cascade;
drop table if exists business_documents cascade;
drop table if exists business_profiles cascade;
drop table if exists projects cascade;
drop table if exists profiles cascade;
drop table if exists events cascade;
drop table if exists criteria cascade;
drop table if exists scores cascade;
drop table if exists judges cascade;
drop table if exists self_assessments cascade;
drop table if exists mara_access_log cascade;

-- ========== 1. PROFILES ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('entrepreneur', 'mara_officer', 'admin')),
  name text,
  created_at timestamptz default now()
);

-- ========== 2. PROJECTS ==========
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  owner_user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- ========== 3. BUSINESS PROFILES ==========
create table business_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade unique,
  business_name text not null,
  ssm_number text,
  ssm_registered boolean default true,
  entity_type text,
  operating_since date,
  address text,
  state text,
  district text,
  owner_full_name text not null,
  owner_ic_number text not null,
  is_bumiputera boolean not null,
  owner_age int,
  education_level text,
  phone text not null,
  business_stage text not null,
  monthly_revenue_range text,
  employee_count int default 0,
  funding_requested_myr numeric not null,
  fund_usage_breakdown jsonb,
  has_existing_financing boolean default false,
  existing_financing_notes text,
  target_market text,
  unique_selling_point text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== 4. BUSINESS DOCUMENTS ==========
create table business_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  doc_type text not null, -- 'ssm_cert' | 'product_photo' | 'business_plan'
  storage_path text not null,
  uploaded_at timestamptz default now()
);

-- ========== 5. LOAN PRODUCTS (MARA SCHEMES) ==========
create table loan_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  min_amount_myr numeric not null,
  max_amount_myr numeric not null,
  profit_rate_percent numeric not null,
  min_tenure_months int not null,
  max_tenure_months int not null,
  sector_tags text[],
  active boolean default true,
  created_at timestamptz default now()
);

-- ========== 6. LOAN APPLICATIONS ==========
create table loan_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  loan_product_id uuid references loan_products(id) on delete set null,
  requested_amount_myr numeric not null,
  requested_tenure_months int not null,
  purpose text,
  status text default 'submitted' check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  officer_id uuid references auth.users(id) on delete set null,
  officer_notes text,
  approved_amount_myr numeric,
  approved_tenure_months int,
  approved_rate_percent numeric,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  eligibility_status text check (eligibility_status in ('LULUS', 'TIDAK_LULUS', 'PERLU_TINDAKAN')),
  eligibility_output jsonb,
  ai_action_plan text,
  was_blocked_by_guardrail boolean default false
);

-- ========== 7. LOAN REPAYMENT SCHEDULES ==========
create table loan_repayment_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid references loan_applications(id) on delete cascade unique,
  schedule jsonb not null,
  monthly_installment_myr numeric not null,
  total_repayment_myr numeric not null,
  total_profit_myr numeric not null,
  generated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table projects enable row level security;
alter table business_profiles enable row level security;
alter table business_documents enable row level security;
alter table loan_products enable row level security;
alter table loan_applications enable row level security;
alter table loan_repayment_schedules enable row level security;

-- Setup RLS Policies
create policy "Allow all profiles read" on profiles for select using (true);
create policy "Allow all profiles write own" on profiles for all using (auth.uid() = id);

create policy "Allow owners and admin projects select" on projects for select using (
  auth.uid() = owner_user_id 
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
);
create policy "Allow owners projects write" on projects for all using (auth.uid() = owner_user_id);

create policy "Allow owners and admin profiles select" on business_profiles for select using (
  exists (select 1 from projects where id = business_profiles.project_id and owner_user_id = auth.uid())
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
);
create policy "Allow owners profiles write" on business_profiles for all using (
  exists (select 1 from projects where id = business_profiles.project_id and owner_user_id = auth.uid())
);

create policy "Allow owners and admin documents select" on business_documents for select using (
  exists (select 1 from projects where id = business_documents.project_id and owner_user_id = auth.uid())
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
);
create policy "Allow owners documents write" on business_documents for all using (
  exists (select 1 from projects where id = business_documents.project_id and owner_user_id = auth.uid())
);

create policy "Allow all select loan_products" on loan_products for select using (true);

create policy "Allow owners and admin applications select" on loan_applications for select using (
  exists (select 1 from projects where id = loan_applications.project_id and owner_user_id = auth.uid())
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
);
create policy "Allow owners applications write" on loan_applications for all using (
  exists (select 1 from projects where id = loan_applications.project_id and owner_user_id = auth.uid())
);

create policy "Allow select schedules" on loan_repayment_schedules for select using (true);

-- Seed Loan Products
insert into loan_products (name, description, min_amount_myr, max_amount_myr, profit_rate_percent, min_tenure_months, max_tenure_months, sector_tags, active)
values 
('Skim Pembiayaan PUTRA (Mikro)', 'Pembiayaan mikro untuk perniagaan runcit, makanan, perdagangan & perkhidmatan kecil usahawan Bumiputera.', 10000, 50000, 4.00, 12, 60, ARRAY['runcit', 'perkhidmatan', 'makanan'], true),
('Skim Pembiayaan Kecil (SPiM)', 'Pembiayaan skala kecil untuk pengembangan operasi perniagaan Bumiputera dengan had limit lebih tinggi.', 50000, 250000, 4.00, 24, 120, ARRAY['pembuatan', 'teknologi', 'pembinaan', 'perkhidmatan'], true)
on conflict do nothing;

-- Create Storage bucket
insert into storage.buckets (id, name, public)
values ('business-documents', 'business-documents', true)
on conflict (id) do nothing;
