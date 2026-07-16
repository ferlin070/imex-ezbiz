# Arahan Penuh untuk Antigravity — Bina MVP "IMEX AI-Biz"

> **Cara guna:** Paste keseluruhan dokumen ini sebagai prompt/mission pertama dalam Antigravity. Antigravity akan berfungsi sebagai agent yang merancang & menulis kod sendiri — arahan di bawah ditulis dalam bentuk brief + task breakdown supaya agent boleh plan & execute secara autonomi mengikut fasa.

---

## MISI

Bina MVP web app bernama **IMEX AI-Biz**: platform yang menukar skor penilaian juri pertandingan inovasi TVET/IKM kepada laporan perniagaan bersedia-geran (SWOT, blueprint, skrip pitching, PDF) menggunakan AI, plus modul input markah juri secara mobile-first.

Rujuk PRD dan Architecture Document yang disertakan (fail `01-PRD-IMEX-AI-Biz.md` dan `02-Architecture-IMEX-AI-Biz.md`) sebagai spesifikasi rasmi. Ikut struktur data, API routes, dan tech stack yang dinyatakan di situ **tanpa menyimpang**, kecuali jika ada sebab teknikal kukuh (nyatakan sebab jika ubah).

---

## TECH STACK (WAJIB)

- Next.js 16 (App Router, TypeScript, Server Components)
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + Realtime + RLS)
- Google Gemini API (structured JSON output mode)
- `@react-pdf/renderer` untuk jana PDF server-side
- Zod untuk validasi schema (termasuk validasi output AI)
- Deploy sasaran: Vercel

Jangan guna localStorage/sessionStorage untuk data penting — semua state kritikal (skor, laporan) mesti di Supabase.

---

## PRINSIP REKA BENTUK PENTING

1. **Skor juri ialah sumber kebenaran (source of truth).** AI TIDAK BOLEH mengarang atau mengubah nombor `feasibility_score`. Formula pengiraan mesti dilaksana di server (`lib/feasibility.ts`), bukan diserahkan kepada Gemini untuk "anggar".
2. **Semua panggilan Gemini API di server-side sahaja** (dalam API routes), API key disimpan dalam environment variable, tidak sesekali terdedah ke client bundle.
3. **Output AI mesti JSON berstruktur** — guna Gemini structured output / responseSchema, kemudian validate dengan Zod sebelum simpan ke DB. Jika validasi gagal, retry sekali sahaja, kalau gagal lagi return error state yang jelas ke UI (bukan crash).
4. **Cache hasil AI.** Simpan dalam jadual `ai_reports`; jangan panggil Gemini semula setiap kali dashboard dibuka — hanya bila user tekan "Jana Semula" atau data projek berubah.
5. **Mobile-first untuk modul Juri.** Rujuk gaya UI dalam poster asal: tema gelap (dark navy #0a1628-ish), aksen neon teal/cyan, kad dengan border halus, medal emoji untuk ranking.
6. **Bahasa Melayu sebagai bahasa default UI dan prompt AI.**

---

## FASA PEMBANGUNAN (Task Breakdown)

### FASA 0 — Setup Projek
- [ ] Init projek Next.js 16 (TypeScript, App Router, Tailwind).
- [ ] Setup Supabase project, sambungkan `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`).
- [ ] Install shadcn/ui, konfigurasi tema warna ikut palet dark navy/teal.
- [ ] Setup struktur folder ikut cadangan dalam Architecture Document (Seksyen 10).

### FASA 1 — Skema Pangkalan Data
- [ ] Jalankan migration SQL untuk jadual: `events`, `criteria`, `projects`, `judges`, `scores`, `ai_reports` (skema penuh ada dalam `02-Architecture-IMEX-AI-Biz.md` Seksyen 3 — salin terus).
- [ ] Aktifkan RLS pada semua jadual. Tulis policy:
  - `scores`: INSERT/UPDATE hanya oleh `judge_id` yang sepadan `auth.uid()`.
  - `projects`: SELECT hanya oleh `owner_user_id = auth.uid()` atau role admin.
  - `ai_reports`: SELECT hanya oleh pemilik projek berkaitan.
