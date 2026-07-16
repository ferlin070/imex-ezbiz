# PRD — IMEX AI-Biz
**Product Requirements Document**
Versi: 1.0 | Tarikh: 16 Julai 2026 | Pemilik Produk: Cloudhost

---

## 1. Latar Belakang & Masalah

Peserta TVET / IKM (usahawan muda) sering menghasilkan inovasi teknikal yang kuat dari segi kejuruteraan, tetapi lemah dari segi **pengkomersialan**: mereka tidak tahu cara menulis kertas kerja permohonan geran (MARA, TEKUN, MDEC, Cradle), tidak yakin melakukan pitching kepada pelabur, dan tidak ada cara objektif untuk mengukur "kebolehsanaan pasaran" (market feasibility) produk mereka.

Pada masa yang sama, program seperti **Festival Inovasi IKM Besut** sudah mengumpul data penilaian juri (skor prestasi, semangat berpasukan, idea boleh dipasarkan) — tetapi data ni terhenti sebagai leaderboard sahaja, tidak digunakan untuk membantu usahawan membina strategi seterusnya.

**IMEX AI-Biz** menutup jurang ini: ia mengambil skor juri sebenar sebagai input sah (bukan tekaan AI semata-mata), dan menggunakan AI (Gemini) untuk menjana laporan perniagaan profesional (SWOT, blueprint, skrip pitching, laporan PDF) dalam masa saat, secara percuma.

---

## 2. Matlamat Produk (Goals)

1. Bagi setiap projek/inovasi yang telah dinilai juri, hasilkan **Biz-Feasibility Score (0–100%)** yang sah secara statistik daripada purata skor panel juri.
2. Jana **Analisis SWOT** dan **Actionable Blueprint** (Teknikal / Pemasaran / Kewangan) secara automatik guna AI, berdasarkan input inovasi + skor juri.
3. Jana **Skrip Elevator Pitch 60-saat** berstruktur Hook–Problem–Solution–CTA yang boleh disalin terus.
4. Hasilkan **Laporan PDF** siap cetak (grant-ready) dengan format sesuai untuk MARA / TEKUN / MDEC / Cradle — dengan satu butang.
5. Sediakan portal juri (panel) untuk input skor penilaian secara mudah alih (mobile-first, macam WhatsApp-style UI dalam poster).

## 3. Metrik Kejayaan (Success Metrics — MVP)

| Metrik | Sasaran MVP |
|---|---|
| Masa dari "select inovasi" → laporan PDF siap | < 15 saat (poster janji "5 saat" utk pengiraan skor, beri buffer utk AI call) |
| % usahawan yang muat turun laporan PDF | > 60% daripada yang log masuk dashboard |
| Kos konsultansi yang dijimatkan (nilai simbolik) | RM3,500+ setiap laporan (mesej pemasaran) |
| Ketepatan carta ranking juri vs input manual | 100% (data juri ialah sumber kebenaran, bukan AI) |

---

## 4. Pengguna Sasaran (Personas)

### 4.1 Juri / Panel Penilai
- Menilai projek semasa festival/pertandingan secara live guna telefon.
- Perlu UI ringkas: pilih projek → markah ikut kriteria (Persembahan, Semangat Berpasukan, Idea Boleh Dipasarkan, dsb.) → hantar.
- Boleh lihat ranking masa nyata.

### 4.2 Usahawan / Peserta (Entrepreneur)
- Selepas dinilai, log masuk dashboard, pilih inovasi sendiri.
- Mahu lihat Biz-Feasibility Gauge, SWOT, Blueprint, dan skrip pitching.
- Mahu muat turun/cetak laporan PDF untuk lampiran permohonan geran.

### 4.3 Admin / Penganjur (mis. TVETMARA Besut / DFK Inc)
- Cipta acara, tambah senarai projek & kriteria markah.
- Uruskan senarai juri & akses.
- Lihat papan pemuka keseluruhan (semua projek, ranking, status laporan dijana).

---

## 5. Skop Ciri — MVP

### Modul A: Penilaian Juri (Judging Module)
- [ ] Log masuk juri (kod akses ringkas / no. telefon)
- [ ] Senarai projek untuk dinilai
- [ ] Borang markah ikut kriteria (contoh dari poster: A. Persembahan, B. Semangat Berpasukan, C. Idea Boleh Dipasarkan — setiap satu ada sub-skor /65 atau /40 ikut rubrik)
- [ ] Hantar markah → simpan Supabase
- [ ] Papan Ranking Masa Nyata (Keseluruhan / ikut kategori) — paparan mobile macam contoh WhatsApp dalam poster

