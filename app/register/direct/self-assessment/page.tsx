'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardList, ArrowRight, ShieldCheck, AlertCircle, Save } from 'lucide-react'

interface Question {
  id: 'k1_idea' | 'k2_innovation' | 'k3_impact' | 'k4_presentation' | 'k5_marketability'
  label: string
  max: number
  options: {
    value: 'A' | 'B' | 'C' | 'D'
    text: string
    points: number
  }[]
}

const QUESTIONS: Question[] = [
  {
    id: 'k1_idea',
    label: 'K1: Idea & Kreativiti (Keunikan Penyelesaian)',
    max: 20,
    options: [
      { value: 'A', text: 'Idea sangat unik, disruptif & belum wujud di pasaran tempatan', points: 20 },
      { value: 'B', text: 'Penambahbaikan nyata berbanding produk/servis sedia ada', points: 14 },
      { value: 'C', text: 'Meniru produk sedia ada dengan sedikit penyesuaian tempatan', points: 8 },
      { value: 'D', text: 'Idea biasa tanpa sebarang perbezaan kompetitif yang nyata', points: 2 }
    ]
  },
  {
    id: 'k2_innovation',
    label: 'K2: Hasil Inovasi & Output (Tahap Ketersediaan Produk)',
    max: 30,
    options: [
      { value: 'A', text: 'Produk sudah dipasarkan secara rasmi & mempunyai jualan aktif', points: 30 },
      { value: 'B', text: 'Prototaip akhir (MVP) sedia diuji & berfungsi penuh', points: 20 },
      { value: 'C', text: 'Prototaip peringkat awal / reka bentuk konsep (mockup)', points: 12 },
      { value: 'D', text: 'Masih di peringkat idea / kertas cadangan sahaja', points: 4 }
    ]
  },
  {
    id: 'k3_impact',
    label: 'K3: Impak (Kesan Efisiensi / Keberkesanan)',
    max: 20,
    options: [
      { value: 'A', text: 'Mengurangkan kos / masa operasi melebihi 50% atau impak komuniti besar', points: 20 },
      { value: 'B', text: 'Impak sederhana (mengurangkan kos/masa sekitar 10% - 50%)', points: 14 },
      { value: 'C', text: 'Impak kecil (peningkatan efisiensi kurang dari 10%)', points: 8 },
      { value: 'D', text: 'Tiada impak efisiensi atau kesan sosial yang ketara', points: 2 }
    ]
  },
  {
    id: 'k4_presentation',
    label: 'K4: Persembahan & Pitching (Kualiti Rancangan Perniagaan)',
    max: 20,
    options: [
      { value: 'A', text: 'Mempunyai Rancangan Perniagaan (BP) lengkap & video demo produk', points: 20 },
      { value: 'B', text: 'Mempunyai Rancangan Perniagaan lengkap secara bertulis', points: 14 },
      { value: 'C', text: 'Slaid pembentangan (pitch deck) ringkas sahaja', points: 8 },
      { value: 'D', text: 'Tiada slaid pembentangan atau kertas kerja penyediaan', points: 2 }
    ]
  },
  {
    id: 'k5_marketability',
    label: 'K5: Kebolehpasaran & Potensi Komersial (USP)',
    max: 10,
    options: [
      { value: 'A', text: 'Pasaran sasaran sangat luas dengan kelebihan bersaing (USP) yang sangat tinggi', points: 10 },
      { value: 'B', text: 'Pasaran jelas dengan persaingan kompetitif yang sederhana', points: 7 },
      { value: 'C', text: 'Pasaran sengit atau saiz pasaran yang sangat terhad/kecil', points: 4 },
      { value: 'D', text: 'Pasaran sasaran tidak jelas atau tiada keunikan bersaing', points: 1 }
    ]
  }
]

function SelfAssessmentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')

  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({
    k1_idea: 'D',
    k2_innovation: 'D',
    k3_impact: 'D',
    k4_presentation: 'D',
    k5_marketability: 'D'
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!projectId) {
      router.push('/register/track')
    }
  }, [projectId, router])

  const handleSelect = (questionId: string, value: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  // Calculate local live score preview
  const currentScore = QUESTIONS.reduce((sum, q) => {
    const choice = answers[q.id]
    const option = q.options.find(o => o.value === choice)
    return sum + (option?.points || 0)
  }, 0)

  const getTier = (score: number) => {
    if (score >= 80) return 'Sangat Berpotensi'
    if (score >= 60) return 'Layak Komersial'
    if (score >= 40) return 'Berpotensi Sederhana'
    return 'Perlu Bimbingan'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/projects/self-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          responses: answers
        })
      })

      const result = await res.json()
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        // Successfully submitted, go to project dashboard
        router.push(`/project/${projectId}`)
      }
    } catch (err) {
      setErrorMsg('Ralat rangkaian semasa menghantar penilaian kendiri.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-3xl w-full z-10 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-sm shadow-xl flex flex-col md:flex-row gap-8">
        
        {/* Left Side: Score Preview (Sticky/Fixed style on desktop) */}
        <div className="md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs text-blue-400 mb-4">
              <ClipboardList className="w-3.5 h-3.5" />
              Langkah Akhir Pendaftaran
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Penilaian Kendiri Inovasi</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sila jawab soalan objektif berdasarkan status sebenar perniagaan anda. Skor ini bertindak sebagai kayu ukur awal kelayakan skim geran MARA.
            </p>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-slate-950 border border-slate-800/60 text-center">
            <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold mb-1">Anggaran Skor</span>
            <div className="text-4xl font-extrabold text-white mb-1">{currentScore}%</div>
            <div className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-blue-400 border border-blue-900/30">
              {getTier(currentScore)}
            </div>
          </div>
        </div>

        {/* Right Side: Questionnaire Form */}
        <div className="md:w-2/3 flex-1">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 mb-6 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-200">{q.label}</h4>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          answers[q.id] === opt.value
                            ? 'bg-slate-950 border-slate-400 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.value}
                          checked={answers[q.id] === opt.value}
                          onChange={() => handleSelect(q.id, opt.value)}
                          className="mt-0.5 accent-slate-300"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{opt.text}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">Skor: {opt.points} / {q.max}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-6 py-3.5 px-4 bg-slate-200 hover:bg-white text-slate-950 font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 disabled:bg-slate-200/50"
            >
              {submitting ? 'Sedang Menyimpan...' : 'Hantar & Buka Dashboard Projek'}
              <Save className="w-4 h-4 text-slate-950" />
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}

export default function SelfAssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center">
        <div className="text-xs text-slate-500 font-bold uppercase tracking-wider animate-pulse">
          Memuatkan penilaian kendiri...
        </div>
      </div>
    }>
      <SelfAssessmentForm />
    </Suspense>
  )
}
