import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authComponent } from '../auth'
import { attachTodoLocations } from './helpers'

export const GetAllUpcomingTodos = query({
  args: {
    today: v.string(),
    searchTerm: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id

    let todosQuery
    if (args.searchTerm) {
      todosQuery = ctx.db
        .query('todos')
        .withSearchIndex('title_by_createdBy_status', (q) =>
          q
            .search('title', args.searchTerm!)
            .eq('createdBy', loggedInUserId)
            .eq('status', 'pending'),
        )
        .filter((q) =>
          q.and(
            q.neq(q.field('dueDate'), undefined),
            q.gte(q.field('dueDate'), args.today),
          ),
        )
    } else {
      todosQuery = ctx.db
        .query('todos')
        .withIndex('by_createdBy_status', (q) =>
          q.eq('createdBy', loggedInUserId).eq('status', 'pending'),
        )
        .filter((q) =>
          q.and(
            q.neq(q.field('dueDate'), undefined),
            q.gte(q.field('dueDate'), args.today),
          ),
        )
    }

    const results = await todosQuery.paginate(args.paginationOpts)

    return {
      ...results,
      page: await attachTodoLocations({ ctx, todos: results.page }),
    }
  },
})

export const GetAllOverdueTodos = query({
  args: {
    searchTerm: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id

    let todosQuery
    if (args.searchTerm) {
      todosQuery = ctx.db
        .query('todos')
        .withSearchIndex('title_by_createdBy_status', (q) =>
          q
            .search('title', args.searchTerm!)
            .eq('createdBy', loggedInUserId)
            .eq('status', 'overdue'),
        )
    } else {
      todosQuery = ctx.db
        .query('todos')
        .withIndex('by_createdBy_status', (q) =>
          q.eq('createdBy', loggedInUserId).eq('status', 'overdue'),
        )
    }

    const results = await todosQuery.paginate(args.paginationOpts)

    return {
      ...results,
      page: await attachTodoLocations({ ctx, todos: results.page }),
    }
  },
})

export const getTodosByDate = query({
  args: {
    date: v.string(),
    searchTerm: v.optional(v.string()),
    priority: v.optional(v.string()),
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
            .eq('createdBy', loggedInUserId)
            .eq('dueDate', args.date),
        )
    } else {
      todosQuery = ctx.db
        .query('todos')
        .withIndex('by_due_date', (q) => q.eq('dueDate', args.date))
        .filter((q) => q.eq(q.field('createdBy'), loggedInUserId))
    }

    if (args.priority) {
      todosQuery = todosQuery.filter((q) =>
        q.eq(q.field('priority'), args.priority),
      )
    }

    const todos = await todosQuery.collect()

    return {
      todos: await attachTodoLocations({ ctx, todos }),
    }
  },
})
