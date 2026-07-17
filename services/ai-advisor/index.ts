import { GoogleGenerativeAI } from '@google/generative-ai'
import { EligibilityResult } from '../eligibility-engine'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateActionPlan(
  result: EligibilityResult,
  applicantData: { ssmNumber: string; businessName?: string; ownerAge: number; isBumiputera: boolean }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Graceful fallback for offline/development mode without API key
    return generateMockActionPlan(result);
  }

  const systemInstruction = `Anda adalah Agen AI Penasihat Kelayakan Usahawan MARA.
Tugas anda adalah menerangkan keputusan semakan kelayakan permohonan pembiayaan usahawan secara ringkas, mesra, dan membina dalam Bahasa Melayu.

Keputusan kelayakan:
- Status semasa permohonan ditentukan oleh Rules Engine deterministik (bukan oleh anda).
- Anda hanya bertugas membimbing usahawan berdasarkan keputusan tersebut.
- Sekiranya status permohonan adalah TIDAK_LULUS atau PERLU_TINDAKAN, anda MESTI menyediakan pelan tindakan langkah demi langkah (actionable steps) yang tersusun untuk membantu usahawan mematuhi syarat tersebut di masa hadapan.

PERATURAN KESELAMATAN DOMAIN (DOMAI-LOCKED TO MARA ONLY):
1. Anda HANYA boleh mencadangkan skim pembiayaan, latihan, khidmat nasihat, dewan perniagaan, atau fasiliti di bawah ekosistem MARA sahaja (cth: Skim Pembiayaan Kontrak, Skim SPIKE, Skim SPIM, Pembangunan Usahawan MARA).
2. DILARANG SAMA SEKALI mencadangkan alternatif dari pembiaya luar seperti TEKUN Nasional, SME Bank, BSN, Maybank, CIMB, bank komersial lain, atau mana-mana agensi bukan MARA.
3. Sekiranya ada kriteria yang tidak relevan dengan skim MARA, arahkan usahawan untuk menghubungi pegawai MARA/PMN secara terus.`

  const failedCriteriaText = result.criteria
    .filter((c) => !c.passed)
    .map((c) => `- ${c.name}: Diperlukan: ${c.required}, Sebenar: ${c.actual}`)
    .join('\n')

  const prompt = `Sila huraikan keputusan berikut untuk usahawan:
Nama Syarikat: ${applicantData.businessName || 'N/A'}
Status Keputusan: ${result.status}
Sebab Utama: ${result.reason}

Kriteria Gagal/Perlu Tindakan:
${failedCriteriaText || 'Tiada kriteria gagal.'}

Jana penjelasan keputusan dan pelan tindakan langkah demi langkah secara tersusun dalam format Markdown.`

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      systemInstruction,
    })

    const response = await model.generateContent(prompt)
    return response.response.text()
  } catch (error) {
    console.error('Failed calling Gemini API for action plan, falling back to rule-based advice:', error)
    return generateMockActionPlan(result)
  }
}

function generateMockActionPlan(result: EligibilityResult): string {
  let plan = `### Pelan Tindakan Cadangan Kelayakan MARA\n\n`
  
  if (result.status === 'LULUS') {
    plan += `Syarikat anda telah memenuhi kriteria asas skim pembiayaan MARA! Sila hubungi Pejabat MARA Daerah terdekat untuk pengesahan dokumen fizikal dan temu duga permohonan.`
    return plan
  }

  plan += `Syarikat anda belum bersedia sepenuhnya untuk memohon skim pembiayaan MARA. Berikut adalah langkah tindakan yang dicadangkan:\n\n`
  
  const failed = result.criteria.filter((c) => !c.passed)
  
  failed.forEach((c, index) => {
    plan += `${index + 1}. **Tindakan untuk ${c.name}**\n`
    if (c.name === 'Haul Perniagaan') {
      plan += `   - Syarikat anda memerlukan pendaftaran SSM sekurang-kurangnya 12 bulan (tempoh matang). Sila tunggu dan teruskan operasi syarikat anda sehingga mencukupi tempoh haul yang ditetapkan sebelum memohon semula.\n`
    } else if (c.name === 'Dokumen Mandatori') {
      plan += `   - Muat naik dokumen yang lengkap termasuk Sijil Pendaftaran SSM dan Kertas Rancangan Perniagaan yang lengkap di portal usahawan.\n`
    } else if (c.name === 'Status SSM Aktif') {
      plan += `   - Sila layari portal ezbiz SSM untuk memperbaharui lesen pendaftaran perniagaan syarikat anda yang telah tamat tempoh.\n`
    } else if (c.name === 'Status Bumiputera') {
      plan += `   - Pastikan pendaftaran perniagaan anda dikemaskini sebagai milik warganegara Bumiputera. Skim pembiayaan MARA adalah dikhususkan kepada usahawan Bumiputera sahaja.\n`
    } else {
      plan += `   - Sila hubungi Pegawai MARA / PMN daerah anda untuk khidmat bimbingan lanjut.\n`
    }
  })

  return plan
}
