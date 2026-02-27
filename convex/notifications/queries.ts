import { query } from '../_generated/server'
import { authComponent } from '../auth'

export const getPushNotificationToken = query({
  handler: async (ctx) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const userId = loggedInUser._id
    const pushNotificationToken = await ctx.db
      .query('pushNotificationTokens')
      .withIndex('by_createdBy', (q) => q.eq('createdBy', userId))
      .first()
    return {
      data: pushNotificationToken,
    }
  },
})
