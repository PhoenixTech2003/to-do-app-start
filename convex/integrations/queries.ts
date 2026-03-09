import { v } from 'convex/values'
import { internalQuery, query } from '../_generated/server'
import { authComponent } from '../auth'

export const getIntegrations = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    
    return await ctx.db
      .query('integrations')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
  },
})

export const getIntegration = query({
  args: {
    userIntegrationId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const integration = await ctx.db
      .query('integrations')
      .withIndex('by_userIntegrationId', (q) =>
        q.eq('userIntegrationId', args.userIntegrationId),
      )
      .first()
    return integration
  },
})
