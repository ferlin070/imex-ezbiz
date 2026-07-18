'use client'

import { useState, useEffect, useCallback } from 'react'
import { Upload, FileCheck, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

const DOC_TYPES = [
  { label: 'Sijil Pendaftaran SSM', key: 'ssm_cert', required: true },
  { label: 'Kertas Rancangan Perniagaan', key: 'business_plan', required: true },
  { label: 'Penyata Bank (3 bulan)', key: 'bank_statement', required: false },
  { label: 'Salinan Kad Pengenalan', key: 'ic_copy', required: true },
] as const

interface UploadedDoc {
  doc_type: string
  storage_path: string
  uploaded_at: string
}

export default function DocumentUpload() {
  const [uploaded, setUploaded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents/upload')
      const data = await res.json()
      if (data.documents) {
        setUploaded(new Set(data.documents.map((d: UploadedDoc) => d.doc_type)))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleUpload = async (docType: string) => {
    setErrorMsg('')
    setSuccessMsg('')
    setUploadingKey(docType)

    const fileInput = document.getElementById(`file-${docType}`) as HTMLInputElement
    const file = fileInput?.files?.[0]
    if (!file) {
      setErrorMsg('Sila pilih fail.')
      setUploadingKey(null)
      return
    }

    const formData = new FormData()
    formData.append('doc_type', docType)
    formData.append('file', file)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal muat naik.')
      } else {
        setSuccessMsg(`${DOC_TYPES.find(d => d.key === docType)?.label} berjaya dimuat naik.`)
        setUploaded(prev => new Set(prev).add(docType))
        fileInput.value = ''
      }
    } catch {
      setErrorMsg('Ralat rangkaian. Cuba lagi.')
    } finally {
      setUploadingKey(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Upload className="w-4 h-4 text-mara-red" />
          Dokumen Wajib
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Muat naik dokumen berikut untuk menyokong permohonan pembiayaan MARA anda.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {DOC_TYPES.map(doc => {
              const isUploaded = uploaded.has(doc.key)
              const isUploading = uploadingKey === doc.key
              return (
                <div
                  key={doc.key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
                    isUploaded
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  {isUploaded ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <FileCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-300 font-medium truncate">{doc.label}</p>
                    {doc.required && !isUploaded && (
                      <p className="text-[9px] text-rose-400">Wajib</p>
                    )}
                    {isUploaded && (
                      <p className="text-[9px] text-emerald-400">Selesai</p>
                    )}
                  </div>
                  {!isUploaded && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        id={`file-${doc.key}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={() => handleUpload(doc.key)}
                      />
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => document.getElementById(`file-${doc.key}`)?.click()}
                        className="px-2.5 py-1.5 text-[10px] font-bold bg-mara-red hover:bg-mara-red/80 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-1"
                      >
                        {isUploading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        {isUploading ? 'Memuat naik...' : 'Muat Naik'}
                      </button>
                    </div>
                  )}
                  {isUploaded && (
                    <button
                      type="button"
                      onClick={() => document.getElementById(`file-${doc.key}`)?.click()}
                      className="px-2 py-1 text-[10px] text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition"
                    >
                      Ganti
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300">
            <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300">
            <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <p className="text-[10px] text-slate-500 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
          Format: PDF / JPG / PNG (max 5MB setiap fail)
        </p>
      </div>
    </div>
  )
}
