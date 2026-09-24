import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { bumpHead, deletedAncestor } from '../sync/model'
import { isPastDue } from './due'

export const ToggleTodoStatusOverdue = internalMutation({
  args: { todoId: v.id('todos') },
  handler: async (ctx, { todoId }) => {
    const todo = await ctx.db.get(todoId)
    if (
      !todo ||
      todo.status !== 'pending' ||
      (todo.timeZone && !isPastDue(todo)) ||
      (await deletedAncestor(ctx, 'todos', todo))
    )
      return
    await ctx.db.patch(todoId, { status: 'overdue', updatedAt: Date.now() })
    await bumpHead(ctx, todo.createdBy)
  },
})
