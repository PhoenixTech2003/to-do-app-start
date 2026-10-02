import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { internal } from '../_generated/api'
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
    // A todo with its own reminder already said what it needed to.
    if (!todo.reminderAt)
      await ctx.scheduler.runAfter(0, internal.notifications.push.send, {
        owner: todo.createdBy,
        title: 'Overdue',
        body: todo.dueTime
          ? `“${todo.title}” was due at ${todo.dueTime}.`
          : `“${todo.title}” is past its due date.`,
        categoryId: 'todo',
        data: { todoId: todo.clientId ?? todoId },
      })
  },
})
