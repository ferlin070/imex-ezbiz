# Arahan untuk Antigravity — Modul "MARA Talent Scout" pada IMEX AI-Biz

> **Cara guna:** Paste dokumen ini sebagai mission baru dalam Antigravity, rujuk kepada repo `imex-ezbiz` sedia ada. Ini BUKAN projek baru — ini adalah **extension** kepada sistem IMEX AI-Biz yang dah wujud (PRD & Architecture di `doc/01` dan `doc/02`). Jangan ubah struktur, skema, atau logik sedia ada (Modul Juri, Dashboard Usahawan, Enjin AI) kecuali dinyatakan secara eksplisit di bawah.

---

## KONTEKS & MATLAMAT

IMEX AI-Biz sedia ada menjana Biz-Feasibility Score, SWOT, Blueprint, dan skrip pitching untuk usahawan TVET/IKM berdasarkan skor juri sebenar. Modul baru ini menambah **portal untuk pegawai MARA** supaya mereka boleh **mencari, menapis, dan menganalisis usahawan/startup MARA** yang layak dipertimbangkan untuk geran — secara proaktif, bukan menunggu usahawan memohon.

Objektif modul ini:
1. Beri MARA satu portal carian merentasi semua acara/projek (bukan satu-satu).
2. Padankan setiap usahawan dengan skim geran MARA tertentu, dengan skor & sebab kelayakan yang dijana AI.
3. Benarkan pegawai MARA menyenarai-pendekkan (shortlist) calon dan simpan nota dalaman.
4. Beri dashboard analitik agregat (taburan sektor, tier, top prospek).
5. Kekalkan privasi & kebolehauditan — usahawan mesti *consent* dulu sebelum data mereka boleh dilihat MARA.

---

## GARIS PANDUAN & LARANGAN (WAJIB BACA DULU)

1. **JANGAN ubah** skema `events`, `criteria`, `judges`, `scores`, formula `feasibility_score` dalam `lib/feasibility.ts`, atau logik Modul Juri sedia ada. Modul ini HANYA menambah jadual/route/UI baru.
2. **JANGAN dedahkan data usahawan kepada MARA tanpa consent.** Setiap projek perlu field `mara_visible` (default `false`). MARA officer hanya boleh `SELECT` projek dengan `mara_visible = true`.
3. **JANGAN benarkan MARA officer edit/padam data juri, skor, atau laporan AI.** Akses mereka read-only + shortlist/nota mereka sendiri sahaja.
4. **Setiap akses MARA officer kepada profil usahawan mesti direkod** dalam `mara_access_log` (audit trail) — ini keperluan PDPA, bukan pilihan.
5. Panggilan Gemini API untuk grant-matching mesti **server-side sahaja**, guna structured JSON output + validasi Zod (ikut pola sedia ada dalam `lib/gemini.ts`).
6. **Jangan reka nombor RM tepat** dalam grant matching — AI boleh sebut julat anggaran sahaja, bukan jumlah pasti kelulusan geran.
7. Sebarang migration SQL baru mesti fail berasingan (`supabase/migrations/00X_mara_module.sql`), jangan edit migration sedia ada.
8. **Dapatkan pengesahan saya dulu** sebelum: merge ke main, deploy ke Vercel, atau tambah dependency npm baru yang tak disenaraikan di bawah.
9. Kod mesti production-ready — tiada placeholder/TODO tanpa error handling, ikut piawaian yang sama macam Fasa 0–9 IMEX AI-Biz asal.

---

## TECH STACK TAMBAHAN

Guna stack sedia ada (Next.js 16, Supabase, Gemini, Zod, shadcn/ui). Tambahan yang dibenarkan:
- `exceljs` atau `xlsx` (SheetJS) — untuk eksport Excel batch (pilih satu, nyatakan sebab dalam PR).
- Tiada dependency AI/backend baru selain yang disenaraikan.

---

## SKEMA PANGKALAN DATA BARU (TAMBAHAN SAHAJA)

