import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { authComponent } from '../auth'

export const upsertWhatsAppIntegration = mutation({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const existing = await ctx.db
      .query('integrations')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('type'), 'whatsapp'))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        userIntegrationId: args.phoneNumber,
      })
    } else {
      await ctx.db.insert('integrations', {
        userId: user._id,
        userIntegrationId: args.phoneNumber,
        type: 'whatsapp',
      })
    }
  },
})

export const removeIntegration = mutation({
  args: {
    id: v.id('integrations'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const integration = await ctx.db.get(args.id)
    if (!integration || integration.userId !== user._id) {
      throw new Error('Integration not found or unauthorized')
    }

    await ctx.db.delete(args.id)
  },
})
