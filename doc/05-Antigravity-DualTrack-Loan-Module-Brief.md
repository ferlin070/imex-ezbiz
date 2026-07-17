# Arahan untuk Antigravity — Modul "Laluan Berganda MARA" + Pendaftaran Manual Usahawan + Modul Pinjaman MARA

> **Cara guna:** Paste dokumen ini sebagai mission baru dalam Antigravity, rujuk repo `imex-ezbiz` sedia ada. Ini adalah **extension** kepada IMEX AI-Biz (rujuk `doc/01`–`doc/04`, terutamanya `doc/04-Antigravity-MARA-Scout-Module-Brief.md` yang dah dibina — search, shortlist, grant-match, analytics semua dah wujud). **JANGAN** ubah struktur/skema/logik sedia ada (Modul Juri, Dashboard Usahawan, Enjin AI, Modul MARA Scout) kecuali dinyatakan eksplisit di bawah.

---

## 0. MASALAH DENGAN WORKFLOW SEDIA ADA (sebab arahan ini dibuat)

Selepas semak kod sedia ada (`supabase/migrations/`, `app/`), berikut isu yang dikenal pasti:

1. **`projects.event_id` adalah `NOT NULL`** — bermakna setiap projek WAJIB tergolong dalam satu `event` (pertandingan). Usahawan yang **tidak** menyertai mana-mana festival/pertandingan langsung **tidak boleh** masuk ke dalam sistem. Ini menyekat usahawan MARA sedia ada yang cuma nak mohon geran/pinjaman terus, tanpa lalui penilaian juri.
2. **`feasibility_score` hanya boleh datang dari purata skor juri** (`lib/feasibility.ts`) — tiada laluan alternatif untuk projek yang tiada juri menilai. Ini bagus untuk integriti skor pertandingan, tapi jadi halangan untuk usahawan yang mohon terus ke MARA.
3. **`events` tidak membezakan** antara "pertandingan/festival IKM" dengan "program pengambilan/geran MARA" — kedua-dua guna struktur sama, jadi pegawai MARA tak boleh cipta "Program MARA Besut Q3 2026" sebagai acara berasingan untuk tujuan pengambilan usahawan (bukan pertandingan).
4. **Tiada borang pendaftaran perniagaan lengkap.** Jadual `projects` sedia ada cuma ada `title`, `description`, `category`, `team_members` — tiada medan yang MARA sebenarnya perlukan untuk analisis kelayakan geran/pinjaman (no. SSM, status Bumiputera, peringkat perniagaan, hasil bulanan, keperluan modal, pecahan penggunaan dana, dll).
5. **Tiada modul pinjaman (loan) langsung** — sistem sedia ada hanya padankan geran (`grant_matches`), tiada apa-apa untuk **Pinjaman MARA** (loan product, permohonan, kiraan bayaran balik/amortization).

Modul ini membetulkan kelima-lima isu di atas **tanpa memecahkan** apa yang sedia ada, dengan menambah "laluan berganda" (dual-track) dan jadual/route baru sahaja.

---

## 1. KONSEP LALUAN BERGANDA (Dual-Track)

Setiap usahawan, semasa daftar, pilih **satu** laluan:

- **Laluan A — "Sertai Program/Pertandingan"**: laluan sedia ada, tiada perubahan. Usahawan sertai `event` (festival/pertandingan), dinilai juri, `feasibility_score` dikira daripada skor juri (`score_source = 'judge_verified'`). Selepas itu, layak masuk carian MARA Scout seperti biasa (jika `mara_visible = true`).
- **Laluan B — "Mohon Terus ke MARA"** *(BARU)*: usahawan **tidak perlu** sertai pertandingan. Mereka isi **borang pendaftaran perniagaan lengkap** (Seksyen 3) terus dalam sistem. `feasibility_score` untuk laluan ini dikira daripada **borang penilaian-kendiri** (self-assessment) berformat sama (bukan tekaan bebas AI), ditanda `score_source = 'self_declared'` supaya pegawai MARA sentiasa tahu ini BUKAN skor juri sah — konsisten dengan prinsip asal sistem: *"skor juri ialah source of truth, AI tak boleh mengubah angka"*. Selepas hantar, projek terus masuk ke peti masuk (inbox) pegawai MARA untuk semakan (tak perlu `mara_visible` toggle berasingan — laluan B secara automatik untuk tujuan MARA).

