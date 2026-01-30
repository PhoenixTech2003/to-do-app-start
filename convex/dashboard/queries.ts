import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authComponent } from '../auth'

export const getUserWorkspaces = query({
  handler: async (ctx) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const userId = loggedInUser._id
    const loggedInUserWorkspaces = await ctx.db
      .query('workspace')
      .withIndex('createdBy', (q) => q.eq('createdBy', userId))
      .collect()
    return loggedInUserWorkspaces
  },
})
