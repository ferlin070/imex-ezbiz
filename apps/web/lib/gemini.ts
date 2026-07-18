import { logger } from '@/lib/logger'
import { AiReportSchema, AiReportInput } from '../schemas/ai-report.schema'
import { getSystemPrompt } from './supabase/promptConfig'
import { callOpenRouterJSON, getModel } from './openrouter'

export interface BusinessContext {
  title: string
  description: string
  category: string
  businessName: string
  stage: string
  fundingRequested: number
  targetMarket: string
  usp: string
  eligibilityStatus: string
  eligibilityCriteria: { label: string; passed: boolean }[]
}

export async function generateBusinessReport(
  context: BusinessContext
): Promise<AiReportInput> {
  const systemInstruction = await getSystemPrompt()

  const eligibilitySummary = context.eligibilityCriteria.length > 0
    ? context.eligibilityCriteria
        .map(c => `  * ${c.label}: ${c.passed ? '✓ Lulus' : '✗ Tidak Lulus'}`)
        .join('\n')
    : '  * Status kelayakan: ' + context.eligibilityStatus

  const prompt = `
Nama Perniagaan: ${context.businessName}
Nama Produk / Projek: ${context.title}
Kategori Perniagaan: ${context.category || 'Umum'}
Penerangan Perniagaan: ${context.description || 'Tiada deskripsi.'}
Peringkat Perniagaan: ${context.stage}
Jumlah Pembiayaan Dimohon: RM${context.fundingRequested?.toLocaleString() || 'Tidak Dinyatakan'}
Pasaran Sasaran: ${context.targetMarket || 'Pasaran tempatan'}
Kelebihan Unik (USP): ${context.usp || 'Tiada maklumat.'}

Keputusan Semakan Kelayakan MARA:
- Status: ${context.eligibilityStatus}
- Pecahan Kriteria Kelayakan:
${eligibilitySummary}

Keluarkan laporan perniagaan profesional dalam BAHASA MELAYU yang tepat, padat, dan meyakinkan. Jangan guna jargon kosong. Guna data khusus perniagaan usahawan. Setiap bahagian mesti:

1. SWOT: Tepat 3-4 mata setiap kuadran, berdasarkan perniagaan sebenar. Setiap mata mestilah spesifik (bukan generik).
2. Blueprint Tindakan: 3 fasa (Teknikal, Pemasaran, Kewangan), 3 langkah praktikal setiap fasa, ada tempoh masa dan KPI.
3. Elevator Pitch (60 saat): Hook → Masalah → Solusi → CTA. Guna nada peribadi "saya", "kami".
4. Nota Geran: Hanya skim MARA (PUTRA, SPiM, SPIKE), langsung tiada sebutan TEKUN/MDEC/Maybank/CIMB/BSN.

Format output: strict JSON seperti skema berikut (jangan tambah field lain):
{
  "swot": { "strengths": ["..."], "weaknesses": ["..."], "opportunities": ["..."], "threats": ["..."] },
  "blueprint": { "technical": ["..."], "marketing": ["..."], "financial": ["..."] },
  "pitch_script": "...",
  "grant_notes": { "mara": "..." }
}
`

  const runGeneration = async (attempt: number = 1): Promise<AiReportInput> => {
    try {
      const result = await callOpenRouterJSON<AiReportInput>(prompt, {
        system: systemInstruction,
      })
      const validatedData = AiReportSchema.parse(result)
      return validatedData
    } catch (err: any) {
      if (attempt < 2) {
        logger.warn(`Panggilan AI gagal pada cubaan ${attempt}. Mencuba semula... Ralat:`, err.message)
        return runGeneration(attempt + 1)
      }

      logger.warn(`AI API gagal selepas 2 cubaan. Guna mock data. Model: ${getModel()}`, err.message)
      return {
        swot: {
          strengths: [
            `Perniagaan dalam bidang ${context.category || 'inovasi'} dengan potensi pasaran yang jelas.`,
            `Usahawan Bumiputera yang memenuhi kriteria asas kelayakan skim pembiayaan MARA.`,
            `Pendekatan perniagaan yang berfokus kepada pasaran tempatan (${context.targetMarket || 'tempatan'}).`
          ],
          weaknesses: [
            "Pendedahan jenama dalam pasaran masih terhad — strategi pemasaran digital perlu diperkukuhkan.",
            "Aliran tunai perniagaan awal memerlukan pengurusan yang teliti bagi menampung kos operasi.",
            "Keperluan dokumentasi dan pematuhan SSM/cukai perlu diselenggara dengan konsisten."
          ],
          opportunities: [
            "Ekosistem MARA menyediakan sokongan menyeluruh: pembiayaan, bimbingan perniagaan, dan jaringan pasaran.",
            `Permintaan pasaran terhadap ${context.category || 'produk/perkhidmatan'} ini dijangka terus berkembang.`,
            "Program inkubator dan akselerator MARA dapat membantu pengembangan kapasiti perniagaan."
          ],
          threats: [
            "Persaingan daripada perniagaan sedia ada yang mempunyai asas pelanggan lebih kukuh.",
            "Perubahan kadar bahan mentah atau kos operasi yang tidak dijangka.",
            "Perubahan dalam polisi atau syarat kelayakan pembiayaan memerlukan penyesuaian berterusan."
          ]
        },
        blueprint: {
          technical: [
            `Dokumentasikan proses kerja ${context.title} secara formal sebagai SOP perniagaan.`,
            "Daftarkan hakmilik intelektual (IP) atau tanda niaga jika berkaitan dengan produk unik.",
            "Kenal pasti keperluan teknologi dan peralatan yang perlu dinaik taraf dalam 6 bulan pertama."
          ],
          marketing: [
            "Bina profil perniagaan di platform digital (Facebook Business, Instagram, Google Business Profile).",
            "Sediakan bahan pemasaran asas: brosur, kad nama, dan video produk/perkhidmatan pendek.",
            "Hadiri program atau ekspo anjuran MARA untuk membina jaringan pelanggan dan rakan strategik."
          ],
          financial: [
            `Sediakan unjuran aliran tunai 12 bulan bagi permohonan pembiayaan RM${context.fundingRequested?.toLocaleString() || 0} ini.`,
            "Buka akaun perniagaan berasingan daripada akaun peribadi untuk rekod kewangan yang lebih telus.",
            "Tetapkan harga produk/perkhidmatan dengan margin keuntungan kasar sekurang-kurangnya 30-40%."
          ]
        },
        pitch_script: `Assalamualaikum. Perniagaan saya, ${context.businessName}, beroperasi dalam sektor ${context.category || 'perniagaan'} dengan tumpuan kepada ${context.targetMarket || 'pasaran tempatan'}. Produk atau perkhidmatan kami — ${context.title} — menawarkan ${context.usp || 'nilai unik kepada pelanggan kami'}. Kami telah melalui proses semakan kelayakan MARA dan bersedia membawa perniagaan ini ke peringkat seterusnya dengan sokongan pembiayaan RM${context.fundingRequested?.toLocaleString() || 0}. Dana ini akan digunakan untuk mengembangkan kapasiti operasi dan menembusi pasaran yang lebih luas. Kami memohon sokongan MARA untuk merealisasikan potensi penuh perniagaan ini. Terima kasih.`,
        grant_notes: {
          mara: `Perniagaan ${context.businessName} layak dinilai untuk Skim Pembiayaan MARA yang sesuai (PUTRA Mikro atau SPiM) berdasarkan kategori perniagaan dan keperluan pembiayaan RM${context.fundingRequested?.toLocaleString() || 0}. Sila berbincang dengan Pegawai PMN MARA untuk pengesahan skim yang paling sesuai.`
        }
      }
    }
  }

  return runGeneration()
}