**Program MARA sebagai jenis `event` baru**: MARA officer/admin boleh cipta `event` berjenis `mara_program` (bukan `competition`) — contoh "Program Pengambilan Usahawan MARA Besut Q3 2026" — di mana pegawai MARA sendiri boleh jadi "juri"/penilai program (guna struktur `judges`+`scores` sedia ada, role dikekalkan `judge` dalam DB tapi label UI "Penilai Program MARA"). Ini bagi MARA yang nak run sesi penilaian formal sendiri, berasingan daripada Festival Inovasi IKM.

---

## 2. GARIS PANDUAN & LARANGAN (WAJIB BACA DULU)

1. **JANGAN ubah** logik pengiraan `feasibility_score` sedia ada dalam `lib/feasibility.ts` untuk projek Laluan A. Cipta fungsi **baharu** berasingan `lib/selfAssessment.ts` untuk Laluan B — jangan gabungkan dalam fungsi yang sama.
2. **JANGAN buang** kekangan `NOT NULL` pada `projects.event_id` dengan cara yang memecahkan query sedia ada — buat migration yang betul (`ALTER COLUMN event_id DROP NOT NULL`) dan **audit semua** query/RLS policy sedia ada yang assume `event_id` wujud (contoh: polisi RLS `projects` yang join ke `judges` melalui `event_id` — pastikan tak error bila `event_id` NULL, guna `coalesce`/short-circuit logic).
3. **Setiap projek WAJIB ada `entry_type`** (`'event' | 'direct'`) — field ini yang tentukan UI, bukan tekaan berdasarkan `event_id IS NULL`.
4. **Skor `self_declared` TIDAK BOLEH bercampur** dengan skor `judge_verified` dalam mana-mana carta perbandingan/ranking sedia ada (papan ranking pertandingan). Papar label jelas "Penilaian Kendiri — Belum Disahkan Juri" di semua tempat skor Laluan B dipaparkan (dashboard usahawan, profil calon MARA, analytics).
5. **Modul Pinjaman HANYA kalkulator + borang permohonan** — **JANGAN** bina apa-apa pemindahan wang/pembayaran sebenar, integrasi perbankan, atau API pencairan pinjaman rasmi MARA. Ini format & kira sahaja, sama macam had MVP asal untuk geran (rujuk `doc/01` Seksyen 6 — di luar skop).
6. **Jangan reka nombor kadar faedah/keuntungan (profit rate) MARA sebenar.** Guna medan `profit_rate_percent` yang **admin isi** dalam `loan_products` (bukan AI/hardcode) — supaya boleh dikemaskini ikut kadar rasmi MARA tanpa ubah kod.
7. **Setiap akses pegawai MARA kepada permohonan pinjaman/borang Laluan B mesti direkod** dalam `mara_access_log` sedia ada (tambah kolum `resource_type` supaya boleh bezakan akses kepada projek biasa vs permohonan pinjaman — jangan cipta jadual log baru berasingan).
8. **Panggilan Gemini API (jika ada, untuk self-assessment feasibility) mesti server-side sahaja**, structured JSON + Zod, ikut pola sedia ada dalam `lib/gemini.ts`.
9. Sebarang migration SQL baru mesti fail berasingan (`supabase/migrations/00X_dual_track_loan.sql`), **jangan edit** migration sedia ada.
10. **Dapatkan pengesahan saya dulu** sebelum: merge ke main, deploy ke Vercel, atau tambah dependency npm baru yang tak disenaraikan di Seksyen 4.
11. Kod mesti production-ready — tiada placeholder/TODO tanpa error handling. Setiap API route mesti ada try/catch + status code yang betul + tidak boleh throw unhandled exception (rujuk Seksyen 9 — Security & Deployment).
12. Ikut struktur fasa dengan **checkpoint review** — jangan gabung fasa, jangan skip checkpoint tanpa pengesahan saya.

