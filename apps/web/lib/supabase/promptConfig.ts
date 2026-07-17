import { cookies } from 'next/headers'

export const DEFAULT_SYSTEM_PROMPT = 'Anda ialah perunding perniagaan pakar TVET/IKM Malaysia. Tugas anda adalah untuk membantu usahawan menstruktur perniagaan mereka untuk permohonan geran rasmi (seperti MARA, TEKUN, MDEC). Sila berikan analisis dalam Bahasa Melayu profesional. PENTING: Jangan reka angka kewangan khusus (misalnya jumlah RM tepat), sebaliknya berikan anggaran kasar atau berasaskan peratusan. Pastikan analisis SWOT, blueprint tindakan, dan skrip elevator pitch adalah khusus dan relevan untuk projek usahawan.'

export async function getSystemPrompt(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const customPrompt = cookieStore.get('imex_custom_system_prompt')?.value
    return customPrompt || DEFAULT_SYSTEM_PROMPT
  } catch {
    return DEFAULT_SYSTEM_PROMPT
  }
}
