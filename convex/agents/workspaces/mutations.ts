import { v } from 'convex/values'
import { mutation } from '../../_generated/server'

export const createWorkspace = mutation({
  args: {
    title: v.string(),
    userId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const workspace = await ctx.db.insert('workspace', {
      title: args.title,
      createdBy: args.userId,
    })
  },
})
