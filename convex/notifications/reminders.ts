import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { internal } from '../_generated/api'
import { deletedAncestor } from '../sync/model'
import { habitUnitDates, nextHabitReminder } from './reminderTimes'
import type { MutationCtx } from '../_generated/server'
import type { Doc, Id } from '../_generated/dataModel'

async function cancel(
  ctx: MutationCtx,
  job: Id<'_scheduled_functions'> | undefined,
) {
  if (!job) return
  const state = await ctx.db.system.get(job)
  if (state?.state.kind === 'pending') await ctx.scheduler.cancel(job)
}

/** Replaces a todo's pending reminder with one for its current state. */
export async function scheduleTodoReminder(
  ctx: MutationCtx,
  todo: Doc<'todos'>,
) {
  await cancel(ctx, todo.reminderScheduledFunctionId)
  let job: Id<'_scheduled_functions'> | undefined
  if (
    todo.reminderAt &&
    todo.reminderAt > Date.now() &&
    todo.status !== 'completed' &&
    !(await deletedAncestor(ctx, 'todos', todo))
  )
    job = await ctx.scheduler.runAt(
      todo.reminderAt,
      internal.notifications.reminders.fireTodo,
      { todoId: todo._id, at: todo.reminderAt },
    )
  await ctx.db.patch(todo._id, { reminderScheduledFunctionId: job })
}

/** Replaces a subtask's pending reminder with one for its current state. */
export async function scheduleSubTaskReminder(
  ctx: MutationCtx,
  subTask: Doc<'subTasks'>,
) {
  await cancel(ctx, subTask.reminderScheduledFunctionId)
  let job: Id<'_scheduled_functions'> | undefined
  if (
    subTask.reminderAt &&
    subTask.reminderAt > Date.now() &&
    !subTask.completed &&
    !(await deletedAncestor(ctx, 'subTasks', subTask))
  )
    job = await ctx.scheduler.runAt(
      subTask.reminderAt,
      internal.notifications.reminders.fireSubTask,
      { subTaskId: subTask._id, at: subTask.reminderAt },
    )
  await ctx.db.patch(subTask._id, { reminderScheduledFunctionId: job })
}

/** Replaces a habit's pending reminder with the next one its settings call for. */
export async function scheduleHabitReminder(
  ctx: MutationCtx,
  habit: Doc<'habits'>,
) {
  await cancel(ctx, habit.reminderScheduledFunctionId)
  const at = habit.deleted ? null : nextHabitReminder(habit)
  const job = at
    ? await ctx.scheduler.runAt(
        at,
        internal.notifications.reminders.fireHabit,
        {
          habitId: habit._id,
          at,
        },
      )
    : undefined
  await ctx.db.patch(habit._id, {
    nextReminderAt: at ?? undefined,
    reminderScheduledFunctionId: job,
  })
}

export const fireTodo = internalMutation({
  args: { todoId: v.id('todos'), at: v.number() },
  handler: async (ctx, { todoId, at }) => {
    const todo = await ctx.db.get(todoId)
    // A reminder moved or cleared since this run was scheduled.
    if (!todo || todo.reminderAt !== at) return
    await ctx.db.patch(todoId, { reminderScheduledFunctionId: undefined })
    if (
      todo.status === 'completed' ||
      (await deletedAncestor(ctx, 'todos', todo))
    )
      return
    await ctx.scheduler.runAfter(0, internal.notifications.push.send, {
      owner: todo.createdBy,
      title: todo.status === 'overdue' ? 'Overdue' : 'Reminder',
      body: todo.dueDate
        ? `${todo.title} · due ${todo.dueDate}${todo.dueTime ? ` ${todo.dueTime}` : ''}`
        : todo.title,
      categoryId: 'todo',
      data: { todoId: todo.clientId ?? todoId },
    })
  },
})

export const fireSubTask = internalMutation({
  args: { subTaskId: v.id('subTasks'), at: v.number() },
  handler: async (ctx, { subTaskId, at }) => {
    const subTask = await ctx.db.get(subTaskId)
    if (!subTask || subTask.reminderAt !== at) return
    await ctx.db.patch(subTaskId, { reminderScheduledFunctionId: undefined })
    if (subTask.completed || (await deletedAncestor(ctx, 'subTasks', subTask)))
      return
    const parent = await ctx.db.get(subTask.todoId)
    await ctx.scheduler.runAfter(0, internal.notifications.push.send, {
      owner: subTask.createdBy,
      title: parent ? `Reminder · ${parent.title}` : 'Reminder',
      body: subTask.dueDate
        ? `${subTask.title} · due ${subTask.dueDate}${subTask.dueTime ? ` ${subTask.dueTime}` : ''}`
        : subTask.title,
      categoryId: 'subtask',
      data: {
        subTaskId: subTask.clientId ?? subTaskId,
        todoId: parent?.clientId ?? subTask.todoId,
      },
    })
  },
})

export const fireHabit = internalMutation({
  args: { habitId: v.id('habits'), at: v.number() },
  handler: async (ctx, { habitId, at }) => {
    const habit = await ctx.db.get(habitId)
    if (!habit || habit.deleted || habit.nextReminderAt !== at) return
    const dates = habitUnitDates(habit.frequency, habit.timeZone)
    const marks = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habitId', (q) => q.eq('habitId', habitId))
      .filter((q) => q.neq(q.field('deleted'), true))
      .collect()
    const done = marks.some((mark) => dates.includes(mark.completedDate))
    if (!done)
      await ctx.scheduler.runAfter(0, internal.notifications.push.send, {
        owner: habit.createdBy,
        title: habit.title,
        body:
          habit.frequency === 'weekly'
            ? 'Not marked this week yet.'
            : 'Time to mark it for today.',
        categoryId: 'habit',
        data: { habitId: habit.clientId ?? habitId },
      })
    await scheduleHabitReminder(ctx, habit)
  },
})
