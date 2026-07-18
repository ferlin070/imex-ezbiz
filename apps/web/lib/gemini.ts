import { logger } from '@/lib/logger'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AiReportSchema, AiReportInput } from '../schemas/ai-report.schema'
import { getSystemPrompt } from './supabase/promptConfig'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Updated input type: Takes MARA loan-relevant business context 
// (replaces old FYP judging criteria breakdown)
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
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          swot: {
            type: 'object',
            properties: {
              strengths: { type: 'array', items: { type: 'string' } },
              weaknesses: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } },
              threats: { type: 'array', items: { type: 'string' } },
            },
            required: ['strengths', 'weaknesses', 'opportunities', 'threats'],
          },
          blueprint: {
            type: 'object',
            properties: {
              technical: { type: 'array', items: { type: 'string' } },
              marketing: { type: 'array', items: { type: 'string' } },
              financial: { type: 'array', items: { type: 'string' } },
            },
            required: ['technical', 'marketing', 'financial'],
          },
          pitch_script: { type: 'string' },
          // GUARDRAIL: grant_notes hanya untuk MARA sahaja.
          // Tiada TEKUN, MDEC, BSN, Bank Komersial, atau mana-mana pembiaya di luar ekosistem MARA.
          grant_notes: {
            type: 'object',
            properties: {
              mara: { type: 'string' },
            },
            required: ['mara'],
          },
        },
        required: ['swot', 'blueprint', 'pitch_script', 'grant_notes'],
      } as any,
    },
    systemInstruction: await getSystemPrompt(),
  })

  // Build prompt using MARA loan-relevant business context
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

Arahan PENTING:
- Analisis SWOT mesti berdasarkan perniagaan sebenar usahawan ini.
- Blueprint tindakan mesti praktikal dan khusus kepada ekosistem MARA.
- Nota geran HANYA untuk skim MARA (PUTRA, SPiM, SPIKE). 
  JANGAN sebutkan TEKUN, MDEC, BSN, Maybank, CIMB, Bank Komersial, 
  atau mana-mana pembiaya di luar MARA.

Sila jana:
1. SWOT: Tepat 3-4 mata berkualiti bagi setiap Strengths, Weaknesses, Opportunities, dan Threats.
2. Actionable Blueprint: 3 fasa (Technical, Marketing, Financial), 3 langkah boleh dilaksanakan bagi setiap fasa.
3. Skrip Elevator Pitch 60-saat: Berstruktur Hook → Problem → Solution → CTA.
4. Nota Geran MARA: Cadangan khusus untuk skim pembiayaan MARA yang paling sesuai (1-2 ayat).
`

  // Define generation function with 1 retry logic and mock fallback
  const runGeneration = async (attempt: number = 1): Promise<AiReportInput> => {
    try {
      // If key is missing or is placeholder, jump directly to fallback
      const key = process.env.GEMINI_API_KEY || ''
      if (!key || key.includes('your-') || key.includes('placeholder')) {
        throw new Error('API key is missing or is placeholder')
      }

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      if (!text) {
        throw new Error('Respons kosong daripada Gemini API.')
      }

      const parsedJson = JSON.parse(text)
      const validatedData = AiReportSchema.parse(parsedJson)
      return validatedData
    } catch (err: any) {
      if (attempt < 2) {
        logger.warn(`Panggilan Gemini gagal pada cubaan ${attempt}. Mencuba semula... Ralat:`, err.message)
        return runGeneration(attempt + 1)
      }
      
      // Attempt 2 failed: Fall back to simulated report (MARA-only, guardrail compliant)
      logger.warn("Gemini API key missing/invalid. Falling back to simulated MARA business report...")
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
          // GUARDRAIL COMPLIANT: MARA only, no TEKUN/MDEC/Bank Komersial
          mara: `Perniagaan ${context.businessName} layak dinilai untuk Skim Pembiayaan MARA yang sesuai (PUTRA Mikro atau SPiM) berdasarkan kategori perniagaan dan keperluan pembiayaan RM${context.fundingRequested?.toLocaleString() || 0}. Sila berbincang dengan Pegawai PMN MARA untuk pengesahan skim yang paling sesuai.`
        }
      }
    }
  }

  return runGeneration()
}