---

## 3. MEDAN BORANG PENDAFTARAN PERNIAGAAN (Laluan B — Mohon Terus ke MARA)

Ini medan yang MARA sebenarnya perlukan untuk analisis kelayakan geran/pinjaman (rujuk keperluan biasa permohonan MARA):

**A. Maklumat Perniagaan**
- Nama perniagaan/syarikat
- No. pendaftaran SSM (jika ada — boleh kosong jika belum berdaftar rasmi, ada checkbox "Belum Berdaftar SSM")
- Jenis entiti (Milikan Tunggal / Perkongsian / Sdn Bhd / Belum Berdaftar)
- Tarikh mula beroperasi
- Alamat perniagaan + negeri + daerah
- Sektor/kategori (guna senarai `sector_tags` sedia ada dari `grant_schemes` supaya konsisten dengan grant matching)

**B. Maklumat Usahawan**
- Nama penuh, No. KP
- Status Bumiputera (Ya/Tidak — kriteria kelayakan MARA)
- Umur, tahap pendidikan/latihan TVET (jika berkaitan)
- No. telefon, e-mel

**C. Peringkat & Prestasi Perniagaan**
- Peringkat semasa: Idea / Prototaip / Beroperasi <1 tahun / Beroperasi 1-3 tahun / Beroperasi >3 tahun
- Hasil jualan bulanan purata (RM) — pilihan julat, bukan wajib angka tepat (elak stigma/data sensitif tak perlu)
- Bilangan pekerja semasa

**D. Keperluan Kewangan**
- Jumlah modal/geran/pinjaman yang dipohon (RM)
- Pecahan penggunaan dana (cth: 40% peralatan, 30% modal pusingan, 30% pemasaran — borang dinamik tambah baris)
- Ada pinjaman/geran sedia ada dari agensi lain? (Ya/Tidak + butiran ringkas)

**E. Pasaran & Produk**
- Deskripsi produk/perkhidmatan (sama field `description` sedia ada — reuse)
- Pasaran sasaran
- Kelebihan berbanding pesaing (USP)

**F. Dokumen Sokongan (upload, guna Supabase Storage)**
- Sijil SSM (jika ada)
- Foto produk/premis (min 1, max 5)
- Business plan/proposal ringkas (PDF, pilihan)

Semua ini disimpan dalam jadual baru `business_profiles` (Seksyen 5) — **jangan** tambah semua medan ini terus ke `projects` (elak jadual jadi terlalu lebar dan pecahkan RLS/query sedia ada).

---

## 4. TECH STACK TAMBAHAN

Guna stack sedia ada (Next.js 16, Supabase, Gemini, Zod, shadcn/ui, `@react-pdf/renderer`). Cadangan tambahan (**perlu pengesahan saya dulu sebelum install**):
- Tiada library baru untuk kalkulator pinjaman — kira amortization terus dalam TypeScript biasa (formula standard reducing-balance), tiada keperluan `decimal.js` melainkan Antigravity jumpa isu ketepatan float semasa testing — kalau ya, cadangkan dulu sebelum tambah.
- Supabase Storage (bukan dependency npm — ciri sedia ada Supabase) untuk upload dokumen Seksyen 3F.

---

## 5. SKEMA PANGKALAN DATA BARU (TAMBAHAN/ALTER SAHAJA)

