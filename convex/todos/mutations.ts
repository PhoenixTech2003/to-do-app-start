import { format } from 'date-fns'
import { v } from 'convex/values'
import { authComponent } from '../auth'
import { internal } from '../_generated/api'
import { internalMutation, mutation } from '../_generated/server'
import { verifyListOnwership, verifyTodoOnwership } from '../globals/helpers'
import type { MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

async function ensureTodoOwnership({
  ctx,
  userId,
  todoId,
}: {
  ctx: MutationCtx
  userId: string
  todoId: Id<'todos'>
}) {
  const isOwnerOfTodo = await verifyTodoOnwership({
    ctx,
    userId,
    todoId,
  })

  if (!isOwnerOfTodo) {
    throw new Error('You are not the owner of this todo')
  }
}

async function ensureListOwnership({
  ctx,
  userId,
  listId,
}: {
  ctx: MutationCtx
  userId: string
  listId: Id<'lists'>
}) {
  const isOwnerOfList = await verifyListOnwership({
    ctx,
    userId,
    listId,
  })

  if (!isOwnerOfList) {
    throw new Error('You are not the owner of the list')
  }
}

function getDueDateFields(dueDate?: string) {
  return {
    dueDate: dueDate ? format(dueDate, 'yyyy-LL-dd') : undefined,
    dueTime: dueDate ? format(dueDate, 'HH:mm') : undefined,
  }
}

export const createTodo = mutation({
  args: {
    listId: v.optional(v.id('lists')),
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

    if (args.listId) {
      await ensureListOwnership({
        ctx,
        userId: loggedInUserId,
        listId: args.listId,
      })
    }

    const { dueDate, dueTime } = getDueDateFields(args.dueDate)
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
    const loggedInUser = await authComponent.getAuthUser(ctx)
    await ensureTodoOwnership({
      ctx,
      userId: loggedInUser._id,
      todoId: args.todoId,
    })

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
    await ensureTodoOwnership({
      ctx,
      userId: loggedInUserId,
      todoId: args.todoId,
    })

    await ctx.db.insert('subTasks', {
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
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const subTask = await ctx.db.get('subTasks', args.subTaskId)
    if (!subTask) {
      throw new Error('Subtask does not exist')
    }

    await ensureTodoOwnership({
      ctx,
      userId: loggedInUserId,
      todoId: subTask.todoId,
    })

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
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id
    const subTask = await ctx.db.get('subTasks', args.subTaskId)
    if (!subTask) {
      throw new Error('Subtask does not exist')
    }

    await ensureTodoOwnership({
      ctx,
      userId: loggedInUserId,
      todoId: subTask.todoId,
    })

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
    await ensureTodoOwnership({
      ctx,
      userId: loggedInUserId,
      todoId: args.todoId,
    })

    // Get the current todo to check if we need to cancel existing scheduled function
    const currentTodo = await ctx.db.get('todos', args.todoId)

    const { dueDate, dueTime } = getDueDateFields(args.dueDate)

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

export const moveTodoToList = mutation({
  args: {
    todoId: v.id('todos'),
    listId: v.optional(v.id('lists')),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    const loggedInUserId = loggedInUser._id

    await ensureTodoOwnership({
      ctx,
      userId: loggedInUserId,
      todoId: args.todoId,
    })

    if (args.listId) {
      await ensureListOwnership({
        ctx,
        userId: loggedInUserId,
        listId: args.listId,
      })
    }

    await ctx.db.patch('todos', args.todoId, {
      listId: args.listId,
    })
  },
})

export const deleteTodo = mutation({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    await ensureTodoOwnership({
      ctx,
      userId: loggedInUser._id,
      todoId: args.todoId,
    })

    const todo = await ctx.db.get('todos', args.todoId)
    if (!todo) {
      throw new Error('Todod does not exist')
    }

    const subTasks = await ctx.db
      .query('subTasks')
      .withIndex('by_todo_id', (q) => q.eq('todoId', args.todoId))
      .collect()

    for (const subTask of subTasks) {
      await ctx.db.delete(subTask._id)
    }

    if (todo.markAsOverdueScheudledFunctionId) {
      await ctx.scheduler.cancel(todo.markAsOverdueScheudledFunctionId)
      await ctx.db.delete('todos', args.todoId)
      return
    }
    await ctx.db.delete('todos', args.todoId)
  },
})
