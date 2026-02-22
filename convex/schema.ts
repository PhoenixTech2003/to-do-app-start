import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  workspace: defineTable({
    title: v.string(),
    createdBy: v.string(),
  }).index('createdBy', ['createdBy']),
  lists: defineTable({
    title: v.string(),
    workspaceId: v.id('workspace'),
    createdBy: v.string(),
  })
    .index('createdBy', ['createdBy'])
    .index('workspaceId', ['workspaceId'])
    .index('createdBy_workspaceId', ['createdBy', 'workspaceId']),
  todos: defineTable({
    listId: v.id('lists'),
    markAsOverdueScheudledFunctionId: v.optional(v.id('_scheduled_functions')),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('overdue'),
    ),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    priority: v.union(
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
      v.literal('none'),
    ),
    createdBy: v.string(),
  })
    .index('by_listId', ['listId'])
    .index('by_list_id_createdBy', ['listId', 'createdBy'])
    .index('by_due_date', ['dueDate'])
    .index('by_status_createdBy_listId', ['status', 'createdBy', 'listId']),
  subTasks: defineTable({
    todoId: v.id('todos'),
    title: v.string(),
    completed: v.boolean(),
    createdBy: v.string(),
  }).index('by_todo_id', ['todoId']),
  pushNotificationTokens: defineTable({
    token: v.string(),
    createdBy: v.string(),
  }).index('by_createdBy', ['createdBy']),
})
