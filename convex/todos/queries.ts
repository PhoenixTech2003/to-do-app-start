import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { authComponent } from '../auth'
import { query } from '../_generated/server'
import { verifyListOnwership } from '../globals/helpers'
import type { QueryCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

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

function applyPriorityFilter<
  T extends {
    filter: (fn: Parameters<T['filter']>[0]) => T
  },
>(todosQuery: T, priority?: string) {
  if (!priority) {
    return todosQuery
  }

  return todosQuery.filter((q: any) => q.eq(q.field('priority'), priority))
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
      todos,
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

    return await todosQuery.paginate(args.paginationOpts)
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

    return await todosQuery.paginate(args.paginationOpts)
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

    return await todosQuery.paginate(args.paginationOpts)
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

    return await todosQuery.paginate(args.paginationOpts)
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

    return await todosQuery.paginate(args.paginationOpts)
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

    return await todosQuery.paginate(args.paginationOpts)
  },
})

export const GetAllSubtasks = query({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const subtasks = await ctx.db
      .query('subTasks')
      .withIndex('by_todo_id', (q) => q.eq('todoId', args.todoId))
      .collect()

    return {
      subtasks,
    }
  },
})
