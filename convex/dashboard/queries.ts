import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authComponent } from '../auth'

export const getUserWorkspaces = query({
  args: {
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const userId = loggedInUser._id
    if (!args.searchTerm) {
      const loggedInUserWorkspaces = await ctx.db
        .query('workspace')
        .withIndex('createdBy', (q) => q.eq('createdBy', userId))
        .collect()
      return loggedInUserWorkspaces
    }

    const loggedInUserWorkspaces = await ctx.db
      .query('workspace')
      .withSearchIndex('title', (q) =>
        q.search('title', args.searchTerm ?? 'i').eq('createdBy', userId),
      )
      .collect()
    return loggedInUserWorkspaces
  },
})
