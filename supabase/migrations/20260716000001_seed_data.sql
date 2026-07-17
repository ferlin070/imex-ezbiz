-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

-- ========== SEED TEST USERS ==========
-- Insert dummy users into auth.users (useful for local development / testing)
-- All passwords are 'password123'
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'juri1@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Encik Khairul"}', now(), now(), 'authenticated', 'authenticated', '', '', '', ''),
  ('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'juri2@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Puan Zaimah"}', now(), now(), 'authenticated', 'authenticated', '', '', '', ''),
  ('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'juri3@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Dr. Firdaus"}', now(), now(), 'authenticated', 'authenticated', '', '', '', ''),
  ('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'usahawan1@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ahmad FOCUS"}', now(), now(), 'authenticated', 'authenticated', '', '', '', ''),
  ('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'usahawan2@gmail.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Siti Food Dryer"}', now(), now(), 'authenticated', 'authenticated', '', '', '', '')
on conflict (id) do nothing;

-- ========== SEED PROFILES ==========
insert into profiles (id, email, role, name)
values
  ('a1111111-1111-1111-1111-111111111111', 'juri1@gmail.com', 'judge', 'Encik Khairul'),
  ('a2222222-2222-2222-2222-222222222222', 'juri2@gmail.com', 'judge', 'Puan Zaimah'),
  ('a3333333-3333-3333-3333-333333333333', 'juri3@gmail.com', 'judge', 'Dr. Firdaus'),
  ('b1111111-1111-1111-1111-111111111111', 'usahawan1@gmail.com', 'entrepreneur', 'Ahmad FOCUS'),
  ('b2222222-2222-2222-2222-222222222222', 'usahawan2@gmail.com', 'entrepreneur', 'Siti Food Dryer')
on conflict (id) do nothing;

-- ========== SEED EVENTS ==========
insert into events (id, name, slug, status)
values
  ('e1111111-1111-1111-1111-111111111111', 'Festival Inovasi IKM Besut 2026', 'ikm-besut-2026', 'active')
on conflict (id) do nothing;

-- ========== SEED CRITERIA ==========
insert into criteria (id, event_id, code, label, max_score, weight, sort_order)
values
  ('c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'K1', 'Idea (Kreativiti)', 20, 20.0, 1),
  ('c2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'K2', 'Hasil Inovasi (Output)', 30, 30.0, 2),
  ('c3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'K3', 'Impak (Efisien / Keberkesanan)', 20, 20.0, 3),
  ('c4444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'K4', 'Impak (Signifikal / Relevan)', 25, 25.0, 4),
  ('c5555555-5555-5555-5555-555555555555', 'e1111111-1111-1111-1111-111111111111', 'K5', 'Pengurusan (Komitmen)', 5, 5.0, 5)
on conflict (id) do nothing;

-- -- ========== SEED PROJECTS ==========
insert into projects (id, event_id, title, description, category, team_members, owner_user_id)
values
  ('d1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'F.O.C.U.S DRIVE', 'Sistem pemanduan pintar berasaskan IoT untuk mengurangkan kemalangan jalan raya akibat keletihan pemandu dengan memantau pergerakan mata dan memberikan amaran masa nyata.', 'Automotif & IoT', array['Ahmad', 'Ali', 'Abu'], 'b1111111-1111-1111-1111-111111111111'),
  ('d2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'FOOD DRYER', 'Mesin pengering makanan berasaskan tenaga solar hibrid dengan kawalan suhu automatik untuk kegunaan usahawan mikro desa memproses hasil tani dengan lebih cepat.', 'Teknologi Makanan', array['Siti', 'Sarah'], 'b2222222-2222-2222-2222-222222222222'),
  ('d3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'Smart Grass Chopper', 'Alat pemotong rumput pintar yang dikawal melalui aplikasi telefon pintar dengan sensor pengesanan halangan untuk keselamatan dan kecekapan penyelenggaraan landskap.', 'Mekanikal & Robotik', array['Chong', 'Muthu'], null),
  ('d4444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'Mobile Poison Sprayer', 'Mesin penyembur racun tanaman mudah alih berautonomi menggunakan roda berkuasa tinggi untuk aplikasi sektor pertanian pintar berskala kecil.', 'Pertanian Pintar', array['Wan', 'Zaki'], null)
on conflict (id) do nothing;

-- ========== SEED JUDGES ==========
insert into judges (id, event_id, user_id, panel_label, name)
values
  ('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Panel 1', 'Encik Khairul'),
  ('f2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Panel 2', 'Puan Zaimah'),
  ('f3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'Panel 3', 'Dr. Firdaus')
on conflict (id) do nothing;

-- ========== SEED SCORES (MOCK DATA FOR F.O.C.U.S DRIVE) ==========
insert into scores (project_id, judge_id, criteria_id, score)
values
  -- Judge 1 (Encik Khairul): 18 + 25 + 17 + 20 + 4 = 84 marks
  ('d1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 18),
  ('d1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 25),
  ('d1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 17),
  ('d1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', 20),
  ('d1111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555555', 4),

  -- Judge 2 (Puan Zaimah): 19 + 27 + 18 + 21 + 5 = 90 marks
  ('d1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 19),
  ('d1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 27),
  ('d1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 18),
  ('d1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'c4444444-4444-4444-4444-444444444444', 21),
  ('d1111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555555', 5),

  -- Judge 3 (Dr. Firdaus): 17 + 24 + 16 + 18 + 4 = 79 marks
  ('d1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 17),
  ('d1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 24),
  ('d1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 16),
  ('d1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', 18),
  ('d1111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 'c5555555-5555-5555-5555-555555555555', 4)
on conflict (id) do nothing;
