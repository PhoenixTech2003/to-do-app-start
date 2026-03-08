import { v } from 'convex/values'
import { internalQuery, query } from '../_generated/server'

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
