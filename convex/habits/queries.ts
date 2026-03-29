import { v } from 'convex/values'
import { format, subDays } from 'date-fns'
import { authComponent } from '../auth'
import { query } from '../_generated/server'

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

    const habitsWithStatus = await Promise.all(
      habits.map(async (habit) => {
        const todayCompletion = await ctx.db
          .query('habitCompletions')
          .withIndex('by_habitId_date', (q) =>
            q.eq('habitId', habit._id).eq('completedDate', args.today),
          )
          .first()

        return {
          ...habit,
          completedToday: !!todayCompletion,
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