```sql
-- ========== ALTER: projects (tambah field, jangan padam field sedia ada) ==========
alter table projects add column if not exists mara_visible boolean default false;
alter table projects add column if not exists state text;              -- negeri usahawan/institusi
alter table projects add column if not exists institution text;        -- e.g. 'IKM Besut' (untuk sokong multi-IKM masa depan)

-- ========== ALTER: profiles (tambah role) ==========
-- andaian: jadual profiles sedia ada dengan column `role` ('judge' | 'entrepreneur' | 'admin')
alter table profiles add column if not exists role text default 'entrepreneur';
-- pastikan constraint/enum dikemaskini untuk terima 'mara_officer' juga

-- ========== GRANT SCHEMES (skim geran MARA — diselenggara oleh admin) ==========
create table grant_schemes (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- 'Skim Pembiayaan Mikro MARA', 'Geran Inovasi MARA', dsb.
  agency text default 'MARA',
  description text,
  eligibility_criteria text,             -- teks bebas, input admin — jadi konteks untuk AI matching
  sector_tags text[],                    -- e.g. {'Teknologi','Pertanian','Perkhidmatan'}
  max_amount_myr numeric,                -- anggaran siling geran (jika ada, bukan wajib)
  active boolean default true,
  created_at timestamptz default now()
);

-- ========== GRANT MATCHES (hasil AI matching per projek per skim) ==========
create table grant_matches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  scheme_id uuid references grant_schemes(id) on delete cascade,
  match_score numeric,                   -- 0-100, dijana AI berdasarkan feasibility_score + deskripsi + kriteria skim
  match_reasoning text,                  -- sebab kelayakan/tidak, dalam Bahasa Melayu
  generated_at timestamptz default now(),
  model_version text,
  unique (project_id, scheme_id)
);

-- ========== SHORTLIST & NOTA PEGAWAI MARA ==========
create table mara_shortlist (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  status text default 'berpotensi',      -- 'berpotensi' | 'dihubungi' | 'ditolak' | 'diluluskan'
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (officer_id, project_id)
);

-- ========== AUDIT LOG (keperluan PDPA — WAJIB) ==========
create table mara_access_log (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid references auth.users(id),
  project_id uuid references projects(id),
  accessed_at timestamptz default now()
);
```

**Row Level Security — polisi baru:**
- `projects`: tambah polisi SELECT — `role = 'mara_officer' AND mara_visible = true` (selain polisi sedia ada untuk owner/admin/judge).
- `grant_schemes`: SELECT untuk semua role log masuk; INSERT/UPDATE/DELETE admin sahaja.
- `grant_matches`: SELECT untuk `mara_officer` dan `admin` sahaja (bukan usahawan — supaya usahawan tak nampak "skor kelulusan geran" yang boleh disalahtafsir sebagai jaminan).
- `mara_shortlist`: setiap officer hanya SELECT/INSERT/UPDATE rekod `officer_id = auth.uid()` sendiri.
- `mara_access_log`: INSERT sahaja oleh sistem (server-side, guna service role); SELECT admin sahaja.

---

## REKA BENTUK API ROUTES BARU

```
/app/api/mara/search/route.ts              POST  → tapis projek (filter: tier, sektor, negeri, kata kunci)
/app/api/mara/grant-match/[projectId]      POST  → trigger AI grant-matching untuk satu projek (semua skim aktif)
/app/api/mara/shortlist/route.ts           GET/POST/PATCH → urus shortlist pegawai
/app/api/mara/analytics/route.ts           GET   → statistik agregat (taburan tier/sektor, top 10)
/app/api/mara/export/route.ts              GET   → eksport senarai pendek ke Excel
/app/api/admin/grant-schemes/route.ts      CRUD  → admin urus skim geran
```

### Alur `/api/mara/grant-match/[projectId]`
1. Sahkan role = `mara_officer` atau `admin`.
2. Rekod akses ke `mara_access_log`.
3. Ambil `project`, `ai_reports` (SWOT/blueprint sedia ada), `feasibility_score`, dan semua `grant_schemes` aktif.
4. Untuk setiap skim, bina prompt Gemini: beri deskripsi projek + feasibility score + kriteria kelayakan skim → minta `match_score` (0-100) + `match_reasoning` (2-3 ayat).
5. Validasi output ikut Zod schema baru (`schemas/grant-match.schema.ts`).
6. `upsert` ke `grant_matches`.
7. Pulangkan array match untuk semua skim, disusun ikut `match_score` menurun.

