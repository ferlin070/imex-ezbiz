import { z } from 'zod'

export const GrantMatchItemSchema = z.object({
  scheme_id: z.string().min(1),
  match_score: z.number().min(0).max(100),
  match_reasoning: z.string().min(5),
})

export const GrantMatchListSchema = z.array(GrantMatchItemSchema)

export type GrantMatchItem = z.infer<typeof GrantMatchItemSchema>
export type GrantMatchList = z.infer<typeof GrantMatchListSchema>
