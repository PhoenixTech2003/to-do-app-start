import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authComponent } from '../auth'
import { kindValidator } from './validators'
import { record } from './model'

export const head = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return null
    return (
      (
        await ctx.db
          .query('syncHeads')
          .withIndex('by_owner', (q) => q.eq('createdBy', user._id))
          .unique()
      )?.version ?? 0
    )
  },
})
export const list = query({
  args: {
    kind: kindValidator,
    paginationOpts: paginationOptsValidator,
    /**
     * Only records changed after this server time (ms), for incremental
     * pulls. Omitted, every record is returned, including ones written
     * before records carried `updatedAt`.
     */
    since: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const since = args.since
    const rows =
      since === undefined
        ? ctx.db
            .query(args.kind)
            .withIndex('sync_owner', (q) => q.eq('createdBy', user._id))
        : ctx.db
            .query(args.kind)
            .withIndex('sync_updated', (q) =>
              q.eq('createdBy', user._id).gt('updatedAt', since),
            )
    const result = await rows.paginate({
      ...args.paginationOpts,
      numItems: Math.min(args.paginationOpts.numItems, 100),
    })
    return {
      ...result,
      page: await Promise.all(
        result.page.map((row) => record(ctx, args.kind, row)),
      ),
    }
  },
})
