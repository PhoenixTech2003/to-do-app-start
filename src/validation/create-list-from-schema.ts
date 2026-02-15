import { z } from 'zod'

export const createListFormSchema = z.object({
  title: z
    .string()
    .min(1, { error: 'Please ensure the title has atleast 5 characters' })
    .max(32, 'Title can not be longer than 32 characters'),
})
