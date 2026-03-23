import { v } from 'convex/values'
import { internalMutation, internalQuery } from '../_generated/server'

export const getSandboxSnapshot = internalQuery({
  args: {
    toolKey: v.string(),
    runtime: v.string(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query('sandboxSnapshots')
      .withIndex('by_toolKey_runtime', (q) =>
        q.eq('toolKey', args.toolKey).eq('runtime', args.runtime),
      )
      .first()

    if (!record || record.status !== 'ready') {
      return null
    }

    return {
      snapshotId: record.snapshotId,
      expiresAt: record.expiresAt,
    }
  },
})

export const upsertSandboxSnapshot = internalMutation({
  args: {
    toolKey: v.string(),
    runtime: v.string(),
    snapshotId: v.string(),
    status: v.union(v.literal('ready'), v.literal('stale')),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('sandboxSnapshots')
      .withIndex('by_toolKey_runtime', (q) =>
        q.eq('toolKey', args.toolKey).eq('runtime', args.runtime),
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        snapshotId: args.snapshotId,
        status: args.status,
        expiresAt: args.expiresAt,
      })
      return
    }

    await ctx.db.insert('sandboxSnapshots', {
      toolKey: args.toolKey,
      runtime: args.runtime,
      snapshotId: args.snapshotId,
      status: args.status,
      expiresAt: args.expiresAt,
    })
  },
})

export const markSandboxSnapshotStale = internalMutation({
  args: {
    toolKey: v.string(),
    runtime: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('sandboxSnapshots')
      .withIndex('by_toolKey_runtime', (q) =>
        q.eq('toolKey', args.toolKey).eq('runtime', args.runtime),
      )
      .first()

    if (!existing) {
      return
    }

    await ctx.db.patch(existing._id, {
      status: 'stale',
    })
  },
})