```sql
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

-- Pastikan: jika entry_type = 'direct', event_id mesti NULL; jika 'event', event_id mesti wujud.
alter table projects add constraint chk_entry_type_event_id
  check (
    (entry_type = 'event' and event_id is not null)
    or (entry_type = 'direct' and event_id is null)
  );

-- ========== BUSINESS PROFILE (Laluan B — Seksyen 3 A-E) ==========
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
  monthly_revenue_range text,                -- julat, bukan angka tepat: '0-5000' | '5000-20000' dsb.
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

-- ========== SUPPORTING DOCUMENTS ==========
create table business_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  doc_type text not null,                    -- 'ssm_cert' | 'product_photo' | 'business_plan'
  storage_path text not null,                -- path dalam Supabase Storage bucket
  uploaded_at timestamptz default now()
);

-- ========== SELF-ASSESSMENT (Laluan B — pengganti skor juri) ==========
create table self_assessments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade unique,
  responses jsonb not null,                  -- jawapan soalan penilaian-kendiri berstruktur
  computed_score numeric not null,           -- dikira server-side ikut formula tetap (BUKAN AI), sama skema tier ikut lib/feasibility.ts
  submitted_at timestamptz default now()
);

-- ========== LOAN PRODUCTS (skim pinjaman MARA — diselenggara admin) ==========
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

-- ========== LOAN APPLICATIONS ==========
create table loan_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  loan_product_id uuid references loan_products(id),
  requested_amount_myr numeric not null,
  requested_tenure_months int not null,
  purpose text,
  status text default 'submitted'
    check (status in ('draft', 'submitted', 'under_review', 'approved', 'rejected')),
  officer_id uuid references auth.users(id),  -- pegawai yang review
  officer_notes text,
  approved_amount_myr numeric,
  approved_tenure_months int,
  approved_rate_percent numeric,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- ========== LOAN REPAYMENT SNAPSHOT (hanya simpan bila status = 'approved', untuk audit) ==========
create table loan_repayment_schedules (
  id uuid primary key default gen_random_uuid(),
  loan_application_id uuid references loan_applications(id) on delete cascade unique,
  schedule jsonb not null,                    -- array {month, installment, principal, profit, balance}
  monthly_installment_myr numeric not null,
  total_repayment_myr numeric not null,
  total_profit_myr numeric not null,
  generated_at timestamptz default now()
);

-- ========== ALTER: mara_access_log — bezakan jenis resource ==========
alter table mara_access_log add column if not exists resource_type text default 'project'
  check (resource_type in ('project', 'loan_application', 'business_profile'));
```

**Row Level Security — polisi baru:**
- `business_profiles`, `business_documents`, `self_assessments`: SELECT/INSERT/UPDATE hanya `owner_user_id` projek berkaitan (join ke `projects`) ATAU role `admin`/`mara_officer` (read-only untuk mara_officer, ikut polisi sedia ada `mara_visible`/`entry_type = 'direct'` — Laluan B automatik boleh dilihat MARA, tak perlu toggle consent berasingan sebab usahawan dah secara eksplisit pilih "Mohon Terus ke MARA").
- `loan_products`: SELECT semua authenticated; write admin sahaja.
- `loan_applications`: usahawan hanya SELECT/INSERT rekod projek sendiri; UPDATE status hanya `mara_officer`/`admin`.
- `loan_repayment_schedules`: SELECT untuk pemilik projek, `mara_officer`, `admin`. INSERT hanya server-side (service role) semasa approval.

---

## 6. FORMULA KIRAAN BAYARAN BALIK PINJAMAN (`lib/loanCalculator.ts`)

Guna kaedah **reducing balance** (baki berkurangan) standard, bukan flat-rate (lebih adil, standard industri):

```
kadar_bulanan = profit_rate_percent / 100 / 12
bayaran_bulanan = P * r * (1+r)^n / ((1+r)^n - 1)
  di mana P = jumlah pinjaman, r = kadar_bulanan, n = tempoh (bulan)

Untuk setiap bulan:
  faedah_bulan = baki_semasa * r
  prinsipal_bulan = bayaran_bulanan - faedah_bulan
  baki_baru = baki_semasa - prinsipal_bulan
```

Fungsi `generateRepaymentSchedule(principal, ratePercent, tenureMonths)` pulangkan:
`{ monthlyInstallment, totalRepayment, totalProfit, schedule: [{month, installment, principal, profit, balance}] }`

