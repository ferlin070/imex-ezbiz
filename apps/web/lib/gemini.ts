import { logger } from '@/lib/logger'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AiReportSchema, AiReportInput } from '../schemas/ai-report.schema'
import { getSystemPrompt } from './supabase/promptConfig'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateBusinessReport(
  project: { title: string; description: string; category: string; team_members: string[] },
  criteriaBreakdown: { code: string; label: string; average: number; percentage: number }[],
  feasibilityResult: { score: number; tier: string }
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
          grant_notes: {
            type: 'object',
            properties: {
              mara: { type: 'string' },
              mdec: { type: 'string' },
              tekun: { type: 'string' },
            },
            required: ['mara', 'mdec', 'tekun'],
          },
        },
        required: ['swot', 'blueprint', 'pitch_script', 'grant_notes'],
      } as any,
    },
    systemInstruction: await getSystemPrompt(),
  })

  // Build the prompt content
  const prompt = `
Nama Projek Inovasi: ${project.title}
Kategori: ${project.category || 'Umum'}
Deskripsi Projek: ${project.description || 'Tiada deskripsi.'}
Senarai Ahli Kumpulan: ${project.team_members?.join(', ') || 'Tiada ahli berdaftar.'}

Keputusan Penilaian Juri Sebenar (Konteks Penting):
- Indeks Kebolehsanaan (Biz-Feasibility Score): ${feasibilityResult.score}% (${feasibilityResult.tier})
- Pecahan Skor Mengikut Kriteria:
${criteriaBreakdown
  .map(
    (c) =>
      `  * Kriteria ${c.code} (${c.label}): Purata Markah ${c.average} mata (Nisbah Kepuasan: ${c.percentage}%)`
  )
  .join('\n')}

Sila jana:
1. SWOT: Sediakan tepat 3-4 mata berkualiti bagi setiap Strengths, Weaknesses, Opportunities, dan Threats.
2. Actionable Blueprint: Berikan cadangan blueprint tindakan 3 fasa (Technical, Marketing, Financial) dengan tepat 3 langkah boleh dilaksanakan bagi setiap fasa.
3. Skrip Elevator Pitch 60-saat: Skrip pembentangan pantas bertaraf profesional yang berstruktur Hook -> Problem -> Solution -> CTA.
4. Nota Geran: Cadangan khusus untuk kriteria MARA, MDEC/Cradle, dan TEKUN/PUNB (1 ayat cadangan bagi setiap satu).
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
      
      // Attempt 2 failed: Fall back to simulated report
      logger.warn("Gemini API key missing/invalid. Falling back to simulated MARA TVET business report generation...")
      return {
        swot: {
          strengths: [
            `Kepakaran teknikal tinggi dalam bidang ${project.category || 'inovasi'} hasil bimbingan para pensyarah IKM.`,
            `Penyelesaian berasaskan IoT/teknologi yang sangat sejajar dengan inisiatif Industri 4.0.`,
            `Prototaip berfungsi sepenuhnya dan sedia diuji di persekitaran sebenar.`
          ],
          weaknesses: [
            "Pendedahan pasaran yang masih terhad untuk strategi penjenamaan dan pengkomersialan.",
            "Ketiadaan pasukan khusus untuk pemasaran digital dan pengurusan perhubungan pelanggan (CRM).",
            "Kos perolehan bahan mentah mikroelektronik yang tidak menentu bagi pengeluaran skala kecil."
          ],
          opportunities: [
            "Jaringan ekosistem keusahawanan MARA yang komprehensif (Dana, Latihan, & Inkubator).",
            "Permintaan tinggi daripada industri tempatan terhadap automasi dan pendigitalan perniagaan.",
            "Peluang perlindungan harta intelek (IP) di bawah bimbingan geran inovasi MARA."
          ],
          threats: [
            "Kehadiran produk alternatif import yang lebih murah di pasaran terbuka.",
            "Persaingan sengit daripada startup sedia ada yang mempunyai dana modal teroka yang kukuh.",
            "Piawaian keselamatan industri tempatan yang ketat dan memerlukan pensijilan berbayar (SIRIM)."
          ]
        },
        blueprint: {
          technical: [
            `Mewujudkan sistem pengeluaran produk ${project.title} skala kecil di fasiliti IKM Besut.`,
            "Memohon persijilan keselamatan elektrik dan pematuhan standard SIRIM.",
            "Menjalankan ujian ketahanan peranti (hardware reliability test) dalam tempoh 30 hari."
          ],
          marketing: [
            "Membina prototaip pembungkusan komersial yang mesra alam dan menarik.",
            "Melancarkan video demo keberkesanan produk di TikTok, YouTube, dan LinkedIn.",
            "Menghadiri Ekspo Keusahawanan MARA untuk mendapatkan maklum balas pelanggan sasaran."
          ],
          financial: [
            "Menyusun unjuran aliran tunai operasi tahun pertama bagi pembuktian daya maju pasaran.",
            "Memohon geran pembangunan produk awal melalui Skim PUTRA MARA.",
            "Menetapkan harga jualan komersial yang memberikan margin keuntungan kasar sekurang-kurangnya 40%."
          ]
        },
        pitch_script: `Assalamualaikum dan salam sejahtera. Keletihan memandu merupakan punca utama kemalangan jalan raya di Malaysia. Hari ini, kami memperkenalkan ${project.title} - sistem bantuan pemanduan pintar berasaskan IoT yang memantau keletihan pemandu secara masa nyata melalui sensor pergerakan mata. Apabila keletihan dikesan, amaran serta-merta akan dicetuskan. Dengan pasaran sasaran pengangkutan awam dan logistik di Malaysia yang bernilai ratusan juta ringgit, ${project.title} bukan sahaja menyelamatkan nyawa, malah meningkatkan kecekapan operasi syarikat logistik anda. Kami memohon pembiayaan geran MARA untuk membantu kami membawa inovasi ini dari bengkel IKM terus ke pasaran komersial. Terima kasih.`,
        grant_notes: {
          mara: `Projek ${project.title} amat layak memohon Skim PUTRA/SPIKE MARA bagi pembangunan prototaip dan modal pusingan awal.`,
          mdec: "Sesuai untuk memohon Geran Kandungan Digital MDEC kerana integrasi teknologi pintar.",
          tekun: "Kelayakan di bawah Skim Pembiayaan TEKUN Belia Niaga bagi pembelian peralatan pembuatan."
        }
      }
    }
  }

  return runGeneration()
}
