import { v } from 'convex/values'
import { query } from '../../_generated/server'
import { verifyListOnwership } from '../../globals/helpers'

export const getTodos = query({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const isOwnerOfList = await verifyListOnwership({
      ctx,
      userId: args.userId,
      listId: args.listId,
    })
    if (!isOwnerOfList) {
      throw new Error('You are not the owner of the list')
    }
    return await ctx.db
      .query('todos')
      .withIndex('by_listId', (q) => q.eq('listId', args.listId))
      .collect()
  },
})
