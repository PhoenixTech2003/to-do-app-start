import { v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import { query } from '../_generated/server'
import { authComponent } from '../auth'

export const getUserWorkspaces = query({
  args: {
    searchTerm: v.optional(v.string()),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const userId = loggedInUser._id
    if (!args.searchTerm) {
      return await ctx.db
        .query('workspace')
        .withIndex('createdBy', (q) => q.eq('createdBy', userId))
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query('workspace')
      .withSearchIndex('title', (q) =>
        q.search('title', args.searchTerm ?? '').eq('createdBy', userId),
      )
      .paginate(args.paginationOpts)
  },
})
