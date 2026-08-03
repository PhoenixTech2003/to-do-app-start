import { format } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { v } from 'convex/values'
import { authComponent } from '../auth'
import { internal } from '../_generated/api'
import { internalMutation, mutation } from '../_generated/server'
import { verifyListOnwership, verifyTodoOnwership } from '../globals/helpers'
import { nextOccurrenceDate, recurrenceValidator } from './recurrence'
import type { MutationCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'

const LIST_TODO_DELETE_BATCH_SIZE = 25

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

/**
 * The moment the overdue job should fire: one minute past the due time, read in
 * the user's own zone. Dates are stored as wall-clock strings, so without the
 * zone the same string means different instants for different people.
 */
function overdueRunTime(dueDate: string, dueTime: string, timeZone: string) {
  return fromZonedTime(`${dueDate}T${dueTime}`, timeZone).getTime() + 60000
}

/**
 * Completing a recurring entry prints the next one. The finished row stays put
 * as the record that it was done; the successor carries the same rule forward.
 * Subtasks are not copied — a fresh occurrence starts with a clean list.
 */
async function printNextOccurrence(
  ctx: MutationCtx,
  todo: Doc<'todos'>,
  timeZone?: string,
) {
  if (!todo.recurrence || !todo.dueDate) return

  const index = todo.recurrenceIndex ?? 0
  const nextDate = nextOccurrenceDate(todo.recurrence, todo.dueDate, index)
  if (!nextDate) return

  const nextTodoId = await ctx.db.insert('todos', {
    title: todo.title,
    listId: todo.listId,
    description: todo.description,
    status: 'pending',
    dueDate: nextDate,
    dueTime: todo.dueTime,
    recurrence: todo.recurrence,
    recurrenceIndex: index + 1,
    priority: todo.priority,
    createdBy: todo.createdBy,
  })

  if (todo.dueTime && timeZone) {
    const scheduledFunctionId = await ctx.scheduler.runAt(
      overdueRunTime(nextDate, todo.dueTime, timeZone),
      internal.todos.mutations.ToggleTodoStatusOverdue,
      { todoId: nextTodoId },
    )
    await ctx.db.patch('todos', nextTodoId, {
      markAsOverdueScheudledFunctionId: scheduledFunctionId,
    })
  }
}

async function deleteTodoCascade(ctx: MutationCtx, todoId: Id<'todos'>) {
  const todo = await ctx.db.get('todos', todoId)
  if (!todo) {
    return
  }

  const subTasks = await ctx.db
    .query('subTasks')
    .withIndex('by_todo_id', (q) => q.eq('todoId', todoId))
    .collect()

  for (const subTask of subTasks) {
    await ctx.db.delete(subTask._id)
  }

  if (todo.markAsOverdueScheudledFunctionId) {
    await ctx.scheduler.cancel(todo.markAsOverdueScheudledFunctionId)
  }

  await ctx.db.delete(todoId)
}

export const createTodo = mutation({
  args: {
    listId: v.optional(v.id('lists')),
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    scheduledFuntionRunTime: v.optional(v.number()),
    recurrence: v.optional(recurrenceValidator),
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
    // A rule needs a date to repeat from, so recurrence rides with the due date.
    const recurrence = dueDate ? args.recurrence : undefined
    const todoId = await ctx.db.insert('todos', {
      title: args.title,
      listId: args.listId,
      description: args.description,
      status: 'pending',
      dueDate: dueDate,
      dueTime: dueTime,
      recurrence: recurrence,
      recurrenceIndex: recurrence ? 0 : undefined,
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

export const deleteTodosForList = internalMutation({
  args: {
    listId: v.id('lists'),
  },
  handler: async (ctx, args) => {
    const todos = await ctx.db
      .query('todos')
      .withIndex('by_listId', (q) => q.eq('listId', args.listId))
      .take(LIST_TODO_DELETE_BATCH_SIZE)

    for (const todo of todos) {
      await deleteTodoCascade(ctx, todo._id)
    }

    if (todos.length === LIST_TODO_DELETE_BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.todos.mutations.deleteTodosForList, {
        listId: args.listId,
      })
    }
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
    /** The caller's zone, so a printed successor is due at their local time. */
    timeZone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const loggedInUser = await authComponent.getAuthUser(ctx)
    await ensureTodoOwnership({
      ctx,
      userId: loggedInUser._id,
      todoId: args.todoId,
    })

    const todo = await ctx.db.get('todos', args.todoId)

    await ctx.db.patch('todos', args.todoId, {
      status: args.status,
    })

    // Only the crossing into completed prints the next entry, so ticking a row
    // off and on again does not fill the list with duplicates.
    if (todo && args.status === 'completed' && todo.status !== 'completed') {
      await printNextOccurrence(ctx, todo, args.timeZone)
    }
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
    recurrence: v.optional(recurrenceValidator),
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

    const recurrence = dueDate ? args.recurrence : undefined

    const updateData: Record<string, unknown> = {
      title: args.title,
      description: args.description,
      dueDate: dueDate,
      dueTime: dueTime,
      recurrence: recurrence,
      // An entry edited mid-series keeps its place in the count.
      recurrenceIndex: recurrence ? (currentTodo?.recurrenceIndex ?? 0) : undefined,
      status: 'pending',
      priority: args.priority,
    }

    await ctx.db.patch('todos', args.todoId, updateData)

    // Always cancel the existing overdue job before rescheduling or clearing it.
    if (currentTodo?.markAsOverdueScheudledFunctionId) {
      await ctx.scheduler.cancel(currentTodo.markAsOverdueScheudledFunctionId)
    }

    if (args.dueDate && args.scheduledFunctionRunTime) {
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
    } else {
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

export const removeTodoFromDate = mutation({
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
      throw new Error('Todo does not exist')
    }

    if (todo.markAsOverdueScheudledFunctionId) {
      await ctx.scheduler.cancel(todo.markAsOverdueScheudledFunctionId)
    }

    await ctx.db.patch('todos', args.todoId, {
      dueDate: undefined,
      dueTime: undefined,
      // Nothing left to repeat from.
      recurrence: undefined,
      recurrenceIndex: undefined,
      markAsOverdueScheudledFunctionId: undefined,
      status: todo.status === 'overdue' ? 'pending' : todo.status,
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

    await deleteTodoCascade(ctx, todo._id)
  },
})
