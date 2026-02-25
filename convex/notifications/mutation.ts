import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { authComponent } from '../auth'

export const createPushNotificationToken = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const userId = user._id
    const existingToken = await ctx.db
      .query('pushNotificationTokens')
      .withIndex('by_createdBy', (q) => q.eq('createdBy', userId))
      .first()
    if (existingToken) {
      return await ctx.db.patch(existingToken._id, {
        token: args.token,
      })
    }
    return await ctx.db.insert('pushNotificationTokens', {
      token: args.token,
      createdBy: userId,
    })
  },
})
