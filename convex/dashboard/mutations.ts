import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { authComponent } from '../auth'

export const createWorkspace = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    await ctx.db.insert('workspace', {
      title: args.title,
      createdBy: user._id,
    })
  },
})
