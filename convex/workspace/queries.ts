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

export const GetUserListsForMove = query({
  args: {
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id

    const lists = args.searchTerm
      ? await ctx.db
          .query('lists')
          .withSearchIndex('title', (q) =>
            q.search('title', args.searchTerm ?? '').eq('createdBy', loggedInUserId),
          )
          .collect()
      : await ctx.db
          .query('lists')
          .withIndex('createdBy', (q) => q.eq('createdBy', loggedInUserId))
          .collect()

    const workspaceById = new Map<string, string>()
    const workspaceIds = [...new Set(lists.map((list) => list.workspaceId))]

    await Promise.all(
      workspaceIds.map(async (workspaceId) => {
        const workspace = await ctx.db.get('workspace', workspaceId)
        workspaceById.set(workspaceId, workspace?.title ?? 'Unknown workspace')
      }),
    )

    return lists.map((list) => ({
      ...list,
      workspaceTitle: workspaceById.get(list.workspaceId) ?? 'Unknown workspace',
    }))
  },
})