- [ ] Seed data contoh: 1 event ("Festival Inovasi IKM Besut 2026"), 3 kriteria (Persembahan, Semangat Berpasukan, Idea Boleh Dipasarkan), 4 projek contoh (F.O.C.U.S DRIVE, FOOD DRYER, Smart Grass Chopper, Mobile Poison Sprayer), 3 juri.

### FASA 2 — Auth
- [ ] Setup Supabase Auth: Magic Link atau OTP telefon untuk juri & usahawan (guna yang paling ringkas untuk implement dalam MVP — cadangan: email magic link dahulu).
- [ ] Middleware Next.js untuk lindungi route `(judge)` dan `(dashboard)` — redirect ke login jika belum sah.
- [ ] Role differentiation: simpan role (`judge` / `entrepreneur` / `admin`) dalam table `profiles` yang link ke `auth.users`.

### FASA 3 — Modul Juri (Judging)
- [ ] Halaman `/vote/[eventSlug]`: senarai projek untuk dinilai, borang markah ikut setiap kriteria (input slider/number, papar `max_score`).
- [ ] API `POST /api/scores/submit`: validasi juri log masuk, upsert ke jadual `scores` (guna `unique(project_id, judge_id, criteria_id)` untuk elak duplicate).
- [ ] Halaman `/ranking/[eventSlug]`: papar ranking realtime guna Supabase Realtime subscription pada jadual `scores`. Tab switcher: Keseluruhan / setiap kriteria. Papar medal 🥇🥈🥉 untuk top 3, peratusan markah, bilangan panel yang dah menilai.
- [ ] UI mesti mobile-first — uji pada viewport 375px lebar dahulu.

### FASA 4 — Formula Feasibility Score
- [ ] Tulis `lib/feasibility.ts`: fungsi murni (pure function) yang ambil array skor + kriteria (dengan weight & max_score), pulangkan `{ score: number, tier: string }`.
- [ ] Formula (rujuk Architecture Doc Seksyen 4):
  ```
  score% = ( Σ (avg_skor_kriteria / max_score_kriteria * weight) / Σ weight ) * 100
  ```
- [ ] Tier: <40% Merah/"Perlu Bimbingan", 40-59% Kuning/"Berpotensi Sederhana", 60-79% Biru/"Layak Komersial", 80-100% Hijau/"Sangat Berpotensi".
- [ ] Tulis unit test untuk formula ini (kes tepi: tiada skor langsung, satu juri sahaja, semua skor maksimum).

### FASA 5 — Integrasi Gemini AI
- [ ] Tulis `lib/gemini.ts`: fungsi `generateBusinessReport(project, scores, feasibilityResult)` yang:
  1. Bina prompt (rujuk Architecture Doc Seksyen 6 untuk contoh struktur).
  2. Panggil Gemini API dengan JSON schema dikunci (fields: `swot`, `blueprint`, `pitch_script`, `grant_notes`).
  3. Validate response dengan Zod schema (`schemas/ai-report.schema.ts`).
  4. Retry sekali jika parse/validate gagal.
- [ ] API route `POST /api/reports/generate`:
  - Auth check (pemilik projek sahaja).
  - Ambil data projek + skor dari Supabase.
  - Kira feasibility score (guna `lib/feasibility.ts`).
  - Panggil `generateBusinessReport`.
  - `upsert` hasil ke `ai_reports`.
  - Pulangkan JSON ke client.
- [ ] API route `GET /api/reports/[projectId]`: pulangkan laporan sedia ada dari cache (`ai_reports`) jika ada; jika tiada, beritahu client untuk trigger generate.
- [ ] Rate limit: had "Jana Semula" 1x setiap 5 minit per projek (boleh simpan timestamp dalam `ai_reports.generated_at` dan semak di server sebelum benarkan regenerate).

