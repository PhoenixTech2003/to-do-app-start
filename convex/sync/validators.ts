import { v } from 'convex/values'
import { recurrenceValidator } from '../todos/recurrence'

export const kindValidator = v.union(
  v.literal('workspace'),
  v.literal('lists'),
  v.literal('todos'),
  v.literal('subTasks'),
  v.literal('habits'),
  v.literal('habitCompletions'),
)
export const fields = {
  title: v.optional(v.string()),
  description: v.optional(v.union(v.string(), v.null())),
  workspaceId: v.optional(v.string()),
  listId: v.optional(v.union(v.string(), v.null())),
  todoId: v.optional(v.string()),
  habitId: v.optional(v.string()),
  status: v.optional(
    v.union(v.literal('pending'), v.literal('completed'), v.literal('overdue')),
  ),
  priority: v.optional(
    v.union(
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
      v.literal('none'),
    ),
  ),
  dueDate: v.optional(v.union(v.string(), v.null())),
  dueTime: v.optional(v.union(v.string(), v.null())),
  recurrence: v.optional(v.union(recurrenceValidator, v.null())),
  recurrenceIndex: v.optional(v.union(v.number(), v.null())),
  seriesId: v.optional(v.string()),
  timeZone: v.optional(v.string()),
  completed: v.optional(v.boolean()),
  completedDate: v.optional(v.string()),
  frequency: v.optional(v.union(v.literal('daily'), v.literal('weekly'))),
  category: v.optional(
    v.union(
      v.literal('health'),
      v.literal('fitness'),
      v.literal('learning'),
      v.literal('mindfulness'),
      v.literal('productivity'),
      v.literal('social'),
      v.literal('creative'),
      v.literal('other'),
    ),
  ),
  deleted: v.optional(v.boolean()),
}
export const patchValidator = v.object(fields)
export const recordValidator = v.object({
  ...fields,
  id: v.string(),
  kind: kindValidator,
  remoteId: v.string(),
  createdBy: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  deleted: v.boolean(),
  writeId: v.string(),
})
