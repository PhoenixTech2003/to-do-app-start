import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authComponent } from '../auth'

export const getTodosByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const todos = await ctx.db
      .query('todos')
      .withIndex('by_due_date', (q) => q.eq('dueDate', args.date))
      .collect()
    return {
      todos,
    }
  },
})
