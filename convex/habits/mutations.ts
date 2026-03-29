import { v } from 'convex/values'
import { format, subDays } from 'date-fns'
import { authComponent } from '../auth'
import { mutation } from '../_generated/server'
import type { MutationCtx } from '../_generated/server'
import type { Id } from '../_generated/dataModel'

async function countConsecutiveDays(
  ctx: MutationCtx,
  habitId: Id<'habits'>,
  startDate: Date,
): Promise<number> {
  let count = 0
  let date = startDate

  for (let i = 0; i < 365; i++) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const completion = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habitId_date', (q) =>
        q.eq('habitId', habitId).eq('completedDate', dateStr),
      )
      .first()

    if (!completion) break
    count++
    date = subDays(date, 1)
  }

  return count
}

export const createHabit = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    frequency: v.union(v.literal('daily'), v.literal('weekly')),
    category: v.union(
      v.literal('health'),
      v.literal('fitness'),
      v.literal('learning'),
      v.literal('mindfulness'),
      v.literal('productivity'),
      v.literal('social'),
      v.literal('creative'),
      v.literal('other'),
    ),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)

    return await ctx.db.insert('habits', {
      title: args.title,
      description: args.description,
      frequency: args.frequency,
      category: args.category,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      createdBy: user._id,
    })
  },
})

export const toggleHabitCompletion = mutation({
  args: {
    habitId: v.id('habits'),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.createdBy !== user._id) {
      throw new Error('Habit not found or access denied')
    }

    const existing = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habitId_date', (q) =>
        q.eq('habitId', args.habitId).eq('completedDate', args.date),
      )
      .first()

    const today = new Date(args.date + 'T12:00:00')

    if (existing) {
      await ctx.db.delete(existing._id)
      const newStreak = await countConsecutiveDays(
        ctx,
        args.habitId,
        subDays(today, 1),
      )
      await ctx.db.patch(args.habitId, {
        currentStreak: newStreak,
        totalCompletions: Math.max(0, habit.totalCompletions - 1),
      })
      return { completed: false }
    }

    await ctx.db.insert('habitCompletions', {
      habitId: args.habitId,
      completedDate: args.date,
      createdBy: user._id,
    })

    const newStreak = await countConsecutiveDays(ctx, args.habitId, today)
    await ctx.db.patch(args.habitId, {
      currentStreak: newStreak,
      longestStreak: Math.max(habit.longestStreak, newStreak),
      totalCompletions: habit.totalCompletions + 1,
    })
    return { completed: true }
  },
})

export const deleteHabit = mutation({
  args: {
    habitId: v.id('habits'),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.createdBy !== user._id) {
      throw new Error('Habit not found or access denied')
    }

    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habitId', (q) => q.eq('habitId', args.habitId))
      .collect()

    for (const completion of completions) {
      await ctx.db.delete(completion._id)
    }

    await ctx.db.delete(args.habitId)
  },
})
