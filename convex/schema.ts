import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  workspace: defineTable({
    title: v.string(),
    createdBy: v.string(),
  })
    .index('createdBy', ['createdBy'])
    .searchIndex('title', {
      searchField: 'title',
      filterFields: ['createdBy'],
    }),
  lists: defineTable({
    title: v.string(),
    workspaceId: v.id('workspace'),
    createdBy: v.string(),
  })
    .searchIndex('title', {
      searchField: 'title',
      filterFields: ['createdBy', 'workspaceId'],
    })
    .index('createdBy', ['createdBy'])
    .index('workspaceId', ['workspaceId'])
    .index('createdBy_workspaceId', ['createdBy', 'workspaceId']),
  todos: defineTable({
    listId: v.optional(v.id('lists')),
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
    .searchIndex('title', {
      searchField: 'title',
      filterFields: ['listId', 'createdBy', 'status', 'priority', 'dueDate'],
    })
    .searchIndex('title_by_createdBy_status', {
      searchField: 'title',
      filterFields: ['createdBy', 'status', 'priority', 'dueDate'],
    })
    .index('by_listId', ['listId'])
    .index('by_list_id_createdBy', ['listId', 'createdBy'])
    .index('by_createdBy', ['createdBy'])
    .index('by_createdBy_status', ['createdBy', 'status'])
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
  habits: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    frequency: v.union(v.literal('daily'), v.literal('weekly')),
    category: v.union(
      v.literal('health'),
      v.literal('fitness'),
      v.literal('learning'),
      v.literal('mindfulness'),
      v.literal('productivity'),
      v.literal('social'),
      v.literal('creative'),
      v.literal('other'),
    ),
    currentStreak: v.number(),
    longestStreak: v.number(),
    totalCompletions: v.number(),
    createdBy: v.string(),
  }).index('by_createdBy', ['createdBy']),
  habitCompletions: defineTable({
    habitId: v.id('habits'),
    completedDate: v.string(),
    createdBy: v.string(),
  })
    .index('by_habitId', ['habitId'])
    .index('by_createdBy_date', ['createdBy', 'completedDate'])
    .index('by_habitId_date', ['habitId', 'completedDate']),
})
