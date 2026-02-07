import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { authComponent } from '../auth'
import { verifyListOnwership } from '../globals/helpers'

export const updatelistDetails = mutation({
  args: {
    listId: v.id('lists'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const list = await ctx.db.get('lists', args.listId)
    const listId = list?._id
    if (!listId) {
      throw new Error('list does not exist')
    }
    const isOwnerOflist = await verifyListOnwership({
      ctx,
      userId: loggedInUserId,
      listId,
    })
    if (!isOwnerOflist) {
      throw new Error('You are not the owner of this list')
    }
    await ctx.db.patch('lists', args.listId, {
      title: args.title,
    })
  },
})
