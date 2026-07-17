import { z } from 'zod'

export const fundUsageItemSchema = z.object({
  category: z.string().min(1, 'Kategori penggunaan dana diperlukan'),
  percent: z.number().min(0).max(100, 'Peratusan mestilah antara 0 dan 100')
})

export const businessProfileSchema = z.object({
  business_name: z.string().min(3, 'Nama perniagaan mestilah sekurang-kurangnya 3 aksara'),
  ssm_number: z.string().optional().nullable(),
  ssm_registered: z.boolean(),
  entity_type: z.enum(['milikan_tunggal', 'perkongsian', 'sdn_bhd', 'belum_berdaftar']),
  operating_since: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  owner_full_name: z.string().min(3, 'Nama penuh pemilik diperlukan'),
  owner_ic_number: z.string().min(12, 'No. Kad Pengenalan mestilah sekurang-kurangnya 12 digit'),
  is_bumiputera: z.boolean(),
  owner_age: z.number().int().positive().optional().nullable(),
  education_level: z.string().optional().nullable(),
  phone: z.string().min(9, 'No. telefon tidak sah'),
  business_stage: z.enum(['idea', 'prototaip', 'operasi_baru', 'operasi_1_3_tahun', 'operasi_matang']),
  monthly_revenue_range: z.string().min(1, 'Sila pilih julat hasil jualan bulanan'),
  employee_count: z.number().int().nonnegative(),
  funding_requested_myr: z.number().positive('Jumlah modal dipohon mestilah positif'),
  fund_usage_breakdown: z.array(fundUsageItemSchema).min(1, 'Sila masukkan sekurang-kurangnya satu kategori pecahan penggunaan dana'),
  has_existing_financing: z.boolean(),
  existing_financing_notes: z.string().optional().nullable(),
  target_market: z.string().optional().nullable(),
  unique_selling_point: z.string().optional().nullable(),
})

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>
