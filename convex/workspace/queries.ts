import { query } from '../_generated/server'
import { authComponent } from '../auth'

export const getAllUserWorkspaceLists = query({
  handler: async (ctx) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    return await ctx.db
      .query('lists')
      .withIndex('createdBy', (q) => q.eq('createdBy', loggedInUserId))
      .collect()
  },
})
