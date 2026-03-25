import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { authComponent } from '../auth'
import {
  verifyListOnwership,
  verifyWorkspaceOnwership,
} from '../globals/helpers'

export const createList = mutation({
  args: {
    title: v.string(),
    workspaceId: v.id('workspace'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const isOwnerOfWorkspace = await verifyWorkspaceOnwership({
      ctx,
      userId: user._id,
      workspaceId: args.workspaceId,
    })
    if (!isOwnerOfWorkspace) {
      throw new Error('You are not the owner of the workspace')
    }
    await ctx.db.insert('lists', {
      title: args.title,
      createdBy: user._id,
      workspaceId: args.workspaceId,
    })
  },
})

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
export const deleteList = mutation({
  args: {
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const list = await ctx.db.get('lists', args.listId)
    const listId = list?._id
    if (!listId) {
      throw new Error('list does not exist')
    }
    const isOwnerOfWorkspace = await verifyListOnwership({
      ctx,
      userId: loggedInUserId,
      listId,
    })
    if (!isOwnerOfWorkspace) {
      throw new Error('You are not the owner of this workspace')
    }

    const todos = await ctx.db
      .query('todos')
      .withIndex('by_listId', (q) => q.eq('listId', args.listId))
      .collect()

    for (const todo of todos) {
      const subtasks = await ctx.db
        .query('subTasks')
        .withIndex('by_todo_id', (q) => q.eq('todoId', todo._id))
        .collect()

      for (const subtask of subtasks) {
        await ctx.db.delete(subtask._id)
      }

      if (todo.markAsOverdueScheudledFunctionId) {
        await ctx.scheduler.cancel(todo.markAsOverdueScheudledFunctionId)
      }

      await ctx.db.delete(todo._id)
    }

    await ctx.db.delete('lists', args.listId)
  },
})
