# Architecture Document — IMEX AI-Biz
Versi: 1.0 | Stack: Next.js 16 + Supabase + Gemini AI | Hosting: Vercel

---

## 1. Gambaran Keseluruhan Sistem

```
┌─────────────┐     Markah      ┌──────────────┐
│  Juri (App) │ ───────────────▶│  Supabase DB │
└─────────────┘                 │ (Postgres +  │
                                 │  Auth + RLS) │
┌─────────────┐   Pilih Projek  │              │
│  Usahawan   │ ───────────────▶│              │
│  Dashboard  │                 └──────┬───────┘
└──────┬──────┘                        │
       │  panggil                      │ baca skor
       ▼                               ▼
┌─────────────────────────────────────────────┐
│         Next.js API Route (Server)           │
│  /api/generate-report                         │
│  1. Ambil data projek + skor juri dari Supabase│
│  2. Bina prompt berstruktur                    │
│  3. Panggil Gemini API (structured JSON output)│
│  4. Simpan hasil ke Supabase (cache)           │
│  5. Pulangkan JSON ke frontend                 │
└──────────────────┬────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────┐
         │   Gemini API         │
         │ (Google AI Studio)   │
         └─────────────────────┘

Dashboard render → butang "Cetak PDF" → /api/generate-pdf
  (guna @react-pdf/renderer atau Puppeteer) → muat turun PDF
```

---

## 2. Tech Stack

| Lapisan | Teknologi | Sebab |
|---|---|---|
| Frontend/Framework | **Next.js 16** (App Router, Server Components) | SSR laju, API routes terbina dalam, sesuai Vercel |
| Styling/UI | Tailwind CSS + shadcn/ui | Konsisten dengan tema gelap premium dalam poster (dark navy + neon accent) |
| Database | **Supabase Postgres** | Realtime subscription (untuk ranking juri live), Auth terbina dalam, RLS |
| Auth | Supabase Auth (Magic Link / OTP telefon) | Ringkas untuk juri & usahawan tanpa daftar kompleks |
| AI Engine | **Google Gemini API** (model terkini, structured output / JSON mode) | Sudah dinyatakan dalam poster; sokong prompt Bahasa Melayu |
| PDF Generation | `@react-pdf/renderer` (server-side) | Laporan konsisten format, tak perlu headless browser berat |
| Realtime | Supabase Realtime (channel `scores`) | Ranking juri kemas kini live tanpa refresh |
| Hosting | Vercel | Next.js native, `imex-2026.vercel.app` (rujuk poster) |
| Notifikasi (Fasa 2) | WhatsApp Business API / Twilio | Untuk hantar ranking ke juri (mockup dalam poster) — bukan MVP |

---

## 3. Skema Pangkalan Data (Supabase / Postgres)

```sql
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
  name text
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
```

**Row Level Security (RLS) — garis panduan:**
- `scores`: INSERT dibenarkan hanya jika `judge_id` sepadan `auth.uid()` juri berkenaan; UPDATE hanya rekod sendiri.
- `projects`: SELECT dibenarkan untuk `owner_user_id = auth.uid()` (usahawan) ATAU role admin/juri (untuk lihat senarai).
- `ai_reports`: SELECT hanya untuk pemilik projek berkaitan.

---

## 4. Pengiraan Biz-Feasibility Score

```
feasibility_score (%) = ( Σ (purata_skor_semua_juri_bagi_kriteria / max_score_kriteria * weight) 
                           / Σ weight ) * 100
```

- Dikira di **server-side** (bukan AI) — nilai ini mesti sah secara statistik, seperti dinyatakan poster: *"Indeks kebolehsanaan sah dari skor purata panel juri pakar sebenar, bukan sekadar tekaan AI."*
- Julat tier:
  - `< 40%` → Merah / "Perlu Bimbingan"
  - `40–59%` → Kuning / "Berpotensi Sederhana"
  - `60–79%` → Biru / "Layak Komersial"
  - `80–100%` → Hijau / "Sangat Berpotensi"

AI (Gemini) hanya menerima **nombor skor ini sebagai konteks input**, bukan mengubahnya — AI tugasnya jana SWOT/Blueprint/Pitch berdasarkan skor + deskripsi projek.

---

## 5. Reka Bentuk API Routes (Next.js App Router)

```
/app/api/scores/submit/route.ts         POST  → juri hantar markah
/app/api/scores/ranking/route.ts        GET   → ranking realtime (atau guna Supabase Realtime client-side terus)
/app/api/reports/generate/route.ts      POST  → trigger Gemini AI, simpan ai_reports
/app/api/reports/[projectId]/route.ts   GET   → ambil laporan sedia ada (cache)
/app/api/pdf/[projectId]/route.ts       GET   → jana & pulangkan PDF stream
```

