import { v } from 'convex/values'
import { query } from '../../_generated/server'
import { verifyListOnwership } from '../../globals/helpers'

export const getLists = query({
  args: {
    workspaceId: v.id('workspace'),
    userId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const lists = await ctx.db
      .query('lists')
      .withIndex('createdBy_workspaceId', (q) =>
        q.eq('createdBy', args.userId).eq('workspaceId', args.workspaceId),
      )
      .collect()
    return lists
  },
})

export const getListById = query({
  args: {
    listId: v.id('lists'),
    userId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const list = await ctx.db.get('lists', args.listId)
    if (!list) {
      throw new Error('List does not exist')
    }
    const isOwnerOfList = await verifyListOnwership({
      ctx,
      userId: args.userId,
      listId: args.listId,
    })
    if (!isOwnerOfList) {
      throw new Error('You are not the owner of this list')
    }
    return list
  },
})
