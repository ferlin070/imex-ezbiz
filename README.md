# IMEX EzBiz — Penjana Laporan Perniagaan Pintar Bersedia-Geran

IMEX EzBiz ialah sebuah platform digital pintar bersepadu (Next.js 16 / Supabase / Gemini AI) yang direka khas untuk membantu usahawan menstruktur dan menjana Laporan Rancangan Perniagaan pintar, melaksanakan penilaian kendiri kelayakan geran (feasibility check), serta memudahkan pegawai MARA membuat tapisan dan padanan geran usahawan i-MARATeCH secara automatik.

---

## 🛠️ Stack Teknologi

- **Framework:** Next.js 16 (App Router)
- **Pangkalan Data & Autentikasi:** Supabase
- **Kecerdasan Buatan:** Google Gemini API
- **Bahasa Pembangunan:** TypeScript
- **Ujian:** Native Node.js Test Runner dengan loader `tsx`

---

## 📋 Ciri-Ciri Utama

1. **Penilaian Kelayakan Pintar (Feasibility Check)**
   - Algoritma penilaian kendiri kelayakan berdasarkan kriteria pemarkahan i-MARATeCH 2021 untuk menganalisis idea, hasil inovasi, dan impak perniagaan usahawan.
2. **Penjanaan Laporan Perniagaan AI**
   - Menghasilkan analisis SWOT, Blueprint Teknikal, Pemasaran, Kewangan serta Skrip Pitch bersedia-geran menggunakan Gemini AI.
3. **Padanan Geran MARA Automatik**
   - Modul MARA Talent Scout memadankan usahawan dengan skim geran/pembiayaan MARA yang bersesuaian berdasarkan prestasi penilaian.
4. **Papan Pemuka Pentadbir (Admin Dashboard)**
   - Pengurusan Acara, Juri Penilai, Skim Geran, dan Produk Pembiayaan secara berpusat.
5. **Keselamatan yang Diperketatkan (Security Hardened)**
   - Sekatan pemintasan sesi ujian `MOCK_SESSION_FOR_TEST` di production.
   - Pengehadan saiz fail muat naik dokumen (Max 10MB) dengan sanitasi format fail (MIME) dan ekstensi.
   - Pengesahan peranan (Role validation) berpusat melalui helper `requireRole`.
   - Polisi Header Keselamatan HTTP (CSP, Frame Options, dsb.) aktif.

---

## ⚙️ Persediaan Persekitaran (`.env.local`)

Sediakan fail `.env.local` di direktori utama projek dengan pembolehubah berikut:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini AI API Configuration
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-1.5-flash # Model lalai (boleh dinaik taraf ke gemini-2.5-pro, dll.)
```

---

## 🚀 Arahan Menjalankan Projek Secara Lokal

### 1. Pasang Dependensi
```bash
npm install
```

### 2. Jalankan Server Pembangunan (Development)
```bash
npm run dev
```
Akses aplikasi melalui penyemak imbas di [http://localhost:3000](http://localhost:3000).

### 3. Jalankan Pengujian (Tests)
Projek ini dilengkapi dengan set ujian unit dan regresi keselamatan menggunakan Node test runner bawaan:
```bash
npm run test
```

### 4. Jalankan Linter
```bash
npm run lint
```

---

## 🔒 Hierarki Peranan Pengguna (Roles)

- **Usahawan (Entrepreneur):** Mengurus projek, mengisi borang penilaian kendiri, memohon skim pinjaman, dan melihat laporan analisis AI.
- **Juri / Penilai (Judge):** Menilai projek pertandingan i-MARATeCH dan memberikan markah mengikut kriteria.
- **Pegawai MARA (MARA Officer):** Memantau dashboard Talent Scout, membuat carian usahawan, mengurus senarai pendek geran, dan menilai permohonan pinjaman.
- **Admin (Super Admin):** Mengurus data juri, pendaftaran usahawan, skim geran, dan konfigurasi sistem.