- Ini fungsi **pure function**, tiada side-effect, senang unit test (tambah dalam `tests/loanCalculator.test.ts` ikut pola `tests/feasibility.test.ts` sedia ada).
- Kalkulator ini dipaparkan **interaktif** kepada usahawan (slaid/input jumlah + tempoh → papar anggaran bayaran bulanan **sebelum** mereka hantar permohonan rasmi) — guna produk pinjaman yang admin dah setkan `profit_rate_percent`, bukan usahawan isi kadar sendiri.

---

## 7. REKA BENTUK API ROUTES BARU

```
/app/api/projects/register-direct/route.ts     POST   → daftar projek Laluan B (project + business_profile serentak, transaction)
/app/api/projects/self-assessment/route.ts      POST   → hantar borang penilaian-kendiri, kira computed_score server-side
/app/api/documents/upload/route.ts              POST   → upload dokumen sokongan ke Supabase Storage, simpan row business_documents
/app/api/loan-products/route.ts                 GET    → senarai skim pinjaman aktif (public/authenticated)
/app/api/admin/loan-products/route.ts           CRUD   → admin urus skim pinjaman
/app/api/loans/calculate/route.ts               POST   → panggil lib/loanCalculator.ts, pulangkan jadual (TANPA simpan DB — preview sahaja)
/app/api/loans/apply/route.ts                   POST   → usahawan hantar permohonan pinjaman rasmi (loan_applications)
/app/api/loans/[applicationId]/review/route.ts  PATCH  → pegawai MARA approve/reject + auto-generate loan_repayment_schedules bila approved
/app/api/mara/inbox/route.ts                    GET    → senarai permohonan Laluan B + permohonan pinjaman baru untuk semakan pegawai (gabung dgn /api/mara/search sedia ada tapi filter application_status)
/app/api/admin/events/route.ts                  PATCH  → (extend sedia ada) tambah medan event_type semasa cipta acara
```

### Alur `/api/projects/register-direct`
1. Sahkan pengguna log masuk, role `entrepreneur`.
2. Validasi payload penuh ikut Zod schema (`schemas/business-profile.schema.ts`) — semua medan Seksyen 3 A-E.
3. Dalam satu Supabase transaction: `insert` ke `projects` (`entry_type='direct'`, `event_id=null`, `application_status='submitted'`), lepas tu `insert` ke `business_profiles` dengan `project_id` yang baru.
4. Jika transaction gagal separuh jalan — rollback penuh, pulangkan error jelas (jangan biar projek "orphan" tanpa business_profile).
5. Pulangkan `project_id` untuk redirect ke halaman self-assessment.

### Alur `/api/loans/[applicationId]/review`
1. Sahkan role `mara_officer`/`admin`.
2. Rekod ke `mara_access_log` (`resource_type='loan_application'`).
3. Jika `status='approved'`: wajib `approved_amount_myr`, `approved_tenure_months`, `approved_rate_percent` diisi pegawai.
4. Panggil `generateRepaymentSchedule(...)` server-side, `insert` ke `loan_repayment_schedules`.
5. `update` `loan_applications.status`, `reviewed_at`.
6. (Pilihan Fasa 2 — bukan wajib MVP) hantar notifikasi e-mel/WhatsApp kepada usahawan.

---

## 8. KOMPONEN UI BARU

