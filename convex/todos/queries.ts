import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { authComponent } from '../auth'
import { query } from '../_generated/server'
import { attachSubTaskProgress, verifyListOnwership } from '../globals/helpers'
import type { PaginationOptions, PaginationResult } from 'convex/server'
import type { QueryCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'

async function getLoggedInUserId(ctx: QueryCtx) {
  const loggedInUser = await authComponent.getAuthUser(ctx)
  return loggedInUser._id
}

async function ensureListOwnership({
  ctx,
  userId,
  listId,
}: {
  ctx: QueryCtx
  userId: string
  listId: Id<'lists'>
}) {
  const isOwnerOfList = await verifyListOnwership({
    ctx,
    userId,
    listId,
  })

  if (!isOwnerOfList) {
    throw new Error('You are not the owner of this list')
  }
}

/** Any todo query that can be paged, however it was built. */
type PaginatableTodos = {
  paginate: (
    paginationOpts: PaginationOptions,
  ) => Promise<PaginationResult<Doc<'todos'>>>
}

/**
 * Every page of todos leaves here carrying its subtask progress, so a printed
 * row can show what is left without the reader opening it.
 */
async function paginateTodos({
  ctx,
  todosQuery,
  paginationOpts,
}: {
  ctx: QueryCtx
  todosQuery: PaginatableTodos
  paginationOpts: PaginationOptions
}) {
  const results = await todosQuery.paginate(paginationOpts)

  return {
    ...results,
    page: await attachSubTaskProgress({ ctx, todos: results.page }),
  }
}

function applyPriorityFilter<
  T extends {
    filter: (fn: Parameters<T['filter']>[0]) => T
  },
>(todosQuery: T, priority?: string) {
  if (!priority) {
    return todosQuery
  }

  return todosQuery.filter(
    // Convex's query-builder types are difficult to express generically here, so
    // the `any` cast keeps `q.field()`/`q.eq()` typed without over-complicating this helper.
    (q: any) => q.eq(q.field('priority'), priority),
  )
}

function buildListTodosQuery({
  ctx,
  searchTerm,
  listId,
  loggedInUserId,
  status,
}: {
  ctx: QueryCtx
  searchTerm?: string
  listId: Id<'lists'>
  loggedInUserId: string
  status: 'pending' | 'completed' | 'overdue'
}) {
  if (searchTerm) {
    return ctx.db
      .query('todos')
      .withSearchIndex('title', (q) =>
        q
          .search('title', searchTerm)
          .eq('listId', listId)
          .eq('createdBy', loggedInUserId)
          .eq('status', status),
      )
  }

  return ctx.db
    .query('todos')
    .withIndex('by_status_createdBy_listId', (q) =>
      q
        .eq('status', status)
        .eq('createdBy', loggedInUserId)
        .eq('listId', listId),
    )
    .order('desc')
}

function buildInboxTodosQuery({
  ctx,
  searchTerm,
  loggedInUserId,
  status,
}: {
  ctx: QueryCtx
  searchTerm?: string
  loggedInUserId: string
  status: 'pending' | 'completed' | 'overdue'
}) {
  if (searchTerm) {
    return ctx.db
      .query('todos')
      .withSearchIndex('title_by_createdBy_status', (q) =>
        q
          .search('title', searchTerm)
          .eq('createdBy', loggedInUserId)
          .eq('status', status),
      )
      .filter((q) => q.eq(q.field('listId'), undefined))
  }

  return ctx.db
    .query('todos')
    .withIndex('by_createdBy_status', (q) =>
      q.eq('createdBy', loggedInUserId).eq('status', status),
    )
    .filter((q) => q.eq(q.field('listId'), undefined))
    .order('desc')
}

export const GetListDetails = query({
  args: {
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    await ensureListOwnership({
      ctx,
      userId: loggedInUserId,
      listId: args.listId,
    })

    const listDetails = await ctx.db.get('lists', args.listId)
    if (!listDetails) {
      throw new Error('List does not exist contact support')
    }

    return listDetails
  },
})

export const GetAllTodos = query({
  args: {
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    await ensureListOwnership({
      ctx,
      userId: loggedInUserId,
      listId: args.listId,
    })

    const listDetails = await ctx.db.get('lists', args.listId)
    if (!listDetails) {
      throw new Error('List does not exist contact support')
    }

    const todos = await ctx.db
      .query('todos')
      .withIndex('by_list_id_createdBy', (q) =>
        q.eq('listId', args.listId).eq('createdBy', loggedInUserId),
      )
      .collect()

    return {
      listDetails,
      todos: await attachSubTaskProgress({ ctx, todos }),
    }
  },
})

export const GetPendingTodos = query({
  args: {
    listId: v.id('lists'),
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.string()),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    await ensureListOwnership({
      ctx,
      userId: loggedInUserId,
      listId: args.listId,
    })

    const todosQuery = applyPriorityFilter(
      buildListTodosQuery({
        ctx,
        searchTerm: args.searchTerm,
        listId: args.listId,
        loggedInUserId,
        status: 'pending',
      }),
      args.priority,
    )

    return await paginateTodos({
      ctx,
      todosQuery,
      paginationOpts: args.paginationOpts,
    })
  },
})

