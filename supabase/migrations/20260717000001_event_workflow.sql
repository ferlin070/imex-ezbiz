-- ========== STEP 1: ALTER EVENTS ==========
-- Update status values of existing events to fit check constraint
update events set status = 'open' where status = 'active';
update events set status = 'closed' where status = 'closed';

-- Add new columns to events
alter table events add column if not exists description text;
alter table events add column if not exists venue text;
alter table events add column if not exists start_date timestamptz;
alter table events add column if not exists end_date timestamptz;
alter table events add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Add check constraint to events status
alter table events add constraint events_status_check check (status in ('draft', 'open', 'closed', 'completed'));

-- ========== STEP 2: ALTER PROJECTS ==========
-- Add status and timestamps to projects
alter table projects add column if not exists status text default 'submitted';
alter table projects add constraint projects_status_check check (status in ('draft', 'submitted', 'shortlisted', 'approved', 'rejected'));
alter table projects add column if not exists submitted_at timestamptz default now();
alter table projects add column if not exists updated_at timestamptz default now();

-- ========== STEP 3: CREATE TABLE VENUES ==========
create table if not exists venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- ========== STEP 4: CREATE TABLE JURY_ASSIGNMENTS ==========
create table if not exists jury_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'member' check (role in ('chair', 'member', 'observer')),
  assigned_at timestamptz default now(),
  unique(event_id, user_id)
);

-- ========== STEP 5: CREATE TABLE EVALUATIONS ==========
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  jury_id uuid references auth.users(id) on delete cascade,
  score numeric check (score >= 0 and score <= 100),
  comment text,
  submitted_at timestamptz default now(),
  unique(project_id, jury_id)
);

-- ========== STEP 6: ROW LEVEL SECURITY & POLICIES ==========
alter table venues enable row level security;
alter table jury_assignments enable row level security;
alter table evaluations enable row level security;

-- Venues Policies
create policy "Allow read access to venues for authenticated users" on venues for select using (auth.role() = 'authenticated');
create policy "Allow all write access to venues for admins" on venues for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Jury Assignments Policies
create policy "Allow read access to jury_assignments for authenticated users" on jury_assignments for select using (auth.role() = 'authenticated');
create policy "Allow all write access to jury_assignments for admins" on jury_assignments for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Evaluations Policies
create policy "Allow read access to evaluations for authenticated users" on evaluations for select using (auth.role() = 'authenticated');
create policy "Allow insert/update access to evaluations for own records" on evaluations for all using (
  jury_id = auth.uid()
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Additional select policy for projects to let assigned jury view them
create policy "Allow select projects for assigned jury" on projects for select using (
  exists (select 1 from jury_assignments where user_id = auth.uid() and event_id = projects.event_id)
);
