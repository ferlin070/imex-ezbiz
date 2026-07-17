import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().min(3, 'Tajuk projek sekurang-kurangnya 3 aksara'),
  description: z.string().min(10, 'Penerangan projek sekurang-kurangnya 10 aksara'),
  category: z.string().min(3, 'Kategori perniagaan/inovasi diperlukan'),
  team_members: z.array(z.string()).default([]),
  event_id: z.string().uuid('Sila pilih event yang sah'),
  status: z.enum(['draft', 'submitted', 'shortlisted', 'approved', 'rejected']).default('submitted'),
})