### Contoh alur `/api/reports/generate`
1. Sahkan pengguna log masuk & pemilik projek (auth check).
2. Query Supabase: dapatkan `project`, semua `scores` + `criteria` berkaitan.
3. Kira `feasibility_score` (server-side, formula di atas).
4. Bina prompt Gemini (Bahasa Melayu, structured JSON output) — lihat Seksyen 6.
5. Panggil Gemini API dengan `responseSchema` / JSON mode dikunci.
6. Validasi struktur JSON balasan (Zod schema) — jika gagal, retry sekali.
7. `upsert` ke jadual `ai_reports`.
8. Pulangkan JSON kepada frontend untuk paparan dashboard.

---

## 6. Struktur Prompt Gemini (Contoh)

**System instruction (ringkas):**
> Anda ialah perunding perniagaan pakar TVET/IKM Malaysia. Jana output SEMATA-MATA dalam format JSON sah mengikut skema yang diberi. Bahasa: Bahasa Melayu profesional. Jangan reka fakta kewangan khusus (angka RM tepat) — beri anggaran berjulat sahaja.

**User content (contoh ringkas):**
```
Nama Projek: F.O.C.U.S DRIVE
Deskripsi: [deskripsi asal peserta]
Skor Juri:
- Persembahan: 83.6%
- Semangat Berpasukan: 65.6%
- Idea Boleh Dipasarkan: [skor]
Feasibility Score Keseluruhan: 83.6% (Sangat Berpotensi)

Jana:
1. SWOT (4 kategori, 2-3 item setiap satu, berasaskan skor & deskripsi di atas)
2. Actionable Blueprint (Technical / Marketing / Financial — 2-3 tindakan setiap satu)
3. Skrip Elevator Pitch 60 saat (struktur Hook-Problem-Solution-CTA)
4. Nota khusus geran (MARA / MDEC-Cradle / TEKUN-PUNB) — 1 ayat cadangan setiap satu
```

**Output dikunci ikut JSON Schema** (guna ciri structured output Gemini) supaya senang parse terus ke `ai_reports` tanpa regex/cleanup manual.

---

## 7. Komponen UI Utama (Dashboard Usahawan)

| Komponen | Fungsi |
|---|---|
| `<FeasibilityGauge />` | SVG/Canvas gauge separuh bulatan, warna dinamik ikut tier |
| `<SwotTabs />` | Tab switcher 4 kategori, render list dari `ai_reports.swot` |
| `<BlueprintCard />` | 3 seksyen collapsible: Technical / Marketing / Financial |
| `<PitchGenerator />` | Textarea readonly + butang "Salin Skrip" (clipboard API) |
| `<PdfExportButton />` | Trigger `/api/pdf/[projectId]`, papar loading spinner, auto-download |

**Tema visual** (ikut poster): dark navy background (#0a1628-ish), neon teal/cyan accent, kad dengan border halus, gauge berwarna merah→kuning→biru→hijau.

---

## 8. Realtime Ranking (Modul Juri)

- Guna Supabase Realtime: subscribe pada jadual `scores` (filter by `event_id` via join view).
- Bina *materialized view* atau query agregat `SELECT project_id, criteria_id, AVG(score)` untuk ranking pantas.
- Frontend juri (mobile-first, macam mockup WhatsApp dalam poster) memaparkan tab: Keseluruhan / A. Persembahan / B. Semangat Berpasukan / C. Idea Boleh Dipasarkan, dengan medal 🥇🥈🥉 untuk top 2-3.

---

## 9. Keselamatan & Kos

- Semua panggilan Gemini API di **server-side sahaja** (API key tak terdedah ke client).
- Had kadar (rate limit) regenerate laporan: contoh 1x setiap 5 minit per projek, elak kos membazir.
- Cache `ai_reports` — hanya regenerate bila deskripsi projek/skor berubah ketara.
- Supabase RLS wajib aktif pada semua jadual sebelum go-live.

---

## 10. Struktur Folder Cadangan (Next.js App Router)

```
imex-ai-biz/
├── app/
│   ├── (judge)/
│   │   ├── login/page.tsx
│   │   ├── vote/[eventSlug]/page.tsx
│   │   └── ranking/[eventSlug]/page.tsx
│   ├── (dashboard)/
│   │   ├── login/page.tsx
│   │   └── project/[projectId]/page.tsx
│   ├── (admin)/
│   │   └── events/page.tsx
│   ├── api/
│   │   ├── scores/submit/route.ts
│   │   ├── reports/generate/route.ts
│   │   ├── reports/[projectId]/route.ts
│   │   └── pdf/[projectId]/route.ts
│   └── layout.tsx
├── components/
│   ├── FeasibilityGauge.tsx
│   ├── SwotTabs.tsx
│   ├── BlueprintCard.tsx
│   ├── PitchGenerator.tsx
│   └── PdfExportButton.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── gemini.ts
│   ├── feasibility.ts        # formula pengiraan skor
│   └── pdf/ReportDocument.tsx  # template @react-pdf/renderer
├── schemas/
│   └── ai-report.schema.ts   # Zod schema utk validasi output Gemini
└── supabase/
    └── migrations/*.sql
```
