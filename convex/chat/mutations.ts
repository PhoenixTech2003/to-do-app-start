import { addMinutes, parseISO } from 'date-fns'
import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalMutation } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'
import type { MutationCtx } from '../_generated/server'

const platformValidator = v.union(v.literal('whatsapp'), v.literal('telegram'))
const priorityValidator = v.union(
  v.literal('high'),
  v.literal('medium'),
  v.literal('low'),
  v.literal('none'),
)
const statusValidator = v.union(
  v.literal('pending'),
  v.literal('completed'),
  v.literal('overdue'),
)

async function ensureWorkspaceOwner(
  ctx: MutationCtx,
  userId: string,
  workspaceId: Id<'workspace'>,
) {
  const workspace = await ctx.db.get(workspaceId)
  if (!workspace || workspace.createdBy !== userId) {
    throw new Error('Workspace not found.')
  }
  return workspace
}

async function ensureListOwner(ctx: MutationCtx, userId: string, listId: Id<'lists'>) {
  const list = await ctx.db.get(listId)
  if (!list || list.createdBy !== userId) {
    throw new Error('List not found.')
  }
  return list
}

async function ensureTodoOwner(ctx: MutationCtx, userId: string, todoId: Id<'todos'>) {
  const todo = await ctx.db.get(todoId)
  if (!todo || todo.createdBy !== userId) {
    throw new Error('Todo not found.')
  }
  return todo
}

function getDueFields(due: string | undefined) {
  if (!due) {
    return {
      dueDate: undefined,
      dueTime: undefined,
    }
  }

  return {
    dueDate: due,
    dueTime: '00:00',
  }
}

function getScheduledRunTime(due: string | undefined) {
  if (!due) return undefined
  return addMinutes(parseISO(`${due}T00:00:00Z`), 1).getTime()
}

async function toTodoSnapshot(
  ctx: MutationCtx,
  todoId: Id<'todos'>,
  userId: string,
) {
  const todo = await ensureTodoOwner(ctx, userId, todoId)
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

async function deleteTodoCascade(ctx: MutationCtx, todo: Doc<'todos'>) {
  const subTasks = await ctx.db
    .query('subTasks')
    .withIndex('by_todo_id', (q) => q.eq('todoId', todo._id))
    .collect()

  for (const subTask of subTasks) {
    await ctx.db.delete(subTask._id)
  }

  if (todo.markAsOverdueScheudledFunctionId) {
    await ctx.scheduler.cancel(todo.markAsOverdueScheudledFunctionId)
  }

  await ctx.db.delete(todo._id)
}

export const saveSessionContext = internalMutation({
  args: {
    userId: v.string(),
    platform: platformValidator,
    activeWorkspaceId: v.optional(v.union(v.id('workspace'), v.null())),
    activeListId: v.optional(v.union(v.id('lists'), v.null())),
    todos: v.optional(
      v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          due: v.optional(v.union(v.string(), v.null())),
          priority: v.optional(
            v.union(v.literal('high'), v.literal('medium'), v.literal('low'), v.null()),
          ),
          completed: v.boolean(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('chatSessions')
      .withIndex('by_userId_platform', (q) =>
        q.eq('userId', args.userId).eq('platform', args.platform),
      )
      .first()

    const patch: {
      userId?: string
      platform?: 'whatsapp' | 'telegram'
      activeWorkspaceId?: Id<'workspace'> | undefined
      activeListId?: Id<'lists'> | undefined
      lastTodoSnapshot?: Array<{
        todoId: Id<'todos'>
        name: string
        due?: string
        priority?: 'high' | 'medium' | 'low'
        completed: boolean
      }>
      lastCommandAt: number
    } = {
      lastCommandAt: Date.now(),
    }

    if ('activeWorkspaceId' in args) {
      patch.activeWorkspaceId = args.activeWorkspaceId ?? undefined
    }
    if ('activeListId' in args) {
      patch.activeListId = args.activeListId ?? undefined
    }
    if (args.todos) {
      patch.lastTodoSnapshot = args.todos.map((todo) => ({
        todoId: todo.id as Id<'todos'>,
        name: todo.name,
        due: todo.due ?? undefined,
        priority: todo.priority ?? undefined,
        completed: todo.completed,
      }))
    }

    if (existing) {
      await ctx.db.patch(existing._id, patch)
      return
    }

    await ctx.db.insert('chatSessions', {
      userId: args.userId,
      platform: args.platform,
      activeWorkspaceId: patch.activeWorkspaceId,
      activeListId: patch.activeListId,
      lastTodoSnapshot: patch.lastTodoSnapshot ?? [],
      lastCommandAt: patch.lastCommandAt,
    })
  },
})

export const createWorkspace = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const workspaceId = await ctx.db.insert('workspace', {
      title: args.name,
      createdBy: args.userId,
    })

    return {
      id: workspaceId,
      name: args.name,
    }
  },
})

