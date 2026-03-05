import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authComponent } from '../auth'

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
            .eq('dueDate', args.date)
        )
    } else {
      todosQuery = ctx.db
        .query('todos')
        .withIndex('by_due_date', (q) => q.eq('dueDate', args.date))
        .filter((q) => q.eq(q.field('createdBy'), loggedInUserId))
    }

    if (args.priority) {
      todosQuery = todosQuery.filter((q) => q.eq(q.field('priority'), args.priority))
    }

    const todos = await todosQuery.collect()

    return {
      todos,
    }
  },
})
