import { z } from 'zod'

export const AiReportSchema = z.object({
  swot: z.object({
    strengths: z.array(z.string().min(1)),
    weaknesses: z.array(z.string().min(1)),
    opportunities: z.array(z.string().min(1)),
    threats: z.array(z.string().min(1)),
  }),
  blueprint: z.object({
    technical: z.array(z.string().min(1)),
    marketing: z.array(z.string().min(1)),
    financial: z.array(z.string().min(1)),
  }),
  pitch_script: z.string().min(10),
  grant_notes: z.object({
    mara: z.string().min(1),
    mdec: z.string().min(1),
    tekun: z.string().min(1),
  }),
})

export type AiReportInput = z.infer<typeof AiReportSchema>
