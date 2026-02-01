import { v } from 'convex/values'
import { authComponent } from '../auth'
import { mutation } from '../_generated/server'
import type { QueryCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

export const createWorkspace = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    await ctx.db.insert('workspace', {
      title: args.title,
      createdBy: user._id,
    })
  },
})

export const updateWorkspaceDetails = mutation({
  args: {
    workspaceId: v.id('workspace'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const workspace = await ctx.db.get('workspace', args.workspaceId)
    const workspaceId = workspace?._id
    if (!workspaceId) {
      throw new Error('workspace does not exist')
    }
    const isOwnerOfWorkspace = await verifyWorkspaceOnwership({
      ctx,
      userId: loggedInUserId,
      workspaceId,
    })
    if (!isOwnerOfWorkspace) {
      throw new Error('You are not the owner of this workspace')
    }
    await ctx.db.patch('workspace', args.workspaceId, {
      title: args.title,
    })
  },
})

// helpers
const verifyWorkspaceOnwership =
  async function VerifiesIfAPersonOwnsAWorkspace({
    ctx,
    userId,
    workspaceId,
  }: {
    ctx: QueryCtx
    userId: string
    workspaceId: Id<'workspace'>
  }) {
    try {
      const workspace = await ctx.db.get('workspace', workspaceId)
      if (!workspace) {
        throw new Error('Workspace does not exist')
      }
      const workspaceOwnerId = workspace.createdBy
      if (workspaceOwnerId != userId) {
        return false
      }
      return true
    } catch (error) {
      console.error(error)
      throw error
    }
  }
