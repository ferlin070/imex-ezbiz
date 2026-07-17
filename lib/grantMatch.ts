import { GoogleGenerativeAI } from '@google/generative-ai'
import { GrantMatchListSchema, GrantMatchItem } from '../schemas/grant-match.schema'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateGrantMatches(
  project: { id: string; title: string; description: string; category: string; state: string; institution: string },
  feasibilityResult: { score: number; tier: string },
  schemes: { id: string; name: string; agency: string; description: string; eligibility_criteria: string; sector_tags: string[]; max_amount_myr: number }[]
): Promise<GrantMatchItem[]> {
  const isKeyValid = process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('dummy') && process.env.GEMINI_API_KEY.length > 10

  if (isKeyValid) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scheme_id: { type: 'string' },
                match_score: { type: 'number' },
                match_reasoning: { type: 'string' },
              },
              required: ['scheme_id', 'match_score', 'match_reasoning'],
            },
          } as any,
        },
        systemInstruction: `Anda adalah ejen AI perunding usahawan MARA. Analisis kesesuaian projek inovasi Bumiputera dengan skim pembiayaan agensi kerajaan secara profesional. 
Ulasan anda hendaklah dalam Bahasa Melayu, ringkas (2-3 ayat maksimum per skim), berstruktur tinggi, dan tidak memandai-mandai mereka-reka nombor RM yang tidak dinyatakan. Rujuk kepada had siling skim yang diberikan secara umum (cth: "sehingga RM50,000") jika perlu.`,
      })

      const schemesText = schemes.map(s => `
ID Skim: ${s.id}
Nama Skim: ${s.name}
Agensi: ${s.agency}
Deskripsi: ${s.description}
Kriteria Kelayakan: ${s.eligibility_criteria}
Sektor Bersesuaian: ${s.sector_tags.join(', ')}
Had Siling Pembiayaan: RM${s.max_amount_myr}
`).join('\n---\n')

      const prompt = `
Nama Projek Inovasi: ${project.title}
Kategori Sektor: ${project.category}
Negeri: ${project.state}
Institusi: ${project.institution}
Deskripsi Projek: ${project.description}

Keputusan Penilaian Juri:
- Skor Kebolehsanaan Perniagaan (Biz-Feasibility Score): ${feasibilityResult.score}/100 (${feasibilityResult.tier})

Berikut adalah senarai Skim Geran & Pembiayaan yang aktif:
${schemesText}

Sila padankan projek usahawan ini dengan setiap skim pembiayaan di atas. Sediakan skor padanan kelulusan (0 hingga 100) dan rasional ulasan yang kukuh bagi setiap skim dalam format JSON array.
`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const parsed = JSON.parse(text)
      
      const validated = GrantMatchListSchema.parse(parsed)
      return validated
    } catch (err) {
      console.warn('Gemini AI grant match generation failed, falling back to heuristic calculation:', err)
    }
  }

  // Fallback heuristic calculations when offline or key is invalid
  return schemes.map((s) => {
    let matchScore = feasibilityResult.score

    // Category / Sector match boost
    const isSectorMatch = s.sector_tags.some(tag => 
      tag.toLowerCase() === project.category.toLowerCase() ||
      project.category.toLowerCase().includes(tag.toLowerCase()) ||
      tag.toLowerCase().includes(project.category.toLowerCase())
    )

    if (isSectorMatch) {
      matchScore = Math.min(100, matchScore + 15)
    } else {
      matchScore = Math.max(10, matchScore - 20)
    }

    // Specific scheme adjustments based on criteria
    if (s.name.includes('Mikro') && feasibilityResult.score < 50) {
      matchScore = Math.max(15, matchScore - 25)
    } else if (s.name.includes('Inovasi') && feasibilityResult.score < 70) {
      matchScore = Math.max(10, matchScore - 30)
    }

    // Round to 1 decimal place
    matchScore = Math.round(matchScore * 10) / 10

    // Construct reasoning in Malay
    let reasoning = ''
    if (matchScore >= 80) {
      reasoning = `Projek ${project.title} mempamerkan potensi yang sangat cemerlang dengan skor kebolehsanaan ${feasibilityResult.score}%, menjadikannya calon utama bagi ${s.name}. Sektor ${project.category} amat selari dengan garis panduan skim ini yang menawarkan pembiayaan sehingga RM${s.max_amount_myr.toLocaleString()}.`
    } else if (matchScore >= 50) {
      reasoning = `Padanan sederhana dikesan bagi ${s.name}. Skor projek adalah mencukupi (${feasibilityResult.score}%) namun dicadangkan agar usahawan memperkasakan lagi aspek komersial produk untuk memenuhi syarat pembiayaan maksimum RM${s.max_amount_myr.toLocaleString()}.`
    } else {
      reasoning = `Projek ini kurang bersesuaian dengan ${s.name} buat masa sekarang disebabkan kekangan kriteria kelayakan atau skor kebolehsanaan (${feasibilityResult.score}%) yang masih memerlukan bimbingan tambahan di bawah skim pembiayaan MARA.`
    }

    return {
      scheme_id: s.id,
      match_score: matchScore,
      match_reasoning: reasoning,
    }
  })
}
