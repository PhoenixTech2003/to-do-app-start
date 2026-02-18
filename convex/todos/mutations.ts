import { v } from 'convex/values'
import { format, isAfter, parse } from 'date-fns'
import { internalMutation, mutation } from '../_generated/server'
import { authComponent } from '../auth'
import { verifyListOnwership, verifyTodoOnwership } from '../globals/helpers'
import { internal } from '../_generated/api'

export const createTodo = mutation({
  args: {
    listId: v.id('lists'),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    scheduledFuntionRunTime: v.optional(v.number()),
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

    const dueDate = args.dueDate
      ? format(args.dueDate, 'yyyy-LL-dd')
      : undefined
    const dueTime = args.dueDate ? format(args.dueDate, 'HH:mm') : undefined
    const todoId = await ctx.db.insert('todos', {
      title: args.title,
      listId: args.listId,
      description: args.description,
      status: 'pending',
      dueDate: dueDate,
      dueTime: dueTime,
      priority: args.priority,
      createdBy: loggedInUserId,
    })

    // Schedule function to mark as overdue 1 minute after due date/time

    if (args.dueDate) {
      if (args.scheduledFuntionRunTime) {
        const scheduledFunctionId = await ctx.scheduler.runAt(
          args.scheduledFuntionRunTime,
          internal.todos.mutations.ToggleTodoStatusOverdue,
          {
            todoId: todoId,
          },
        )
        // Store the scheduled function ID in the todo
        await ctx.db.patch('todos', todoId, {
          markAsOverdueScheudledFunctionId: scheduledFunctionId,
        })
      }
    }
  },
})

export const ToggleTodoStatusOverdue = internalMutation({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get('todos', args.todoId)
    if (!todo) {
      console.log('Todo might have been deleted or does not exist')
      return
    }
    if (todo.status === 'completed') {
      console.log('Terminating todo was completed before the due date and time')
      return
    }

    await ctx.db.patch('todos', args.todoId, {
      status: 'overdue',
    })
  },
})

export const toggleTodoStatus = mutation({
  args: {
    todoId: v.id('todos'),
    status: v.union(
      v.literal('pending'),
      v.literal('completed'),
      v.literal('overdue'),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch('todos', args.todoId, {
      status: args.status,
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
    scheduledFunctionRunTime: v.optional(v.number()),
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

    // Get the current todo to check if we need to cancel existing scheduled function
    const currentTodo = await ctx.db.get('todos', args.todoId)

    const dueDate = args.dueDate
      ? format(args.dueDate, 'yyyy-LL-dd')
      : undefined
    const dueTime = args.dueDate ? format(args.dueDate, 'HH:mm') : undefined
    let status

    const updateData: Record<string, unknown> = {
      title: args.title,
      description: args.description,
      dueDate: dueDate,
      dueTime: dueTime,
      status: 'pending',
      priority: args.priority,
    }

    await ctx.db.patch('todos', args.todoId, updateData)

    // Handle scheduled function updates
    if (args.dueDate) {
      if (currentTodo?.markAsOverdueScheudledFunctionId) {
        await ctx.scheduler.cancel(currentTodo.markAsOverdueScheudledFunctionId)
      }
      if (args.scheduledFunctionRunTime) {
        const scheduledFunctionId = await ctx.scheduler.runAt(
          args.scheduledFunctionRunTime,
          internal.todos.mutations.ToggleTodoStatusOverdue,
          {
            todoId: args.todoId,
          },
        )
        const markAsOverdueScheudledFunctionId = scheduledFunctionId
        await ctx.db.patch('todos', args.todoId, {
          markAsOverdueScheudledFunctionId,
        })
      }
    } else {
      // If no due date, remove the scheduled function reference
      const markAsOverdueScheudledFunctionId = undefined
      await ctx.db.patch('todos', args.todoId, {
        markAsOverdueScheudledFunctionId,
      })
    }
  },
})

export const deleteTodo = mutation({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const todo = await ctx.db.get('todos', args.todoId)
    if (!todo) {
      throw new Error('Todod does not exist')
    }
    if (todo.markAsOverdueScheudledFunctionId) {
      await ctx.scheduler.cancel(todo.markAsOverdueScheudledFunctionId)
      await ctx.db.delete('todos', args.todoId)
      return
    }
    await ctx.db.delete('todos', args.todoId)
  },
})
