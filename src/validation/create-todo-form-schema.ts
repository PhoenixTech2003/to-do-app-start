import { z } from 'zod'

export const recurrenceRuleSchema = z.object({
  freq: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365),
  weekdays: z.array(z.number().int().min(0).max(6)).optional(),
  until: z.string().optional(),
  count: z.number().int().min(1).max(999).optional(),
})

export const createTodoFormSchema = z.object({
  title: z
    .string()
    .min(1, { error: 'Please ensure the title has at least 3 characters' }),
  description: z.string().min(1).optional(),
  dueDate: z.date().optional(),
  dueTime: z.date().optional(),
  recurrence: recurrenceRuleSchema.optional(),
  priority: z.enum(['high', 'medium', 'low', 'none']),
})
