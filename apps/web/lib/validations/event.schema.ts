import { z } from 'zod'

export const eventSchema = z.object({
  name: z.string().min(3, 'Nama event sekurang-kurangnya 3 aksara'),
  slug: z.string().optional(),
  description: z.string().optional().default(''),
  venue: z.string().optional().default(''),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'completed']).default('draft'),
})
