-- ========== DROP NEW TABLES IF EXIST FOR IDEMPOTENCY ==========
drop table if exists loan_repayment_schedules cascade;
drop table if exists loan_applications cascade;
drop table if exists loan_products cascade;
drop table if exists self_assessments cascade;
drop table if exists business_documents cascade;
drop table if exists business_profiles cascade;

-- ========== ALTER: events — jenis acara ==========
alter table events add column if not exists event_type text default 'competition'
  check (event_type in ('competition', 'mara_program'));

-- ========== ALTER: projects — laluan & sumber skor ==========
alter table projects alter column event_id drop not null;
alter table projects add column if not exists entry_type text not null default 'event'
  check (entry_type in ('event', 'direct'));
alter table projects add column if not exists score_source text not null default 'judge_verified'
  check (score_source in ('judge_verified', 'self_declared'));
alter table projects add column if not exists application_status text not null default 'submitted'
  check (application_status in ('draft', 'submitted', 'under_review', 'shortlisted', 'rejected'));

-- Drop existing constraint if exists to prevent duplicates
alter table projects drop constraint if exists chk_entry_type_event_id;
alter table projects add constraint chk_entry_type_event_id
  check (
    (entry_type = 'event' and event_id is not null)
    or (entry_type = 'direct' and event_id is null)
  );

-- ========== TABLE: business_profiles (Laluan B) ==========
create table business_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade unique,
  business_name text not null,
  ssm_number text,
  ssm_registered boolean default true,
  entity_type text,                          -- 'milikan_tunggal' | 'perkongsian' | 'sdn_bhd' | 'belum_berdaftar'
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
  business_stage text not null,              -- 'idea' | 'prototaip' | 'operasi_baru' | 'operasi_1_3_tahun' | 'operasi_matang'
  monthly_revenue_range text,                -- julat: '0-5000' | '5000-20000' dsb.
  employee_count int default 0,
  funding_requested_myr numeric not null,
  fund_usage_breakdown jsonb,                -- [{ category: 'Peralatan', percent: 40 }, ...]
  has_existing_financing boolean default false,
  existing_financing_notes text,
  target_market text,
  unique_selling_point text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== TABLE: business_documents ==========
create table business_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  doc_type text not null,                    -- 'ssm_cert' | 'product_photo' | 'business_plan'
  storage_path text not null,                -- path dalam Supabase Storage bucket
  uploaded_at timestamptz default now()
);

-- ========== TABLE: self_assessments ==========
create table self_assessments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade unique,
  responses jsonb not null,                  -- jawapan soalan
  computed_score numeric not null,           -- formula tetap (bukan AI)
  submitted_at timestamptz default now()
);

-- ========== TABLE: loan_products (Skim Pinjaman MARA) ==========
create table loan_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,                        -- 'Pinjaman Usahawan MARA', 'Pinjaman Belia Bumiputera Terengganu' dsb.
  description text,
  min_amount_myr numeric not null,
  max_amount_myr numeric not null,
  profit_rate_percent numeric not null,      -- kadar tahunan, isi admin — JANGAN hardcode/AI-reka
  min_tenure_months int not null,
  max_tenure_months int not null,
  sector_tags text[],
  active boolean default true,
  created_at timestamptz default now()
);

-- ========== TABLE: loan_applications ==========
create table loan_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  loan_product_id uuid references loan_products(id) on delete set null,
  requested_amount_myr numeric not null,
  requested_tenure_months int not null,
  purpose text,
  status text default 'submitted'
    check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  officer_id uuid references auth.users(id) on delete set null,  -- pegawai yang review
  officer_notes text,
  approved_amount_myr numeric,
  approved_tenure_months int,
  approved_rate_percent numeric,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ========== TABLE: loan_repayment_schedules ==========
create table loan_repayment_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid references loan_applications(id) on delete cascade unique,
  schedule jsonb not null,                    -- array {month, installment, principal, profit, balance}
  monthly_installment_myr numeric not null,
  total_repayment_myr numeric not null,
  total_profit_myr numeric not null,
  generated_at timestamptz default now()
);

-- ========== ALTER: mara_access_log ==========
alter table mara_access_log add column if not exists resource_type text default 'project'
  check (resource_type in ('project', 'loan_application', 'business_profile'));