export const createList = internalMutation({
  args: {
    userId: v.string(),
    workspaceId: v.id('workspace'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ensureWorkspaceOwner(ctx, args.userId, args.workspaceId)
    const listId = await ctx.db.insert('lists', {
      title: args.name,
      createdBy: args.userId,
      workspaceId: args.workspaceId,
    })

    return {
      id: listId,
      name: args.name,
      workspaceId: args.workspaceId,
      workspaceName: workspace.title,
    }
  },
})

export const createTodo = internalMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    due: v.optional(v.union(v.string(), v.null())),
    priority: priorityValidator,
    listId: v.optional(v.union(v.id('lists'), v.null())),
  },
  handler: async (ctx, args) => {
    let listId: Id<'lists'> | undefined
    if (args.listId) {
      await ensureListOwner(ctx, args.userId, args.listId)
      listId = args.listId
    }

    const due = args.due ?? undefined
    const todoId = await ctx.db.insert('todos', {
      title: args.name,
      listId,
      description: undefined,
      status: 'pending',
      ...getDueFields(due),
      priority: args.priority,
      createdBy: args.userId,
    })

    const scheduledRunTime = getScheduledRunTime(due)
    if (scheduledRunTime) {
      const scheduledFunctionId = await ctx.scheduler.runAt(
        scheduledRunTime,
        internal.todos.mutations.ToggleTodoStatusOverdue,
        { todoId },
      )
      await ctx.db.patch(todoId, {
        markAsOverdueScheudledFunctionId: scheduledFunctionId,
      })
    }

    return await toTodoSnapshot(ctx, todoId, args.userId)
  },
})

export const updateTodo = internalMutation({
  args: {
    userId: v.string(),
    todoId: v.id('todos'),
    name: v.optional(v.string()),
    due: v.optional(v.union(v.string(), v.null())),
    priority: v.optional(priorityValidator),
    listId: v.optional(v.union(v.id('lists'), v.null())),
  },
  handler: async (ctx, args) => {
    const currentTodo = await ensureTodoOwner(ctx, args.userId, args.todoId)

    let nextListId = currentTodo.listId
    if ('listId' in args) {
      if (args.listId) {
        await ensureListOwner(ctx, args.userId, args.listId)
      }
      nextListId = args.listId ?? undefined
    }

    const due =
      'due' in args ? args.due ?? undefined : currentTodo.dueDate ?? undefined
    const updateData: Partial<Doc<'todos'>> = {
      title: args.name ?? currentTodo.title,
      priority: args.priority ?? currentTodo.priority,
      listId: nextListId,
      ...getDueFields(due),
    }

    await ctx.db.patch(args.todoId, updateData)

    if (currentTodo.markAsOverdueScheudledFunctionId) {
      await ctx.scheduler.cancel(currentTodo.markAsOverdueScheudledFunctionId)
    }

    const scheduledRunTime = getScheduledRunTime(due)
    if (scheduledRunTime) {
      const scheduledFunctionId = await ctx.scheduler.runAt(
        scheduledRunTime,
        internal.todos.mutations.ToggleTodoStatusOverdue,
        { todoId: args.todoId },
      )
      await ctx.db.patch(args.todoId, {
        markAsOverdueScheudledFunctionId: scheduledFunctionId,
      })
    } else {
      await ctx.db.patch(args.todoId, {
        markAsOverdueScheudledFunctionId: undefined,
      })
    }

    return await toTodoSnapshot(ctx, args.todoId, args.userId)
  },
})

export const setTodoStatus = internalMutation({
  args: {
    userId: v.string(),
    todoId: v.id('todos'),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    await ensureTodoOwner(ctx, args.userId, args.todoId)
    await ctx.db.patch(args.todoId, {
      status: args.status,
    })
    return await toTodoSnapshot(ctx, args.todoId, args.userId)
  },
})

export const deleteTodo = internalMutation({
  args: {
    userId: v.string(),
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const todo = await ensureTodoOwner(ctx, args.userId, args.todoId)
    const snapshot = await toTodoSnapshot(ctx, args.todoId, args.userId)
    await deleteTodoCascade(ctx, todo)
    return snapshot
  },
})
