import { v } from 'convex/values'
import { mutation } from '../../_generated/server'
import {
  verifyListOnwership,
  verifyWorkspaceOnwership,
} from '../../globals/helpers'

export const createList = mutation({
  args: {
    title: v.string(),
    workspaceId: v.id('workspace'),
    userId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const isOwnerOfWorkspace = await verifyWorkspaceOnwership({
      ctx,
      userId: args.userId,
      workspaceId: args.workspaceId,
    })
    if (!isOwnerOfWorkspace) {
      throw new Error('You are not the owner of this workspace')
    }
    return await ctx.db.insert('lists', {
      title: args.title,
      createdBy: args.userId,
      workspaceId: args.workspaceId,
    })
  },
})

export const updateList = mutation({
  args: {
    listId: v.id('lists'),
    title: v.string(),
    userId: v.string(),
    accessToken: v.string(),
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
      throw new Error('You are not the owner of this list')
    }
    return await ctx.db.patch('lists', args.listId, {
      title: args.title,
    })
  },
})