export const GetCompletedTodos = query({
  args: {
    listId: v.id('lists'),
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.string()),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    await ensureListOwnership({
      ctx,
      userId: loggedInUserId,
      listId: args.listId,
    })

    const todosQuery = applyPriorityFilter(
      buildListTodosQuery({
        ctx,
        searchTerm: args.searchTerm,
        listId: args.listId,
        loggedInUserId,
        status: 'completed',
      }),
      args.priority,
    )

    return await paginateTodos({
      ctx,
      todosQuery,
      paginationOpts: args.paginationOpts,
    })
  },
})

export const GetOverDueTodos = query({
  args: {
    listId: v.id('lists'),
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.string()),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    await ensureListOwnership({
      ctx,
      userId: loggedInUserId,
      listId: args.listId,
    })

    const todosQuery = applyPriorityFilter(
      buildListTodosQuery({
        ctx,
        searchTerm: args.searchTerm,
        listId: args.listId,
        loggedInUserId,
        status: 'overdue',
      }),
      args.priority,
    )

    return await paginateTodos({
      ctx,
      todosQuery,
      paginationOpts: args.paginationOpts,
    })
  },
})

export const GetInboxPendingTodos = query({
  args: {
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.string()),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    const todosQuery = applyPriorityFilter(
      buildInboxTodosQuery({
        ctx,
        searchTerm: args.searchTerm,
        loggedInUserId,
        status: 'pending',
      }),
      args.priority,
    )

    return await paginateTodos({
      ctx,
      todosQuery,
      paginationOpts: args.paginationOpts,
    })
  },
})

export const GetInboxCompletedTodos = query({
  args: {
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.string()),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    const todosQuery = applyPriorityFilter(
      buildInboxTodosQuery({
        ctx,
        searchTerm: args.searchTerm,
        loggedInUserId,
        status: 'completed',
      }),
      args.priority,
    )

    return await paginateTodos({
      ctx,
      todosQuery,
      paginationOpts: args.paginationOpts,
    })
  },
})

export const GetInboxOverdueTodos = query({
  args: {
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.string()),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    const todosQuery = applyPriorityFilter(
      buildInboxTodosQuery({
        ctx,
        searchTerm: args.searchTerm,
        loggedInUserId,
        status: 'overdue',
      }),
      args.priority,
    )

    return await paginateTodos({
      ctx,
      todosQuery,
      paginationOpts: args.paginationOpts,
    })
  },
})

export const GetAllSubtasks = query({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const loggedInUserId = await getLoggedInUserId(ctx)
    const todo = await ctx.db.get('todos', args.todoId)

    // A sheet can outlive its entry for a beat — a deleted todo has no parts
    // rather than being an error.
    if (!todo) {
      return { subtasks: [], progress: { total: 0, done: 0, remaining: 0 } }
    }

    if (todo.createdBy !== loggedInUserId) {
      throw new Error('You are not the owner of this todo')
    }

    const subtasks = await ctx.db
      .query('subTasks')
      .withIndex('by_todo_id', (q) => q.eq('todoId', args.todoId))
      .collect()

    const done = subtasks.filter((subtask) => subtask.completed).length

    return {
      subtasks,
      progress: {
        total: subtasks.length,
        done,
        remaining: subtasks.length - done,
      },
    }
  },
})
