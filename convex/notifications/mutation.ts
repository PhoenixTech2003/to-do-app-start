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

/** Called by the mobile app after the user grants notification permission. */
export const registerExpoPushToken = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal('ios'), v.literal('android')),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    // A device that changes hands keeps its token; it now belongs to whoever
    // signed in last.
    const existing = await ctx.db
      .query('expoPushTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()
    if (existing) {
      await ctx.db.patch(existing._id, {
        createdBy: user._id,
        platform: args.platform,
      })
      return
    }
    await ctx.db.insert('expoPushTokens', { ...args, createdBy: user._id })
  },
})

/** Called on sign-out so the device stops receiving the account's reminders. */
export const unregisterExpoPushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const existing = await ctx.db
      .query('expoPushTokens')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique()
    if (existing?.createdBy === user._id) await ctx.db.delete(existing._id)
  },
})