---

## KOMPONEN UI BARU

| Halaman/Komponen | Fungsi |
|---|---|
| `/app/(mara)/login/page.tsx` | Log masuk khusus pegawai MARA (guna Supabase Auth sedia ada, semak `role = 'mara_officer'`) |
| `/app/(mara)/search/page.tsx` | Konsol carian: filter tier, sektor, negeri, kata kunci; papar hasil sebagai kad ringkas (nama projek, tier, sektor, negeri) |
| `<CandidateCard />` | Kad ringkas dalam senarai carian — klik untuk buka profil penuh |
| `/app/(mara)/candidate/[projectId]/page.tsx` | Profil penuh: Feasibility Gauge, SWOT, Blueprint (guna komponen sedia ada), + panel baru `<GrantMatchPanel />` |
| `<GrantMatchPanel />` | Papar senarai skim geran + match_score + reasoning, butang "Jana Semula Padanan" |
| `<ShortlistButton />` | Tanda projek sebagai berpotensi/dihubungi/ditolak + textarea nota dalaman |
| `/app/(mara)/shortlist/page.tsx` | Senarai penuh calon yang di-shortlist officer tersebut, dengan status & nota |
| `/app/(mara)/analytics/page.tsx` | Carta agregat: bilangan usahawan ikut tier, taburan sektor, top 10 keseluruhan |
| `<ExportButton />` | Eksport senarai pendek semasa ke fail Excel |
| `/app/admin/grant-schemes/page.tsx` | CRUD skim geran (nama, kriteria kelayakan, sektor, siling anggaran) |

**Tema visual:** kekal konsisten dengan dashboard usahawan sedia ada (dark navy + neon teal/cyan), tapi guna aksen warna berlainan (contoh: gold/amber) untuk bezakan portal MARA daripada portal usahawan — supaya jelas ini "mod pegawai".

---

## FASA PEMBANGUNAN (Task Breakdown)

### FASA M0 — Setup & Consent
- [ ] Migration SQL: tambah kolum `mara_visible`, `state`, `institution` pada `projects`; tambah `role` enum value `mara_officer` pada `profiles`.
- [ ] Tambah UI kecil di Dashboard Usahawan sedia ada: toggle "Benarkan MARA lihat profil saya untuk peluang geran" → set `mara_visible`. (Default OFF — usahawan mesti *opt-in* secara eksplisit.)
- [ ] **Checkpoint review:** tunjuk saya UI consent ini dulu sebelum teruskan ke Fasa M1.

### FASA M1 — Skema Grant Schemes & Shortlist
- [ ] Migration SQL untuk `grant_schemes`, `grant_matches`, `mara_shortlist`, `mara_access_log` (salin terus dari seksyen di atas).
- [ ] Aktifkan RLS + polisi seperti dinyatakan.
- [ ] Seed 3 skim geran contoh (Skim Pembiayaan Mikro MARA, Geran Inovasi MARA, Program Usahawan Bumiputera Digital) dengan kriteria kelayakan realistik.
- [ ] **Checkpoint review** sebelum teruskan.

### FASA M2 — Auth & Middleware MARA
- [ ] Tambah role `mara_officer` ke sistem auth sedia ada.
- [ ] Middleware lindungi route `(mara)` — hanya role `mara_officer`/`admin` boleh masuk.
- [ ] Halaman login MARA (`/app/(mara)/login`).

### FASA M3 — Search Console
- [ ] `/api/mara/search`: query `projects` dengan filter (tier dikira daripada `ai_reports.feasibility_tier`, sektor = `category`, negeri = `state`, kata kunci = ILIKE pada title/description), **hanya `mara_visible = true`**.
- [ ] Halaman `/search`: borang filter + senarai kad hasil (mobile-friendly tapi optimize untuk desktop juga, sebab pegawai MARA kemungkinan besar guna komputer pejabat).

