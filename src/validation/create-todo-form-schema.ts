import { z } from 'zod'

export const createTodoFormSchema = z.object({
  title: z
    .string()
    .min(1, { error: 'Please ensure the title has at least 3 characters' }),
  description: z.string().min(1).optional(),
  dueDate: z.date().optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']),
})
