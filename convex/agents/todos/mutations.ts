import { v } from "convex/values";
import { format } from "date-fns";
import { mutation } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { verifyListOnwership, verifyTodoOnwership } from "../../globals/helpers";

export const createTodo = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
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
    scheduledFuntionRunTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const isOwnerOfList = await verifyListOnwership({
      ctx,
      userId: args.userId,
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
      createdBy: args.userId,
    })

    if (args.dueDate && args.scheduledFuntionRunTime) {
      const scheduledFunctionId = await ctx.scheduler.runAt(
        args.scheduledFuntionRunTime,
        internal.todos.mutations.ToggleTodoStatusOverdue,
        { todoId },
      )
      await ctx.db.patch('todos', todoId, {
        markAsOverdueScheudledFunctionId: scheduledFunctionId,
      })
    }

    return todoId
  },
})

export const updateTodo = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
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
    if (args.accessToken !== process.env.ACCESS_TOKEN) {
      throw new Error('Invalid access token')
    }
    const isOwnerOfTodo = await verifyTodoOnwership({
      ctx,
      userId: args.userId,
      todoId: args.todoId,
    })
    if (!isOwnerOfTodo) {
      throw new Error('You are not the owner of the todo')
    }

    const currentTodo = await ctx.db.get('todos', args.todoId)

    const dueDate = args.dueDate
      ? format(args.dueDate, 'yyyy-LL-dd')
      : undefined
    const dueTime = args.dueDate ? format(args.dueDate, 'HH:mm') : undefined

    const updateData: Record<string, unknown> = {
      title: args.title,
      description: args.description,
      dueDate: dueDate,
      dueTime: dueTime,
      status: 'pending',
      priority: args.priority,
    }

    await ctx.db.patch('todos', args.todoId, updateData)

    if (args.dueDate) {
      if (currentTodo?.markAsOverdueScheudledFunctionId) {
        await ctx.scheduler.cancel(currentTodo.markAsOverdueScheudledFunctionId)
      }
      if (args.scheduledFunctionRunTime) {
        const scheduledFunctionId = await ctx.scheduler.runAt(
          args.scheduledFunctionRunTime,
          internal.todos.mutations.ToggleTodoStatusOverdue,
          { todoId: args.todoId },
        )
        await ctx.db.patch('todos', args.todoId, {
          markAsOverdueScheudledFunctionId: scheduledFunctionId,
        })
      }
    } else {
      await ctx.db.patch('todos', args.todoId, {
        markAsOverdueScheudledFunctionId: undefined,
      })
    }
  },
})