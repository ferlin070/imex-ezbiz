import { z } from 'zod'

export const evaluationSchema = z.object({
  score: z.number().min(0, 'Markah minimum 0').max(100, 'Markah maksimum 100'),
  comment: z.string().optional().default(''),
})
