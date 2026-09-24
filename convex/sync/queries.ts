import { paginationOptsValidator } from 'convex/server'
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
  args: { kind: kindValidator, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const result = await ctx.db
      .query(args.kind)
      .withIndex('sync_owner', (q) => q.eq('createdBy', user._id))
      .paginate({
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
