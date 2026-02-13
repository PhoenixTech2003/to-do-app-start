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
    title: v.string(),
    description: v.optional(v.string()),
    completed: v.boolean(),
    dueDate: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    ),
    createdBy: v.string(),
  }),
})
