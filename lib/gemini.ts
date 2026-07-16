import { GoogleGenerativeAI } from '@google/generative-ai'
import { AiReportSchema, AiReportInput } from '../schemas/ai-report.schema'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateBusinessReport(
  project: { title: string; description: string; category: string; team_members: string[] },
  criteriaBreakdown: { code: string; label: string; average: number; percentage: number }[],
  feasibilityResult: { score: number; tier: string }
): Promise<AiReportInput> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
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
    systemInstruction:
      'Anda ialah perunding perniagaan pakar TVET/IKM Malaysia. Tugas anda adalah untuk membantu usahawan menstruktur perniagaan mereka untuk permohonan geran rasmi (seperti MARA, TEKUN, MDEC). Sila berikan analisis dalam Bahasa Melayu profesional. PENTING: Jangan reka angka kewangan khusus (misalnya jumlah RM tepat), sebaliknya berikan anggaran kasar atau berasaskan peratusan. Pastikan analisis SWOT, blueprint tindakan, dan skrip elevator pitch adalah khusus dan relevan untuk projek usahawan.',
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
      `  * Kriteria ${c.code} (${c.label}): Purata Markah ${c.average}% (Kepuasan: ${c.percentage}%)`
  )
  .join('\n')}

Sila jana:
1. SWOT: Sediakan tepat 3-4 mata berkualiti bagi setiap Strengths, Weaknesses, Opportunities, dan Threats.
2. Actionable Blueprint: Berikan cadangan blueprint tindakan 3 fasa (Technical, Marketing, Financial) dengan tepat 3 langkah boleh dilaksanakan bagi setiap fasa.
3. Skrip Elevator Pitch 60-saat: Skrip pembentangan pantas bertaraf profesional yang berstruktur Hook -> Problem -> Solution -> CTA.
4. Nota Geran: Cadangan khusus untuk kriteria MARA, MDEC/Cradle, dan TEKUN/PUNB (1 ayat cadangan bagi setiap satu).
`

  // Define generation function with 1 retry logic
  const runGeneration = async (attempt: number = 1): Promise<AiReportInput> => {
    try {
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
        console.warn(`Panggilan Gemini gagal pada cubaan ${attempt}. Mencuba semula... Ralat:`, err.message)
        return runGeneration(attempt + 1)
      }
      throw err
    }
  }

  return runGeneration()
}
