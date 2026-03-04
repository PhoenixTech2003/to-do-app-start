import { v } from 'convex/values'
import { query } from '../_generated/server'
import { authComponent } from '../auth'
import { verifyWorkspaceOnwership } from '../globals/helpers'

export const getAllUserWorkspaceLists = query({
  args: {
    searchTerm: v.optional(v.string()),
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

    if (!args.searchTerm) {
      const lists = await ctx.db
        .query('lists')
        .withIndex('createdBy_workspaceId', (q) =>
          q.eq('createdBy', loggedInUserId).eq('workspaceId', args.workspaceId),
        )
        .collect()
      return {
        workspaceDetails,
        lists,
      }
    }
    const lists = await ctx.db
      .query('lists')
      .withSearchIndex('title', (q) =>
        q
          .search('title', args.searchTerm ?? '')
          .eq('createdBy', loggedInUserId)
          .eq('workspaceId', args.workspaceId),
      )
      .collect()

    return {
      workspaceDetails,
      lists,
    }
  },
})
