import { v } from 'convex/values'
import { query } from '../../_generated/server'

export const getUserWorkspaces = query({
  args: {
    userId: v.string(),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const workspaces = await ctx.db
      .query('workspace')
      .withIndex('createdBy', (q) => q.eq('createdBy', args.userId))
      .collect()
    return workspaces
  },
})

export const getWorkspaceById = query({
  args: {
    userId: v.string(),
    workspaceId: v.id('workspace'),
    accessToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const workspace = await ctx.db
      .query('workspace')
      .withIndex('by_id', (q) => q.eq('_id', args.workspaceId))
      .filter((q) => q.eq('createdBy', args.userId))
      .first()
    return workspace
  },
})