| Halaman/Komponen | Fungsi |
|---|---|
| `/app/register/track/page.tsx` | Skrin pilihan laluan pertama kali daftar: "Sertai Program/Pertandingan" vs "Mohon Terus ke MARA" — kad besar dengan penjelasan ringkas setiap satu |
| `/app/register/direct/page.tsx` | Borang pendaftaran perniagaan penuh (Seksyen 3), multi-step (Maklumat Perniagaan → Usahawan → Kewangan → Dokumen), progress indicator |
| `<BusinessProfileForm />` | Komponen borang reusable, guna React Hook Form + Zod resolver (jika sedia ada dependency form library dalam projek — kalau tiada, cadangkan `react-hook-form` dulu sebelum install) |
| `/app/register/direct/self-assessment/page.tsx` | Borang penilaian-kendiri (soalan berstruktur setara kriteria juri) → papar `computed_score` dengan label jelas "Penilaian Kendiri" |
| `<SelfDeclaredBadge />` | Badge visual (warna kelabu/outline, bukan solid) dipaparkan di mana-mana skor `score_source='self_declared'` dipaparkan — supaya jelas beza dgn skor juri |
| `/app/loans/page.tsx` | Senarai skim pinjaman MARA aktif untuk usahawan semak |
| `<LoanCalculatorWidget />` | Kalkulator interaktif: input jumlah + tempoh (slider/input), papar anggaran bayaran bulanan + jadual amortization collapsible, panggil `/api/loans/calculate` |
| `/app/loans/apply/[loanProductId]/page.tsx` | Borang permohonan pinjaman rasmi, prefill dari `business_profile` projek sedia ada usahawan |
| `/app/(mara)/inbox/page.tsx` | Peti masuk pegawai MARA — tab "Permohonan Laluan Terus", "Permohonan Pinjaman", disusun ikut tarikh hantar, badge status |
| `<LoanReviewPanel />` | Panel semakan pegawai: papar borang penuh usahawan + kalkulator (pegawai boleh laraskan jumlah/tempoh/kadar diluluskan) + butang Lulus/Tolak + textarea nota |
| `/app/admin/loan-products/page.tsx` | CRUD skim pinjaman (nama, julat jumlah, kadar, tempoh, sektor) — ikut pola `/app/admin/grant-schemes` sedia ada |
| `/app/admin/events/page.tsx` | (Kemaskini sedia ada) tambah pilihan `event_type` semasa cipta acara: "Pertandingan/Festival" vs "Program MARA" |

**Tema visual:** kekal konsisten dengan sistem sedia ada. Laluan B / skor self-declared guna aksen warna **kelabu/neutral** (bukan hijau/biru tier sedia ada) untuk elak keliru dengan skor juri yang disahkan.

---

## 9. KESELAMATAN & KEBOLEHPERCAYAAN DEPLOYMENT (WAJIB, bukan pilihan)

Ikuti template audit keselamatan/production-readiness generik yang saya dah ada (kalau Antigravity tak jumpa fail template tersebut dalam repo, guna checklist minimum di bawah sebagai gantinya):

### 9.1 Validasi & Error Handling
- **Setiap** API route baru mesti Zod-validate payload masuk SEBELUM apa-apa query DB — tolak dgn 400 + mesej jelas jika gagal.
- **Setiap** API route mesti try/catch, log error server-side, pulangkan mesej generic ke client (jangan bocorkan stack trace/SQL error mentah ke frontend).
- Transaction DB (register-direct, loan approval) mesti rollback penuh bila gagal separuh jalan — uji secara eksplisit (simulasi kegagalan insert kedua).
- Semua borang frontend (BusinessProfileForm, LoanApply) mesti ada client-side validation SEBELUM submit, tapi **jangan** percaya client-side sahaja — server tetap validate semula.

### 9.2 RLS & Kebenaran Akses
- Uji: usahawan Laluan B **tidak boleh** nampak `business_profiles`/`loan_applications` usahawan lain.
- Uji: `mara_officer` **tidak boleh** UPDATE/DELETE `business_profiles` atau `self_assessments` (read-only + shortlist/review mereka sendiri sahaja, sama prinsip Modul Scout sedia ada).
- Uji: `entry_type='direct'` projek yang `application_status='draft'` (belum submit) **tidak** muncul dalam inbox MARA.
- Uji constraint `chk_entry_type_event_id` — pastikan tak boleh insert projek dengan kombinasi `entry_type`/`event_id` yang salah.