-- ========== REGISTER STORAGE BUCKETS ==========
insert into storage.buckets (id, name, public)
values ('business-documents', 'business-documents', true)
on conflict (id) do nothing;

-- Enable Row Level Security
alter table business_profiles enable row level security;
alter table business_documents enable row level security;
alter table self_assessments enable row level security;
alter table loan_products enable row level security;
alter table loan_applications enable row level security;
alter table loan_repayment_schedules enable row level security;

-- ========== PROJECTS Policy Update ==========
drop policy if exists "Allow select for projects" on projects;
create policy "Allow select for projects" on projects for select using (
  owner_user_id = auth.uid()
  or (event_id is not null and exists (select 1 from judges where user_id = auth.uid() and event_id = projects.event_id))
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  or (exists (select 1 from profiles where id = auth.uid() and role = 'mara_officer') and (entry_type = 'direct' or mara_visible = true))
);

-- ========== business_profiles Policies ==========
create policy "Allow owners full access to business_profiles" on business_profiles for all using (
  exists (select 1 from projects where id = business_profiles.project_id and owner_user_id = auth.uid())
);
create policy "Allow admin and mara_officer read access to business_profiles" on business_profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
  and exists (select 1 from projects where id = business_profiles.project_id and (entry_type = 'direct' or mara_visible = true))
);

-- ========== business_documents Policies ==========
create policy "Allow owners full access to business_documents" on business_documents for all using (
  exists (select 1 from projects where id = business_documents.project_id and owner_user_id = auth.uid())
);
create policy "Allow admin and mara_officer read access to business_documents" on business_documents for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
  and exists (select 1 from projects where id = business_documents.project_id and (entry_type = 'direct' or mara_visible = true))
);

-- ========== self_assessments Policies ==========
create policy "Allow owners full access to self_assessments" on self_assessments for all using (
  exists (select 1 from projects where id = self_assessments.project_id and owner_user_id = auth.uid())
);
create policy "Allow admin and mara_officer read access to self_assessments" on self_assessments for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
  and exists (select 1 from projects where id = self_assessments.project_id and (entry_type = 'direct' or mara_visible = true))
);

-- ========== loan_products Policies ==========
create policy "Allow read access to loan_products for authenticated" on loan_products for select using (
  auth.role() = 'authenticated'
);
create policy "Allow admin full access to loan_products" on loan_products for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ========== loan_applications Policies ==========
create policy "Allow owners full access to loan_applications" on loan_applications for all using (
  exists (select 1 from projects where id = loan_applications.project_id and owner_user_id = auth.uid())
);
create policy "Allow admin and mara_officer access to loan_applications" on loan_applications for all using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
);

-- ========== loan_repayment_schedules Policies ==========
create policy "Allow owners read access to loan_repayment_schedules" on loan_repayment_schedules for select using (
  exists (
    select 1 from loan_applications la
    join projects p on la.project_id = p.id
    where la.id = loan_repayment_schedules.loan_application_id
    and p.owner_user_id = auth.uid()
  )
);
create policy "Allow admin and mara_officer read access to loan_repayment_schedules" on loan_repayment_schedules for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
);
create policy "Allow system write access to loan_repayment_schedules" on loan_repayment_schedules for all using (
  auth.role() = 'service_role' or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ========== SEED MOCK LOAN PRODUCTS ==========
insert into loan_products (name, description, min_amount_myr, max_amount_myr, profit_rate_percent, min_tenure_months, max_tenure_months, sector_tags)
values
  (
    'SPIKE (Skim Pembiayaan Khas Usahawan)',
    'Pembiayaan khusus untuk membantu usahawan Bumiputera meningkatkan kapasiti perniagaan, pembelian aset, dan modal pusingan.',
    10000, 250000, 4.0, 12, 84,
    '{"Teknologi", "Pertanian Pintar", "Automotif & IoT", "Mekanikal & Robotik", "Am"}'
  ),
  (
    'PUTRA (Pembiayaan Usahawan Teraju Rakyat)',
    'Pembiayaan mudah untuk usahawan Bumiputera baharu dan mikro memulakan langkah perniagaan dengan dokumen minimum.',
    5000, 50000, 3.5, 12, 60,
    '{"Teknologi Makanan", "Perkhidmatan", "Am", "Digital"}'
  )
on conflict do nothing;