### FASA 6 — Dashboard Usahawan (UI)
- [ ] Halaman `/project/[projectId]`.
- [ ] Komponen `<FeasibilityGauge />`: gauge separuh bulatan SVG, jarum menunjuk skor, warna ikut tier, label peratus besar di tengah.
- [ ] Komponen `<SwotTabs />`: 4 tab (Strengths/Weaknesses/Opportunities/Threats), render list dari `ai_reports.swot`.
- [ ] Komponen `<BlueprintCard />`: 3 seksyen collapsible (Technical/Marketing/Financial), render dari `ai_reports.blueprint`.
- [ ] Komponen `<PitchGenerator />`: textarea readonly papar `pitch_script`, butang "Salin Skrip" (guna Clipboard API), toast confirmation lepas salin.
- [ ] State loading yang jelas semasa AI sedang generate (skeleton loader / progress indicator, bukan spinner kosong sahaja — beri mesej seperti "Menganalisis SWOT...", "Menjana skrip pitching...").
- [ ] Jika laporan belum wujud, papar butang "Jana Laporan AI Sekarang" yang trigger `/api/reports/generate`.

### FASA 7 — PDF Generator
- [ ] Tulis `lib/pdf/ReportDocument.tsx` guna `@react-pdf/renderer`: layout A4, header logo/tajuk projek, seksyen Feasibility Score, SWOT, Blueprint, Pitch Script, footer "Dijana oleh IMEX AI-Biz — [tarikh]".
- [ ] API route `GET /api/pdf/[projectId]`: render PDF stream, set header `Content-Disposition: attachment`.
- [ ] Komponen `<PdfExportButton />` di dashboard: klik → panggil route ini → auto-download, papar loading state semasa proses.

### FASA 8 — Admin Panel (Ringkas)
- [ ] Halaman `/admin/events`: CRUD event, kriteria, projek, juri (borang ringkas, table view — tak perlu kompleks untuk MVP).
- [ ] Papar status keseluruhan: jumlah projek, jumlah laporan AI dah dijana, jumlah juri aktif.

### FASA 9 — QA & Deploy
- [ ] Uji end-to-end: login juri → markah → ranking realtime kemas kini → login usahawan → jana laporan → muat turun PDF.
- [ ] Uji RLS: pastikan usahawan A tak boleh akses data projek usahawan B.
- [ ] Uji edge case: projek tanpa skor langsung (feasibility score = 0 / paparan "Belum Dinilai" bukan crash).
- [ ] Deploy ke Vercel, sambung environment variables production.
- [ ] Domain/URL sasaran: `imex-2026.vercel.app` (atau domain custom jika ada).

---

## SENARAI ENVIRONMENT VARIABLES

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

---

## DEFINITION OF DONE (MVP)

Projek dianggap siap MVP apabila:
1. Juri boleh log masuk, markah projek, dan lihat ranking realtime dari telefon.
2. Usahawan boleh log masuk, pilih projek sendiri, dan lihat Biz-Feasibility Gauge yang dikira daripada skor juri sebenar (bukan AI).
3. Dashboard memaparkan SWOT, Blueprint, dan Skrip Pitching yang dijana AI secara automatik dalam masa munasabah (< 15 saat) dengan loading state yang jelas.
4. Usahawan boleh muat turun laporan PDF lengkap dengan satu klik.
5. RLS aktif dan diuji — tiada kebocoran data antara pengguna.
6. Deploy berjaya di Vercel dan boleh diakses secara live.

---

## NOTA TAMBAHAN UNTUK AGENT

- Jangan reka angka kewangan tepat (RM sebenar) dalam prompt AI — arahkan Gemini beri anggaran berjulat sahaja, untuk elak liabiliti maklumat palsu dalam kertas kerja rasmi.
- Semua kod production-ready — bukan demo/prototype. Rujuk keutamaan Cloudhost: elak kod placeholder tanpa error handling.
- Jika mana-mana keputusan senibina perlu menyimpang daripada `02-Architecture-IMEX-AI-Biz.md`, catatkan sebab dalam komen kod atau README, jangan senyap ubah.
- Fasa 0-9 di atas adalah urutan cadangan — agent boleh jalankan tugas dalam fasa yang sama secara selari jika logik membenarkan (contoh: Fasa 3 dan 4 boleh selari).
