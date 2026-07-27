import { describe, expect, it } from 'vitest'
import { format, subDays, subWeeks } from 'date-fns'
import {
  DECAY_GRACE_UNITS,
  XP_PER_COMPLETION,
  XP_PER_MISSED_UNIT,
  computeHabitXp,
  isAtRisk,
  isDecaying,
} from './xp'

const TODAY = '2026-07-27'
const todayDate = new Date(TODAY + 'T12:00:00')

/** `daysAgo(1)` is yesterday, `daysAgo(0)` is today. */
function daysAgo(n: number): string {
  return format(subDays(todayDate, n), 'yyyy-MM-dd')
}

function weeksAgo(n: number): string {
  return format(subWeeks(todayDate, n), 'yyyy-MM-dd')
}

function msDaysAgo(n: number): number {
  return subDays(todayDate, n).getTime()
}

function daily(completionDates: Array<string>, createdDaysAgo: number) {
  return computeHabitXp({
    frequency: 'daily',
    totalCompletions: completionDates.length,
    createdAt: msDaysAgo(createdDaysAgo),
    completionDates,
    today: TODAY,
  })
}

describe('computeHabitXp — daily', () => {
  it('awards XP per completion with no misses', () => {
    const dates = [daysAgo(3), daysAgo(2), daysAgo(1), daysAgo(0)]
    const result = daily(dates, 3)

    expect(result.earnedXp).toBe(4 * XP_PER_COMPLETION)
    expect(result.decayXp).toBe(0)
    expect(result.xp).toBe(40)
    expect(result.missedStreak).toBe(0)
    expect(result.graceLeft).toBe(DECAY_GRACE_UNITS)
  })

  it('does not count today as missed — the day is still in play', () => {
    // Created 3 days ago, done every day except today.
    const dates = [daysAgo(3), daysAgo(2), daysAgo(1)]
    const result = daily(dates, 3)

    expect(result.missedStreak).toBe(0)
    expect(result.decayXp).toBe(0)
  })

  it('forgives misses inside the grace period', () => {
    // Created 10 days ago, a solid run then the last 2 days missed.
    const dates = [10, 9, 8, 7, 6, 5, 4, 3].map(daysAgo)
    const result = daily(dates, 10)

    expect(result.missedStreak).toBe(DECAY_GRACE_UNITS)
    expect(result.graceLeft).toBe(0)
    expect(result.decayXp).toBe(0)
    expect(isAtRisk(result)).toBe(true)
    expect(isDecaying(result)).toBe(false)
  })

  it('charges every missed day past the grace period', () => {
    // Created 10 days ago, done on days 10..6, then 5 closed days missed (5..1).
    const dates = [10, 9, 8, 7, 6].map(daysAgo)
    const result = daily(dates, 10)

    expect(result.missedStreak).toBe(5)
    // 5 missed, first 2 forgiven => 3 charged.
    expect(result.decayedUnits).toBe(3)
    expect(result.decayXp).toBe(3 * XP_PER_MISSED_UNIT)
    expect(result.xp).toBe(50 - 15)
    expect(isDecaying(result)).toBe(true)
  })

  it('resets the grace period after a completion', () => {
    // Done on days 14, 9 and 4, so three separate lapses: 4 missed, 4 missed,
    // then 3 missed. Each lapse gets its own 2 forgiven => 2 + 2 + 1 charged.
    const dates = [14, 9, 4].map(daysAgo)
    const result = daily(dates, 14)

    expect(result.decayedUnits).toBe(5)
    expect(result.missedStreak).toBe(3)
  })

  it('never lets decay take more than half of earned XP', () => {
    // One completion long ago, then a very long absence.
    const dates = [200].map(daysAgo)
    const result = daily(dates, 200)

    expect(result.earnedXp).toBe(10)
    expect(result.decayXp).toBe(5)
    expect(result.xp).toBe(5)
    expect(result.decayedUnits).toBeGreaterThan(100)
  })

  it('leaves a never-completed habit at zero rather than negative', () => {
    const result = daily([], 60)

    expect(result.earnedXp).toBe(0)
    expect(result.decayXp).toBe(0)
    expect(result.xp).toBe(0)
  })

  it('does not penalise days before the habit existed', () => {
    // Created today, nothing done yet.
    const result = daily([], 0)

    expect(result.missedStreak).toBe(0)
    expect(result.decayXp).toBe(0)
  })

  it('counts all-time completions but only charges decay inside the window', () => {
    const result = computeHabitXp({
      frequency: 'daily',
      // Stored counter reflects two years of history.
      totalCompletions: 500,
      createdAt: msDaysAgo(730),
      // Nothing at all in the last year.
      completionDates: [],
      today: TODAY,
    })

    expect(result.earnedXp).toBe(5000)
    // Only the 364 closed days inside the window are walked, not all 730 —
    // 2 of them are forgiven.
    expect(result.decayedUnits).toBe(362)
    expect(result.decayXp).toBe(362 * XP_PER_MISSED_UNIT)
    expect(result.xp).toBe(5000 - 1810)
  })
})

describe('computeHabitXp — weekly', () => {
  function weekly(completionDates: Array<string>, createdDaysAgo: number) {
    return computeHabitXp({
      frequency: 'weekly',
      totalCompletions: completionDates.length,
      createdAt: msDaysAgo(createdDaysAgo),
      completionDates,
      today: TODAY,
    })
  }

  it('treats a week with any completion as done', () => {
    const dates = [1, 2, 3].map(weeksAgo)
    const result = weekly(dates, 21)

    expect(result.missedStreak).toBe(0)
    expect(result.decayXp).toBe(0)
  })

  it('measures misses in weeks, not days', () => {
    // Done 8 weeks ago, nothing since: 7 closed weeks missed, 2 forgiven.
    const dates = [weeksAgo(8)]
    const result = weekly(dates, 8 * 7)

    expect(result.missedStreak).toBe(7)
    expect(result.decayedUnits).toBe(5)
    // Capped at half of the single completion's 10 XP.
    expect(result.decayXp).toBe(5)
  })

  it('does not penalise the current week', () => {
    // Done last week and the week before; this week is still open.
    const dates = [weeksAgo(1), weeksAgo(2)]
    const result = weekly(dates, 21)

    expect(result.missedStreak).toBe(0)
  })
})
