-- ========== DROP EXISTING TABLES IF ANY (CLEAN SLATE) ==========
drop table if exists mara_access_log, mara_shortlist, grant_matches, grant_schemes cascade;

-- ========== TABLE: grant_schemes ==========
create table if not exists grant_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  agency text default 'MARA',
  description text,
  eligibility_criteria text,
  sector_tags text[],
  max_amount_myr numeric,
  active boolean default true,
  created_at timestamptz default now()
);

-- ========== TABLE: grant_matches ==========
create table if not exists grant_matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  scheme_id uuid references grant_schemes(id) on delete cascade,
  match_score numeric,
  match_reasoning text,
  generated_at timestamptz default now(),
  model_version text,
  unique (project_id, scheme_id)
);

-- ========== TABLE: mara_shortlist ==========
create table if not exists mara_shortlist (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  status text default 'berpotensi',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (officer_id, project_id)
);

-- ========== TABLE: mara_access_log ==========
create table if not exists mara_access_log (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid references auth.users(id),
  project_id uuid references projects(id),
  accessed_at timestamptz default now()
);

-- Enable RLS
alter table grant_schemes enable row level security;
alter table grant_matches enable row level security;
alter table mara_shortlist enable row level security;
alter table mara_access_log enable row level security;

-- RLS Policies
create policy "Allow read access to active grant schemes for all authenticated users"
  on grant_schemes for select using (auth.role() = 'authenticated');

create policy "Allow write access to grant schemes for admin only"
  on grant_schemes for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Allow read access to grant matches for admin or mara officer only"
  on grant_matches for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'mara_officer'))
  );

create policy "Allow write access to grant matches for admin or service role"
  on grant_matches for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or auth.role() = 'service_role'
  );

create policy "Allow select and modify shortlist for own records only"
  on mara_shortlist for all using (officer_id = auth.uid());

create policy "Allow insert access to access logs for system actions"
  on mara_access_log for insert with check (true);

create policy "Allow select access to access logs for admin only"
  on mara_access_log for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed 3 default schemes
insert into grant_schemes (name, description, eligibility_criteria, sector_tags, max_amount_myr)
values
  ('Skim Pembiayaan Mikro MARA', 'Pembiayaan modal pusingan dan pembelian peralatan untuk perniagaan mikro Bumiputera.', 'Usahawan Bumiputera, skor kebolehsanaan juri sekurang-kurangnya 50 markah, kategori perkhidmatan, pertanian, atau perdagangan am.', '{"Perkhidmatan", "Pertanian", "Teknologi Makanan", "Am"}', 50000),
  ('Geran Inovasi MARA', 'Geran sokongan untuk pembangunan produk inovatif berskala kecil hingga sederhana bagi pasaran komersial.', 'Projek dengan skor kebolehsanaan tinggi (sekurang-kurangnya 70 markah), memiliki aspek teknologi tinggi (IoT, Mekanikal, Digital), prototaip sedia diuji.', '{"Automotif & IoT", "Mekanikal & Robotik", "Pertanian Pintar", "Teknologi"}', 100000),
  ('Program Usahawan Bumiputera Digital', 'Dana sokongan peralihan digital bagi membolehkan usahawan mengintegrasikan teknologi awan, pemasaran digital, atau e-dagang.', 'Perniagaan aktif, skor kebolehsanaan juri sekurang-kurangnya 60 markah, berhasrat membina aplikasi digital atau pendigitalan operasi.', '{"Teknologi", "Perkhidmatan", "Am", "Digital"}', 20000)
on conflict do nothing;
