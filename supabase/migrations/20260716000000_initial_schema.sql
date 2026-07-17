-- ========== DROP EXISTING TABLES IF ANY (CLEAN SLATE) ==========
drop table if exists ai_reports, scores, judges, projects, criteria, events, profiles cascade;

-- ========== PROFILES ==========
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('judge', 'entrepreneur', 'admin')),
  name text,
  created_at timestamptz default now()
);

-- ========== EVENTS ==========
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- e.g. "Festival Inovasi IKM Besut 2026"
  slug text unique not null,
  status text default 'active',       -- active | closed
  created_at timestamptz default now()
);

-- ========== JUDGING CRITERIA ==========
create table criteria (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  code text not null,                 -- 'A' | 'B' | 'C'
  label text not null,                -- 'Persembahan' | 'Semangat Berpasukan' | 'Idea Boleh Dipasarkan'
  max_score numeric not null,         -- e.g. 65
  weight numeric default 1,
  sort_order int default 0
);

-- ========== PROJECTS / INNOVATIONS ==========
create table projects (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  title text not null,                -- 'F.O.C.U.S DRIVE'
  description text,                   -- input asal peserta tentang inovasi
  category text,
  team_members text[],
  owner_user_id uuid references auth.users(id), -- usahawan yang punya akses dashboard
  created_at timestamptz default now()
);

-- ========== JUDGES ==========
create table judges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id),
  panel_label text,                   -- 'Panel 1', 'Panel 2', 'Panel 3'
  name text,
  created_at timestamptz default now()
);

-- ========== SCORES ==========
create table scores (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  judge_id uuid references judges(id) on delete cascade,
  criteria_id uuid references criteria(id) on delete cascade,
  score numeric not null,
  submitted_at timestamptz default now(),
  unique (project_id, judge_id, criteria_id)  -- elak double-submit
);

-- ========== AI GENERATED REPORTS (CACHE) ==========
create table ai_reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade unique,
  feasibility_score numeric,          -- 0-100, dikira dari purata skor juri
  feasibility_tier text,              -- 'Sangat Berpotensi' | 'Layak Komersial' | 'Perlu Bimbingan'
  swot jsonb,                         -- { strengths: [], weaknesses: [], opportunities: [], threats: [] }
  blueprint jsonb,                    -- { technical: [], marketing: [], financial: [] }
  pitch_script text,                  -- skrip 60 saat
  grant_notes jsonb,                  -- cadangan khusus MARA/MDEC/TEKUN
  generated_at timestamptz default now(),
  model_version text
);

-- ========== ROW LEVEL SECURITY ==========
alter table profiles enable row level security;
alter table events enable row level security;
alter table criteria enable row level security;
alter table projects enable row level security;
alter table judges enable row level security;
alter table scores enable row level security;
alter table ai_reports enable row level security;

-- PROFILES Policies
create policy "Allow public read access to profiles" on profiles for select using (true);
create policy "Allow users to update their own profile" on profiles for update using (auth.uid() = id);

-- EVENTS Policies
create policy "Allow read access to events for authenticated users" on events for select using (auth.role() = 'authenticated');
create policy "Allow all write access to events for admins" on events for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- CRITERIA Policies
create policy "Allow read access to criteria for authenticated users" on criteria for select using (auth.role() = 'authenticated');
create policy "Allow all write access to criteria for admins" on criteria for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- PROJECTS Policies
create policy "Allow select for projects" on projects for select using (
  owner_user_id = auth.uid()
  or exists (select 1 from judges where user_id = auth.uid() and event_id = projects.event_id)
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Allow insert/update for project owners or admins" on projects for all using (
  owner_user_id = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- JUDGES Policies
create policy "Allow read access to judges for authenticated users" on judges for select using (auth.role() = 'authenticated');
create policy "Allow all write access to judges for admins" on judges for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- SCORES Policies
create policy "Allow read access to scores for authenticated users" on scores for select using (auth.role() = 'authenticated');
create policy "Allow insert for judges on their own records" on scores for insert with check (
  exists (select 1 from judges where id = scores.judge_id and user_id = auth.uid())
);
create policy "Allow update for judges on their own records" on scores for update using (
  exists (select 1 from judges where id = scores.judge_id and user_id = auth.uid())
);

-- AI_REPORTS Policies
create policy "Allow read access to reports for project owners, judges and admins" on ai_reports for select using (
  exists (
    select 1 from projects
    where id = ai_reports.project_id
    and (
      owner_user_id = auth.uid()
      or exists (select 1 from judges where user_id = auth.uid() and event_id = projects.event_id)
      or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  )
);
create policy "Allow service role or admin to upsert reports" on ai_reports for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  or auth.role() = 'service_role'
);
