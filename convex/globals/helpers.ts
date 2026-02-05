import type { Id } from '../_generated/dataModel'
import type { QueryCtx } from '../_generated/server'

export const verifyWorkspaceOnwership =
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
