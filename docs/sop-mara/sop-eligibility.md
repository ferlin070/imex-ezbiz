# Dokumen Rujukan SOP Kelayakan Skim Pembiayaan MARA

Dokumen ini mendokumentasikan kriteria kelayakan rasmi untuk permohonan pembiayaan (pinjaman dan geran) di bawah Majlis Amanah Rakyat (MARA).

---

## 1. Kriteria Mandatori (Deterministik)

Setiap permohonan usahawan akan disemak secara automatik menggunakan eligibility-engine berdasarkan konfigurasi `rules.json`:

1. **Warganegara / Status Bumiputera**:
   - Pemilik perniagaan mestilah warganegara Malaysia bertaraf Bumiputera.
   
2. **Had Umur Pemohon**:
   - Berumur antara **18 hingga 65 tahun** pada tarikh permohonan dikemukakan.

3. **Pendaftaran SSM & Haul Perniagaan**:
   - Syarikat mestilah berdaftar secara sah dengan Suruhanjaya Syarikat Malaysia (SSM).
   - Tempoh matang pendaftaran (haul) perniagaan sekurang-kurangnya **12 bulan**.
   - Status pendaftaran SSM mestilah **Aktif**.

4. **Dokumen Mandatori**:
   - Sijil Pendaftaran SSM (`ssm_cert`).
   - Kertas Rancangan Perniagaan lengkap (`business_plan`).

---

## 2. Proses Aliran Kerja Semakan
1. **Semakan Rules Engine**: Input dari profil perniagaan dinilai oleh eligibility-engine. Status awal ditetapkan kepada `LULUS` atau `TIDAK_LULUS` / `PERLU_TINDAKAN`.
2. **Janaan Penasihat AI**: Jika tidak melepasi satu atau lebih kriteria, AI Advisor (Gemini) menjana pelan tindakan langkah demi langkah untuk membantu usahawan mematuhi syarat di masa depan.
3. **Guardrails**: Output ditapis untuk memastikan tiada cadangan alternatif selain skim MARA yang dikemukakan kepada pengguna.
