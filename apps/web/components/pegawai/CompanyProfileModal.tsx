'use client'

import { useState, useCallback } from 'react'
import {
  Building2, X, User, MapPin, Phone, IdCard, CalendarDays,
  FileText, ExternalLink, Loader2, CheckCircle2, XCircle,
} from 'lucide-react'

interface CompanyProfileData {
  business_name?: string
  ssm_number?: string
  entity_type?: string
  operating_since?: string
  address?: string
  state?: string
  district?: string
  owner_full_name?: string
  owner_ic_number?: string
  owner_age?: number
  phone?: string
  is_bumiputera?: boolean
}

interface OfficerDocument {
  doc_type: string
  label: string
  uploaded_at: string
  signed_url: string | null
}

const REQUIRED_DOCS = ['ssm_cert', 'business_plan', 'ic_copy']
const ENTITY_LABELS: Record<string, string> = {
  milikan_tunggal: 'Milikan Tunggal',
  perkongsian: 'Perkongsian',
  sdn_bhd: 'Syarikat Sendirian Berhad',
  koperasi: 'Koperasi',
}

export default function CompanyProfileModal({
  ownerId,
  ownerEmail,
  company,
}: {
  ownerId: string
  ownerEmail?: string
  company: CompanyProfileData
}) {
  const [open, setOpen] = useState(false)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [docs, setDocs] = useState<OfficerDocument[] | null>(null)
  const [docError, setDocError] = useState('')

  const fetchDocs = useCallback(async () => {
    setLoadingDocs(true)
    setDocError('')
    try {
      const res = await fetch(`/api/documents/officer-view?ownerId=${ownerId}`)
      const data = await res.json()
      if (!res.ok) {
        setDocError(data.error || 'Gagal memuatkan dokumen.')
      } else {
        setDocs(data.documents || [])
      }
    } catch {
      setDocError('Ralat rangkaian semasa memuatkan dokumen.')
    } finally {
      setLoadingDocs(false)
    }
  }, [ownerId])

  const handleOpen = () => {
    setOpen(true)
    if (docs === null) fetchDocs()
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-300 bg-slate-950 border border-slate-800 hover:border-mara-gold/50 hover:text-mara-gold px-3 py-1.5 rounded-lg transition cursor-pointer"
      >
        <Building2 className="w-3.5 h-3.5" />
        Lihat Profil Syarikat Penuh
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-850 sticky top-0 bg-slate-950 z-10">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-mara-gold" />
                <h3 className="font-extrabold text-white">{company.business_name || 'Syarikat Belum Dinamakan'}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Maklumat Syarikat</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-slate-850 rounded-xl p-4 text-xs">
                  <InfoRow label="No. Pendaftaran SSM" value={company.ssm_number || 'Tiada'} />
                  <InfoRow label="Jenis Entiti" value={ENTITY_LABELS[company.entity_type || ''] || company.entity_type || '-'} />
                  <InfoRow
                    label="Tarikh Daftar SSM"
                    value={company.operating_since ? new Date(company.operating_since).toLocaleDateString('ms-MY') : '-'}
                    icon={<CalendarDays className="w-3 h-3" />}
                  />
                  <InfoRow label="Negeri / Daerah" value={[company.state, company.district].filter(Boolean).join(', ') || '-'} icon={<MapPin className="w-3 h-3" />} />
                  <div className="col-span-2">
                    <InfoRow label="Alamat Perniagaan" value={company.address || '-'} />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Maklumat Pemilik</h4>
                <div className="grid grid-cols-2 gap-3 bg-slate-900/40 border border-slate-850 rounded-xl p-4 text-xs">
                  <InfoRow label="Nama Penuh" value={company.owner_full_name || '-'} icon={<User className="w-3 h-3" />} />
                  <InfoRow label="No. Kad Pengenalan" value={company.owner_ic_number || '-'} icon={<IdCard className="w-3 h-3" />} />
                  <InfoRow label="Umur" value={company.owner_age ? `${company.owner_age} Tahun` : '-'} />
                  <InfoRow label="Status Bumiputera" value={company.is_bumiputera ? 'Bumiputera' : 'Non-Bumiputera'} />
                  <InfoRow label="No. Telefon" value={company.phone || '-'} icon={<Phone className="w-3 h-3" />} />
                  <InfoRow label="E-mel" value={ownerEmail || '-'} />
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Dokumen Dimuat Naik</h4>

                {loadingDocs && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memuatkan dokumen...
                  </div>
                )}

                {docError && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                    {docError}
                  </div>
                )}

                {!loadingDocs && !docError && docs && (
                  <div className="space-y-2">
                    {REQUIRED_DOCS.map((docType) => {
                      const found = docs.find((d) => d.doc_type === docType)
                      return (
                        <div
                          key={docType}
                          className="flex items-center justify-between bg-slate-900/40 border border-slate-850 rounded-xl px-4 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <span className="text-xs text-slate-300">{found?.label || docType}</span>
                          </div>
                          {found?.signed_url ? (
                            <a
                              href={found.signed_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Lihat <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                              <XCircle className="w-3.5 h-3.5" /> Belum dimuat naik
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {docs.filter((d) => !REQUIRED_DOCS.includes(d.doc_type)).map((d) => (
                      <div
                        key={d.doc_type}
                        className="flex items-center justify-between bg-slate-900/40 border border-slate-850 rounded-xl px-4 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-300">{d.label}</span>
                        </div>
                        {d.signed_url && (
                          <a
                            href={d.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lihat <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">{label}</span>
      <span className="text-slate-200 font-medium flex items-center gap-1.5">
        {icon}
        {value}
      </span>
    </div>
  )
}