### FASA M4 — Grant Matching Engine
- [ ] `schemas/grant-match.schema.ts`: Zod schema untuk `{ scheme_id, match_score, match_reasoning }[]`.
- [ ] `lib/grantMatch.ts`: fungsi `generateGrantMatches(project, feasibilityResult, schemes)` — bina prompt, panggil Gemini, validate, retry sekali jika gagal.
- [ ] `/api/mara/grant-match/[projectId]`: ikut alur di atas, termasuk log akses ke `mara_access_log`.
- [ ] `<GrantMatchPanel />` di halaman profil calon.
- [ ] **Checkpoint review** — semak sample output AI reasoning sebelum teruskan (pastikan tiada nombor RM direka).

### FASA M5 — Shortlist & Nota
- [ ] `/api/mara/shortlist`: GET (senarai officer sendiri), POST (tambah), PATCH (kemaskini status/nota).
- [ ] `<ShortlistButton />` + `/shortlist` page.

### FASA M6 — Analytics & Export
- [ ] `/api/mara/analytics`: agregat COUNT ikut tier, ikut sektor, top 10 by feasibility_score (merentasi semua event yang `mara_visible = true`).
- [ ] `/analytics` page dengan carta (guna Recharts atau library carta yang dah ada dalam projek).
- [ ] `/api/mara/export`: jana Excel daripada senarai shortlist semasa (kolum: nama projek, sektor, negeri, feasibility score, tier, skim geran padanan terbaik, status, nota).

### FASA M7 — Admin: Urus Skim Geran
- [ ] `/app/admin/grant-schemes`: CRUD ringkas (table view + borang) untuk admin tambah/kemaskini skim geran MARA/TEKUN/MDEC lain.

### FASA M8 — QA & Deploy
- [ ] Uji RLS: pastikan usahawan dengan `mara_visible = false` TIDAK muncul dalam carian MARA.
- [ ] Uji audit log: setiap kali officer buka profil calon, rekod masuk `mara_access_log`.
- [ ] Uji grant matching: pastikan output tiada angka RM tepat direka, hanya julat anggaran.
- [ ] Uji end-to-end: officer log masuk → cari → buka profil → jana grant match → shortlist → eksport Excel.
- [ ] Deploy — **dapatkan pengesahan saya dulu** sebelum push ke production.

---

## DEFINITION OF DONE (Modul MARA Talent Scout)

1. Usahawan boleh pilih untuk dedahkan profil mereka kepada MARA (opt-in, boleh tarik balik).
2. Pegawai MARA boleh log masuk ke portal berasingan, cari & tapis usahawan merentasi semua acara.
3. Setiap calon ada skor padanan geran (per skim) dengan sebab dijana AI, berdasarkan feasibility score sedia ada (bukan angka baru direka AI).
4. Pegawai boleh shortlist, tanda status, dan simpan nota dalaman — tidak nampak kepada usahawan.
5. Dashboard analitik agregat berfungsi (taburan tier/sektor, top 10).
6. Eksport Excel senarai pendek berfungsi.
7. Audit log merekod setiap akses officer kepada data usahawan.
8. RLS diuji — tiada kebocoran data usahawan yang tak beri consent.

---

## NOTA TAMBAHAN UNTUK AGENT

- Ini portal untuk pegawai kerajaan/agensi — utamakan kebolehpercayaan & audit trail berbanding "wow factor" visual.
- Jangan sesekali biarkan AI mengubah `feasibility_score` asal semasa proses grant-matching — ia hanya konteks input, sama seperti prinsip asal sistem ini.
- Jika nak sambung ke sistem rasmi MARA (API kelulusan geran sebenar) — ini **di luar skop** modul ini. Sistem hanya format & padan, bukan hantar permohonan terus (sama macam had MVP asal untuk MDEC/TEKUN/Cradle).
- Multi-IKM (bukan hanya IKM Besut) disokong secara struktur (`institution` field) tetapi UI untuk urus banyak institusi tak perlu dibina dalam fasa ini — cukup pastikan skema tak halang perkembangan itu kemudian.
