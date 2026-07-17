# MARA AI-Advisor — Agentic AI Eligibility Checker & Advisor for MARA Loans/Grants

MARA AI-Advisor ialah sistem digital bersepadu (Next.js 16 / Supabase / Gemini AI) yang bertindak sebagai **Penyemak & Penasihat Kelayakan Usahawan MARA**. Sistem ini menilai kelayakan SSM dan dokumen secara deterministik melalui Rules Engine berpusat, serta menjana pelan tindakan langkah demi langkah menggunakan AI Penasihat jika pemohon belum melepasi kriteria kelayakan.

---

## 🏗️ Struktur Projek Restructured

Projek ini distruktur semula mengikut susunan modular:

```
imex-ezbiz/
├── apps/
│   └── web/                     # Aplikasi UI Next.js usahawan + dashboard pegawai
├── services/
│   ├── eligibility-engine/      # Rules engine deterministik (bukan LLM) — kriteria MARA
│   ├── ai-advisor/              # Modul LLM: jana cadangan/actionable steps
│   ├── guardrail/               # Validator output AI (domain-lock MARA sahaja)
│   └── integration/             # Integrasi data luar (mock SSM/ezbiz registry)
├── data/
│   └── criteria-config/         # Fail konfigurasi kriteria kelayakan (rules.json)
├── audit/
│   └── decision-logs/           # Log keputusan semakan bertulis (JSON format)
└── docs/
    └── sop-mara/                # Dokumen rujukan SOP rasmi kelayakan MARA
```

---

## 📋 Ciri-Ciri Utama

1. **Semakan Kelayakan Deterministik (Rules Engine)**
   - Pemarkahan kelayakan dikira berasaskan rules configuration `data/criteria-config/rules.json` (umur pemilik, status SSM, haul perniagaan, Bumiputera, kelengkapan dokumen) tanpa bias LLM.
2. **AI Action Plan (AI Advisor)**
   - Gemini AI menjana pelan tindakan langkah demi langkah yang mesra sekiranya permohonan usahawan `TIDAK_LULUS` atau `PERLU_TINDAKAN`.
3. **Guardrails Ketat (Domain-Locked)**
   - Penapis post-processing memastikan tiada nama pembiaya luar MARA (cth: TEKUN, SME Bank, bank komersial) dicadangkan kepada usahawan.
4. **Audit & Governance Logs**
   - Setiap transaksi semakan kelayakan dan output AI direkodkan secara automatik ke dalam fail JSON berpusat di `audit/decision-logs/`.

---

## 🚀 Arahan Menjalankan Projek Secara Lokal

### 1. Pasang Dependensi
Sistem ini menggunakan **npm workspaces** untuk mengurus dependensi secara hoisted:
```bash
npm install
```

### 2. Jalankan Server Pembangunan (Development)
```bash
npm run dev
```

### 3. Jalankan Ujian Unit Automatik
```bash
npm run test
```

### 4. Bina Aplikasi (Build)
```bash
npm run build
```
