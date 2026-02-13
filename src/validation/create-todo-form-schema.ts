import { z } from 'zod'

export const createTodoFormSchema = z.object({
  title: z
    .string()
    .min(3, { error: 'Please ensure the title has at least 3 characters' })
    .max(128, 'Title cannot be longer than 128 characters'),
  description: z
    .string()
    .min(1, { error: 'Description is required' })
    .max(500, 'Description cannot be longer than 500 characters'),
  dueDate: z.string(),
  priority: z.enum(['high', 'medium', 'low', 'none']),
})
