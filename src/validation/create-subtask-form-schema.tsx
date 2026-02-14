import { z } from 'zod'

export const createSubtaskFormSchema = z.object({
  title: z
    .string()
    .min(5, { error: 'Please ensure the title has atleast 5 characters' })
    .max(32, 'Title can not be longer than 32 characters'),
})
