import { z } from 'zod'

/**
 * A subtask is written on the same slip a twodo is: it gets a title, a note
 * and a date of its own. It has no priority and no recurrence — those belong
 * to the entry it hangs under.
 */
export const createSubtaskFormSchema = z.object({
  title: z.string().min(1, { error: 'A subtask needs a title.' }),
  description: z.string().min(1).optional(),
  dueDate: z.date().optional(),
})
