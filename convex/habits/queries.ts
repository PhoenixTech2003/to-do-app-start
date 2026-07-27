import { v } from 'convex/values'
import { format, subDays } from 'date-fns'
import { authComponent } from '../auth'
import { query } from '../_generated/server'
import { DECAY_LOOKBACK_DAYS, computeHabitXp } from './xp'

export const getHabitsWithStatus = query({
  args: {
    today: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)

    const habits = await ctx.db
      .query('habits')
      .withIndex('by_createdBy', (q) => q.eq('createdBy', user._id))
      .collect()

    const decayWindowStart = format(
      subDays(new Date(args.today + 'T12:00:00'), DECAY_LOOKBACK_DAYS - 1),
      'yyyy-MM-dd',
    )

    const habitsWithStatus = await Promise.all(
      habits.map(async (habit) => {
        const completions = await ctx.db
          .query('habitCompletions')
          .withIndex('by_habitId_date', (q) =>
            q
              .eq('habitId', habit._id)
              .gte('completedDate', decayWindowStart)
              .lte('completedDate', args.today),
          )
          .collect()

        const completionDates = completions.map((c) => c.completedDate)

        return {
          ...habit,
          completedToday: completionDates.includes(args.today),
          ...computeHabitXp({
            frequency: habit.frequency,
            totalCompletions: habit.totalCompletions,
            createdAt: habit._creationTime,
            completionDates,
            today: args.today,
          }),
        }
      }),
    )

    return habitsWithStatus
  },
})

export const getActivityData = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)

    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_createdBy_date', (q) =>
        q
          .eq('createdBy', user._id)
          .gte('completedDate', args.startDate)
          .lte('completedDate', args.endDate),
      )
      .collect()

    const byDate: Record<string, number> = {}
    for (const c of completions) {
      byDate[c.completedDate] = (byDate[c.completedDate] ?? 0) + 1
    }

    return byDate
  },
})

export const getHabitCompletions = query({
  args: {
    habitId: v.id('habits'),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const habit = await ctx.db.get(args.habitId)
    if (!habit || habit.createdBy !== user._id) {
      throw new Error('Habit not found')
    }

    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_habitId_date', (q) =>
        q
          .eq('habitId', args.habitId)
          .gte('completedDate', args.startDate)
          .lte('completedDate', args.endDate),
      )
      .collect()

    return completions.map((c) => c.completedDate)
  },
})

export const getWeekCompletions = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)

    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_createdBy_date', (q) =>
        q
          .eq('createdBy', user._id)
          .gte('completedDate', args.startDate)
          .lte('completedDate', args.endDate),
      )
      .collect()

    return completions.length
  },
})
