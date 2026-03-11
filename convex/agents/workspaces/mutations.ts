import { v } from 'convex/values'
import { mutation } from '../../_generated/server'
import { verifyWorkspaceOnwership } from '../../globals/helpers'

export const createWorkspace = mutation({
  args: {
    title: v.string(),
    userId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    return await ctx.db.insert('workspace', {
      title: args.title,
      createdBy: args.userId,
    })
  },
})
export const updateWorkspace = mutation({
  args: {
    workspaceId: v.id('workspace'),
    title: v.string(),
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
    return await ctx.db.patch('workspace', args.workspaceId, {
      title: args.title,
    })
  },
})