### 9.3 Concurrency & Beban
- Kalkulator pinjaman (`/api/loans/calculate`) tiada write DB — pastikan stateless & tak jadi bottleneck (boleh compute client-side juga sebagai fallback jika server sesak, tapi versi rasmi untuk `loan_applications.approved_*` mesti dikira server-side untuk konsistensi audit).
- Uji borang pendaftaran direct + self-assessment dihantar serentak oleh beberapa pengguna — pastikan tiada race condition pada `unique` constraint (`business_profiles.project_id`, `self_assessments.project_id`).

### 9.4 Build & Deploy — elak crash produksi
- Jalankan `npm run build` (Next.js production build) sebelum sebarang deploy — laporkan sebarang TypeScript/ESLint error, jangan `--no-verify` skip.
- Jalankan semua ujian sedia ada (`tests/feasibility.test.ts`) + ujian baru (`tests/loanCalculator.test.ts`) — semua mesti lulus.
- Semak semua environment variable baru (jika ada, cth Supabase Storage bucket name) disenaraikan dalam `.env.example` — **jangan** hardcode secret.
- Deploy ke **Vercel Preview** dahulu (bukan production) — uji manual alur penuh: daftar Laluan B → isi borang → self-assessment → mohon pinjaman → officer review/approve → semak jadual bayaran.
- Sediakan **rollback plan** ringkas (Vercel: revert ke deployment sebelumnya satu klik) — sebut dalam PR description.
- **Dapatkan pengesahan saya dulu** sebelum promote Preview → Production.

### 9.5 Kos & Rate Limit
- Jika self-assessment guna Gemini API untuk apa-apa penjanaan teks (bukan skor — skor tetap formula server-side), had kadar sama macam sedia ada (`doc/02` Seksyen 9 — regenerate 1x/5min).

---

## 10. FASA PEMBANGUNAN (Task Breakdown)

### FASA D0 — Migration & Constraint
- [ ] Migration SQL penuh (Seksyen 5) — `events.event_type`, `projects` (drop not null, `entry_type`, `score_source`, `application_status`, constraint), semua jadual baru + RLS.
- [ ] Audit SEMUA query/RLS sedia ada yang guna `projects.event_id` — pastikan tiada regresi bila NULL dibenarkan.
- [ ] **Checkpoint review** — tunjuk saya migration + hasil audit sebelum teruskan.

### FASA D1 — Pilihan Laluan & Pendaftaran Direct
- [ ] `/app/register/track/page.tsx` — skrin pilihan laluan.
- [ ] `schemas/business-profile.schema.ts` — Zod schema penuh Seksyen 3.
- [ ] `<BusinessProfileForm />` multi-step + `/app/register/direct/page.tsx`.
- [ ] `/api/projects/register-direct/route.ts` (transaction, rollback teruji).
- [ ] `/api/documents/upload/route.ts` + Supabase Storage bucket setup.
- [ ] **Checkpoint review.**

### FASA D2 — Penilaian Kendiri
- [ ] `lib/selfAssessment.ts` — formula computed_score (dokumenkan formula dgn jelas, sama pattern `lib/feasibility.ts`).
- [ ] `/app/register/direct/self-assessment/page.tsx` + `/api/projects/self-assessment/route.ts`.
- [ ] `<SelfDeclaredBadge />` — pasang di SEMUA tempat skor dipaparkan (dashboard usahawan, profil calon MARA, hasil carian, analytics) untuk projek `score_source='self_declared'`.
- [ ] **Checkpoint review** — semak formula & label UI sebelum teruskan.

### FASA D3 — Program MARA (Event Type)
- [ ] Kemaskini `/app/admin/events` — pilihan `event_type` semasa cipta acara.
- [ ] Kemaskini label UI Modul Juri: bila `event_type='mara_program'`, papar "Penilai Program MARA" bukan "Juri" (label sahaja, struktur DB kekal `judges`/`scores`).

### FASA D4 — Skema & CRUD Produk Pinjaman
- [ ] Migration `loan_products` (dah termasuk Seksyen 5) + seed 2-3 skim contoh (kadar/tempoh realistik, admin boleh edit).
- [ ] `/app/admin/loan-products/page.tsx` CRUD.
- [ ] **Checkpoint review.**

