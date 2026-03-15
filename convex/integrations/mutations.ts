import { v } from 'convex/values'
import { internalMutation, mutation } from '../_generated/server'
import { internal } from '../_generated/api'
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

export const linkTelegramWithToken = mutation({
  args: {
    token: v.string(),
    telegramUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenDoc = await ctx.db
      .query('telegramLinkTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first()

    if (!tokenDoc) {
      throw new Error('Token not found or already used')
    }

    if (tokenDoc.expiresAt < Date.now()) {
      await ctx.db.delete(tokenDoc._id)
      throw new Error('Token has expired')
    }

    const userId = tokenDoc.userId

    const existing = await ctx.db
      .query('integrations')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .filter((q) => q.eq(q.field('type'), 'telegram'))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        userIntegrationId: args.telegramUserId,
      })
    } else {
      await ctx.db.insert('integrations', {
        userId,
        userIntegrationId: args.telegramUserId,
        type: 'telegram',
      })
    }

    await ctx.db.delete(tokenDoc._id)
  },
})

export const deleteTelegramLinkToken = internalMutation({
  args: {
    tokenId: v.id('telegramLinkTokens'),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.tokenId)
    if (doc) {
      await ctx.db.delete(args.tokenId)
    }
  },
})

export const createTelegramLinkToken = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)

    // Delete any existing tokens for this user
    const existingTokens = await ctx.db
      .query('telegramLinkTokens')
      .withIndex('by_userId', (q) => q.eq('userId', user._id))
      .collect()
    for (const existing of existingTokens) {
      await ctx.db.delete(existing._id)
    }

    const token = crypto.randomUUID()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

    const tokenId = await ctx.db.insert('telegramLinkTokens', {
      token,
      userId: user._id,
      expiresAt,
    })

    await ctx.scheduler.runAt(
      expiresAt,
      internal.integrations.mutations.deleteTelegramLinkToken,
      { tokenId },
    )
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
