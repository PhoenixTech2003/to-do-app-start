import { v } from 'convex/values'
import { query} from '../../_generated/server'

export const getUserWorkspaces = query({
  args: {
    userId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const workspaces = await ctx.db
      .query('workspace')
      .withIndex('createdBy', (q) => q.eq('createdBy', args.userId))
      .collect()
    return workspaces
  },
})
