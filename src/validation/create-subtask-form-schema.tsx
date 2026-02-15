import { z } from 'zod'

export const createSubtaskFormSchema = z.object({
  title: z
    .string()
    .min(1, { error: 'Please ensure the title has atleast 5 characters' }),
})
