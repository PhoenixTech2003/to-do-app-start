import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { query } from '../_generated/server'
import { authComponent } from '../auth'

export const GetListDetails = query({
  args: {
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
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
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
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
      listDetails: listDetails,
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
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id

    let todosQuery
    if (args.searchTerm) {
      todosQuery = ctx.db
        .query('todos')
        .withSearchIndex('title', (q) =>
          q
            .search('title', args.searchTerm!)
            .eq('listId', args.listId)
            .eq('createdBy', loggedInUserId)
            .eq('status', 'pending')
        )
    } else {
      todosQuery = ctx.db
        .query('todos')
        .withIndex('by_status_createdBy_listId', (q) =>
          q
            .eq('status', 'pending')
            .eq('createdBy', loggedInUserId)
            .eq('listId', args.listId),
        )
    }

    if (args.priority) {
      todosQuery = todosQuery.filter((q) => q.eq(q.field('priority'), args.priority))
    }

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
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id

    let todosQuery
    if (args.searchTerm) {
      todosQuery = ctx.db
        .query('todos')
        .withSearchIndex('title', (q) =>
          q
            .search('title', args.searchTerm!)
            .eq('listId', args.listId)
            .eq('createdBy', loggedInUserId)
            .eq('status', 'completed')
        )
    } else {
      todosQuery = ctx.db
        .query('todos')
        .withIndex('by_status_createdBy_listId', (q) =>
          q
            .eq('status', 'completed')
            .eq('createdBy', loggedInUserId)
            .eq('listId', args.listId),
        )
    }

    if (args.priority) {
      todosQuery = todosQuery.filter((q) => q.eq(q.field('priority'), args.priority))
    }

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
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id

    let todosQuery
    if (args.searchTerm) {
      todosQuery = ctx.db
        .query('todos')
        .withSearchIndex('title', (q) =>
          q
            .search('title', args.searchTerm!)
            .eq('listId', args.listId)
            .eq('createdBy', loggedInUserId)
            .eq('status', 'overdue')
        )
    } else {
      todosQuery = ctx.db
        .query('todos')
        .withIndex('by_status_createdBy_listId', (q) =>
          q
            .eq('status', 'overdue')
            .eq('createdBy', loggedInUserId)
            .eq('listId', args.listId),
        )
    }

    if (args.priority) {
      todosQuery = todosQuery.filter((q) => q.eq(q.field('priority'), args.priority))
    }

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
