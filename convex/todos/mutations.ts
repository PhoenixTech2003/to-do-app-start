import { v } from 'convex/values'
import { format } from 'date-fns'
import { mutation } from '../_generated/server'
import { authComponent } from '../auth'
import { verifyListOnwership, verifyTodoOnwership } from '../globals/helpers'

export const createTodo = mutation({
  args: {
    listId: v.id('lists'),
    title: v.string(),
    description: v.optional(v.string()),
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
    console.log(args.dueDate)
    const dueDate = args.dueDate
      ? format(args.dueDate, 'yyyy-LL-dd')
      : undefined
    const dueTime = args.dueDate ? format(args.dueDate, 'HH:mm') : undefined
    await ctx.db.insert('todos', {
      title: args.title,
      listId: args.listId,
      description: args.description,
      completed: false,
      dueDate: dueDate,
      dueTime: dueTime,
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

export const addSubTask = mutation({
  args: {
    todoId: v.id('todos'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    ctx.db.insert('subTasks', {
      title: args.title,
      todoId: args.todoId,
      completed: false,
      createdBy: loggedInUserId,
    })
  },
})

export const updateSubTask = mutation({
  args: {
    subTaskId: v.id('subTasks'),
    title: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {}
    if (typeof args.title === 'string') patch.title = args.title
    if (typeof args.completed === 'boolean') patch.completed = args.completed
    await ctx.db.patch('subTasks', args.subTaskId, patch)
  },
})

export const deleteSubTask = mutation({
  args: {
    subTaskId: v.id('subTasks'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete('subTasks', args.subTaskId)
  },
})

export const updateTodo = mutation({
  args: {
    todoId: v.id('todos'),
    title: v.string(),
    description: v.optional(v.string()),
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
    const isOwnerOfTodo = await verifyTodoOnwership({
      ctx,
      userId: loggedInUserId,
      todoId: args.todoId,
    })
    if (!isOwnerOfTodo) {
      throw new Error('You are not the owner of the list')
    }
    const dueDate = args.dueDate
      ? format(args.dueDate, 'yyyy-LL-dd')
      : undefined
    const dueTime = args.dueDate ? format(args.dueDate, 'HH:mm') : undefined
    await ctx.db.patch('todos', args.todoId, {
      title: args.title,
      description: args.description,
      dueDate: dueDate,
      dueTime: dueTime,
      priority: args.priority,
    })
  },
})

export const deleteTodo = mutation({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete('todos', args.todoId)
  },
})
