import { v } from 'convex/values'
import { paginationOptsValidator } from "convex/server";
import { query } from '../_generated/server'
import { authComponent } from '../auth'
import { verifyWorkspaceOnwership } from '../globals/helpers'

export const GetWorkspaceDetails = query({
  args: {
    workspaceId: v.id('workspace'),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const isOwnerOfWorkspace = await verifyWorkspaceOnwership({
      ctx,
      userId: loggedInUserId,
      workspaceId: args.workspaceId,
    })

    if (!isOwnerOfWorkspace) {
      throw new Error('You are not the owner of this workspace')
    }

    const workspaceDetails = await ctx.db.get('workspace', args.workspaceId)
    return workspaceDetails
  },
})

export const GetWorkspaceLists = query({
  args: {
    searchTerm: v.optional(v.string()),
    workspaceId: v.id('workspace'),
    refreshKey: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const isOwnerOfWorkspace = await verifyWorkspaceOnwership({
      ctx,
      userId: loggedInUserId,
      workspaceId: args.workspaceId,
    })

    if (!isOwnerOfWorkspace) {
      throw new Error('You are not the owner of this workspace')
    }

    if (!args.searchTerm) {
      return await ctx.db
        .query('lists')
        .withIndex('createdBy_workspaceId', (q) =>
          q.eq('createdBy', loggedInUserId).eq('workspaceId', args.workspaceId),
        )
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query('lists')
      .withSearchIndex('title', (q) =>
        q
          .search('title', args.searchTerm ?? '')
          .eq('createdBy', loggedInUserId)
          .eq('workspaceId', args.workspaceId),
      )
      .paginate(args.paginationOpts)
  },
})