### Modul B: Dashboard Usahawan
- [ ] Log masuk usahawan (pautan/kod dikaitkan dengan projek)
- [ ] Pilih inovasi dari senarai projek mereka
- [ ] **Biz-Feasibility Gauge**: purata skor juri ditukar ke peratus, warna ikut julat:
  - <40% Merah, 40–59% Kuning, 60–79% Biru, 80–100% Hijau
- [ ] **Interactive SWOT Tabs**: Strengths / Weaknesses / Opportunities / Threats — dijana AI, boleh tab-switch
- [ ] **Actionable Blueprint**: 3 seksyen — Technical, Marketing, Financial/Business — dijana AI
- [ ] **Investor Pitch Generator**: skrip 60 saat, struktur Hook-Problem-Solution-CTA, butang "Salin Skrip"
- [ ] **Cetak Laporan PDF Satu Butang**: gabung semua di atas jadi 1 PDF profesional, sedia cetak

### Modul C: Enjin AI (Backend)
- [ ] API route yang panggil Gemini API dengan prompt berstruktur (input: nama projek, deskripsi, skor juri per kriteria)
- [ ] Output AI dipaksa dalam JSON berstruktur (SWOT array, blueprint object, pitch script string)
- [ ] Cache/simpan hasil AI dalam DB supaya tak perlu generate semula setiap kali buka dashboard (jimat kos API + laju)
- [ ] Butang "Jana Semula" (regenerate) — pilihan, bukan wajib MVP

### Modul D: Admin Panel (Ringkas)
- [ ] CRUD acara & projek
- [ ] CRUD juri (senarai akses)
- [ ] Papar status keseluruhan (berapa laporan dah dijana)

---

## 6. Di Luar Skop MVP (Out of Scope)

- Pembayaran / langganan (produk ini "RM0" untuk fasa MVP)
- Integrasi rasmi API MARA/TEKUN/MDEC/Cradle (kita hanya format laporan ikut keperluan mereka, bukan hantar terus)
- WhatsApp Bot dua-hala penuh (poster tunjuk mockup WhatsApp — untuk MVP cukup web dashboard responsive; notifikasi WhatsApp boleh jadi Fasa 2)
- Multi-bahasa penuh (fokus Bahasa Melayu dahulu, Inggeris pilihan Fasa 2)
- Analitik pelaburan lanjutan / matching dengan pelabur sebenar

---

## 7. Keperluan Bukan-Fungsian (Non-Functional Requirements)

- **Mobile-first**: majoriti juri & usahawan guna telefon (rujuk mockup poster: telefon dominan)
- **Prestasi**: hasil AI perlu dipaparkan dengan loading state jelas (skeleton/progress), sebab panggilan Gemini API + PDF generation ambil beberapa saat
- **Kebolehpercayaan skor**: skor juri adalah *source of truth* — AI tidak boleh mengubah angka skor, hanya mentafsir/menjana kandungan berdasarkan skor
- **Keselamatan**: RLS (Row Level Security) Supabase — usahawan hanya nampak data projek sendiri; juri hanya boleh markah, tak boleh edit markah juri lain
- **Kebolehcapaian**: laporan PDF mesti kemas untuk cetak (A4, format rasmi)

---

## 8. Andaian & Risiko

| Risiko | Kesan | Mitigasi |
|---|---|---|
| Gemini API output tidak konsisten (format JSON rosak) | Dashboard error / PDF kosong | Guna structured output prompt + validation + retry logic |
| Trafik tinggi semasa acara live (semua juri markah serentak) | Race condition pada skor | Guna Supabase transaction / realtime subscription betul |
| Kos API Gemini meningkat jika ramai regenerate | Kos operasi tinggi | Cache hasil, had regenerate rate |
| Data sensitif (skor juri) bocor | Reputasi acara terjejas | RLS ketat + auth wajib semua route |

---

## 9. Timeline Cadangan (MVP)

| Fasa | Tempoh | Output |
|---|---|---|
| 1. Setup & Skema DB | 1–2 hari | Repo Next.js + Supabase schema siap |
| 2. Modul Juri | 2–3 hari | Borang markah + ranking realtime |
| 3. Modul Dashboard Usahawan (UI) | 2–3 hari | Gauge, SWOT tabs, Blueprint (data statik dulu) |
| 4. Integrasi Gemini AI | 2 hari | SWOT/Blueprint/Pitch dijana automatik |
| 5. PDF Generator | 1–2 hari | Cetak laporan satu butang |
| 6. Admin Panel Ringkas | 1 hari | CRUD acara/projek/juri |
| 7. QA + Deploy Vercel | 1 hari | imex-2026.vercel.app live |

**Anggaran total: ~2 minggu untuk MVP fungsian penuh.**
