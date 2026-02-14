import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { authComponent } from '../auth'
import { verifyListOnwership } from '../globals/helpers'

export const createTodo = mutation({
  args: {
    listId: v.id('lists'),
    title: v.string(),
    description: v.string(),
    dueDate: v.optional(v.string()),
    priority: v.union(
      v.literal('high'),
      v.literal('medium'),
      v.literal('low'),
      v.literal('none'),
    ),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const isOwnerOfList = await verifyListOnwership({
      ctx,
      userId: loggedInUserId,
      listId: args.listId,
    })
    if (!isOwnerOfList) {
      throw new Error('You are not the owner of the list')
    }
    await ctx.db.insert('todos', {
      title: args.title,
      listId: args.listId,
      description: args.description,
      completed: false,
      dueDate: args.dueDate,
      priority: args.priority,
      createdBy: loggedInUserId,
    })
  },
})

export const ToggleTodoCompletetion = mutation({
  args: {
    todoId: v.id('todos'),
    isCompleted: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('todos', args.todoId, {
      completed: args.isCompleted,
    })
  },
})
