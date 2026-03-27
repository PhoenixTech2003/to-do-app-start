import { v } from 'convex/values'
import { internalQuery } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

const platformValidator = v.union(v.literal('whatsapp'), v.literal('telegram'))

async function getWorkspaceName(ctx: QueryCtx, workspaceId?: Id<'workspace'>) {
  if (!workspaceId) return null
  const workspace = await ctx.db.get(workspaceId)
  return workspace?.title ?? null
}

async function getListDetails(ctx: QueryCtx, listId?: Id<'lists'>) {
  if (!listId) return null
  const list = await ctx.db.get(listId)
  if (!list) return null
  const workspace = await ctx.db.get(list.workspaceId)
  return {
    id: list._id,
    name: list.title,
    workspaceId: list.workspaceId,
    workspaceName: workspace?.title ?? null,
  }
}

async function toTodoSummary(ctx: QueryCtx, todo: Doc<'todos'>) {
  const list = todo.listId ? await ctx.db.get(todo.listId) : null
  const workspace = list ? await ctx.db.get(list.workspaceId) : null
  return {
    id: todo._id,
    name: todo.title,
    description: todo.description ?? null,
    due: todo.dueDate ?? null,
    priority: todo.priority,
    status: todo.status,
    listId: list?._id ?? null,
    listName: list?.title ?? null,
    workspaceId: workspace?._id ?? null,
    workspaceName: workspace?.title ?? null,
  }
}

export const getSessionContext = internalQuery({
  args: {
    userId: v.string(),
    platform: platformValidator,
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('chatSessions')
      .withIndex('by_userId_platform', (q) =>
        q.eq('userId', args.userId).eq('platform', args.platform),
      )
      .first()

    const activeWorkspaceName = await getWorkspaceName(ctx, session?.activeWorkspaceId)
    const activeList = await getListDetails(ctx, session?.activeListId)

    return {
      activeWorkspaceId: session?.activeWorkspaceId ?? null,
      activeWorkspaceName:
        activeList?.workspaceName ?? activeWorkspaceName ?? null,
      activeListId: activeList?.id ?? null,
      activeListName: activeList?.name ?? null,
      todos:
        session?.lastTodoSnapshot.map((todo) => ({
          id: todo.todoId,
          name: todo.name,
          due: todo.due ?? null,
          priority: todo.priority ?? null,
          completed: todo.completed,
        })) ?? [],
    }
  },
})

export const listWorkspaces = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const workspaces = await ctx.db
      .query('workspace')
      .withIndex('createdBy', (q) => q.eq('createdBy', args.userId))
      .collect()

    return workspaces.map((workspace) => ({
      id: workspace._id,
      name: workspace.title,
    }))
  },
})

export const listLists = internalQuery({
  args: {
    userId: v.string(),
    workspaceId: v.optional(v.id('workspace')),
  },
  handler: async (ctx, args) => {
    const lists = args.workspaceId
      ? await ctx.db
          .query('lists')
          .withIndex('createdBy_workspaceId', (q) =>
            q.eq('createdBy', args.userId).eq('workspaceId', args.workspaceId!),
          )
          .collect()
      : await ctx.db
          .query('lists')
          .withIndex('createdBy', (q) => q.eq('createdBy', args.userId))
          .collect()

    const workspaceIds = [...new Set(lists.map((list) => String(list.workspaceId)))]
    const workspaceMap = new Map<string, string>()

    await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        const workspace = await ctx.db.get(workspaceId as Id<'workspace'>)
        workspaceMap.set(workspaceId, workspace?.title ?? 'Unknown workspace')
      }),
    )

    return lists.map((list) => ({
      id: list._id,
      name: list.title,
      workspaceId: list.workspaceId,
      workspaceName: workspaceMap.get(String(list.workspaceId)) ?? 'Unknown workspace',
    }))
  },
})

export const listTodos = internalQuery({
  args: {
    userId: v.string(),
    listId: v.optional(v.id('lists')),
    workspaceId: v.optional(v.id('workspace')),
    due: v.optional(v.string()),
    dueBefore: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
    ),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let todos = await ctx.db
      .query('todos')
      .withIndex('by_createdBy', (q) => q.eq('createdBy', args.userId))
      .collect()

    if (args.listId) {
      todos = todos.filter((todo) => todo.listId === args.listId)
    }

    if (args.workspaceId) {
      const lists = await ctx.db
        .query('lists')
        .withIndex('createdBy_workspaceId', (q) =>
          q.eq('createdBy', args.userId).eq('workspaceId', args.workspaceId!),
        )
        .collect()
      const allowedListIds = new Set(lists.map((list) => String(list._id)))
      todos = todos.filter((todo) => todo.listId && allowedListIds.has(String(todo.listId)))
    }

    if (args.due) {
      todos = todos.filter((todo) => todo.dueDate === args.due)
    }

    if (args.dueBefore) {
      todos = todos.filter(
        (todo) => todo.dueDate && todo.dueDate <= args.dueBefore!,
      )
    }

    if (args.priority) {
      todos = todos.filter((todo) => todo.priority === args.priority)
    }

    if (typeof args.completed === 'boolean') {
      todos = todos.filter((todo) =>
        args.completed ? todo.status === 'completed' : todo.status !== 'completed',
      )
    }

    const summaries = await Promise.all(todos.map((todo) => toTodoSummary(ctx, todo)))

    return summaries.sort((left, right) => {
      if (left.due && right.due) return left.due.localeCompare(right.due)
      if (left.due) return -1
      if (right.due) return 1
      return left.name.localeCompare(right.name)
    })
  },
})

export const getTodoById = internalQuery({
  args: {
    userId: v.string(),
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get(args.todoId)
    if (!todo || todo.createdBy !== args.userId) {
      return null
    }
    return await toTodoSummary(ctx, todo)
  },
})