### FASA D5 — Kalkulator & Permohonan Pinjaman
- [ ] `lib/loanCalculator.ts` (Seksyen 6) + `tests/loanCalculator.test.ts` (uji reducing balance, edge case tempoh 1 bulan, jumlah RM0).
- [ ] `<LoanCalculatorWidget />` + `/app/loans/page.tsx`.
- [ ] `/api/loans/calculate/route.ts` (preview, tiada write DB).
- [ ] `/app/loans/apply/[loanProductId]/page.tsx` + `/api/loans/apply/route.ts`.
- [ ] **Checkpoint review** — semak ketepatan kiraan (bandingkan manual dgn kalkulator kewangan luar) sebelum teruskan.

### FASA D6 — Semakan Pegawai MARA (Inbox & Review)
- [ ] `/api/mara/inbox/route.ts` — gabung permohonan direct + pinjaman.
- [ ] `/app/(mara)/inbox/page.tsx` + `<LoanReviewPanel />`.
- [ ] `/api/loans/[applicationId]/review/route.ts` — approval generate `loan_repayment_schedules`.
- [ ] Kemaskini `mara_access_log` — `resource_type` dicatat betul untuk setiap jenis akses.
- [ ] **Checkpoint review.**

### FASA D7 — Security, Testing & Deployment (WAJIB, rujuk Seksyen 9)
- [ ] Jalankan checklist penuh 9.1–9.5.
- [ ] Uji end-to-end Laluan B lengkap: pilih laluan → daftar perniagaan → upload dokumen → self-assessment → lihat kalkulator pinjaman → mohon pinjaman → pegawai MARA semak & lulus → usahawan lihat jadual bayaran diluluskan.
- [ ] Uji end-to-end Laluan A masih berfungsi tanpa regresi (juri markah → ranking → dashboard usahawan → PDF — semua sedia ada).
- [ ] `npm run build` bersih, semua test lulus.
- [ ] Deploy ke Vercel Preview, saya semak manual, **baru** minta pengesahan promote ke Production.

---

## 11. DEFINITION OF DONE

1. Usahawan boleh pilih antara dua laluan semasa daftar; kedua-dua laluan berfungsi tanpa memecahkan satu sama lain.
2. Usahawan Laluan B boleh isi borang perniagaan penuh (Seksyen 3), upload dokumen, dan dapat skor penilaian-kendiri yang jelas dilabel berbeza daripada skor juri.
3. Pegawai MARA boleh cipta "Program MARA" sebagai jenis acara berasingan daripada pertandingan biasa, dan menilai peserta program tersebut.
4. Skim pinjaman MARA boleh diurus admin; usahawan boleh guna kalkulator bayaran balik sebelum mohon rasmi.
5. Permohonan pinjaman boleh dihantar, disemak, diluluskan/ditolak oleh pegawai MARA, dengan jadual bayaran balik dijana automatik & disimpan untuk audit bila diluluskan.
6. Tiada percampuran skor juri sah dengan skor penilaian-kendiri di mana-mana paparan.
7. Semua RLS, transaction rollback, dan audit log diuji dan berfungsi.
8. `npm run build` + semua ujian lulus; deploy Preview disahkan manual sebelum Production.

---

## 12. NOTA TAMBAHAN UNTUK AGENT

- Fokus utama modul ini: **integriti data** (jangan sesekali biar skor self-declared nampak macam skor juri sah) dan **kebolehpercayaan kalkulator kewangan** (nombor bayaran balik yang salah = risiko reputasi tinggi untuk agensi kerajaan).
- Jika Antigravity jumpa konflik antara arahan ini dengan struktur sedia ada yang tak disebut di sini (cth: nama kolum berbeza dari jangkaan), **berhenti dan tanya saya dulu** — jangan andaikan dan teruskan.
- Modul pinjaman ini **format & kira sahaja** — bila sampai ke peringkat pencairan sebenar/integrasi sistem kewangan rasmi MARA, itu di luar skop sepenuhnya (sama macam had geran sedia ada).
