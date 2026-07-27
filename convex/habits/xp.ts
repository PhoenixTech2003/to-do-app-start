import { addDays, format, startOfWeek, subDays } from 'date-fns'

/** XP granted for every completion. */
export const XP_PER_COMPLETION = 10
/** XP drained for every missed unit once the grace period is spent. */
export const XP_PER_MISSED_UNIT = 5
/** Missed units forgiven before XP starts draining (days for daily, weeks for weekly). */
export const DECAY_GRACE_UNITS = 2
/** Decay can never eat more than this share of the XP a habit has earned. */
export const MAX_DECAY_RATIO = 0.5
/** How far back a habit's history is walked when charging decay. */
export const DECAY_LOOKBACK_DAYS = 365

const DATE_FORMAT = 'yyyy-MM-dd'
const WEEK_OPTIONS = { weekStartsOn: 1 } as const

export type HabitXp = {
  /** XP from completions alone, before any decay. */
  earnedXp: number
  /** XP lost to missed units, after the recovery cap. */
  decayXp: number
  /** Missed units that were charged, before the recovery cap. */
  decayedUnits: number
  /** Net XP — never negative. */
  xp: number
  /** Consecutive missed units ending at the last closed unit; today/this week is excluded. */
  missedStreak: number
  /** Missed units still forgiven. 0 means the next miss costs XP. */
  graceLeft: number
}

/** Habit completion dates are stored as plain `yyyy-MM-dd`; noon keeps DST out of the way. */
function toDate(date: string): Date {
  return new Date(date + 'T12:00:00')
}

function weekStart(date: Date): Date {
  return startOfWeek(date, WEEK_OPTIONS)
}

/**
 * One entry per closed unit, oldest first: `true` when the habit was done in
 * that unit. The current day/week is left out — it is still in play.
 */
function dailyUnits(
  done: Set<string>,
  start: Date,
  today: Date,
): Array<boolean> {
  const units: Array<boolean> = []
  for (let day = start; day < today; day = addDays(day, 1)) {
    units.push(done.has(format(day, DATE_FORMAT)))
  }
  return units
}

function weeklyUnits(
  done: Set<string>,
  start: Date,
  today: Date,
): Array<boolean> {
  const doneWeeks = new Set<string>()
  for (const date of done) {
    doneWeeks.add(format(weekStart(toDate(date)), DATE_FORMAT))
  }

  const units: Array<boolean> = []
  const currentWeek = weekStart(today)
  for (
    let week = weekStart(start);
    week < currentWeek;
    week = addDays(week, 7)
  ) {
    units.push(doneWeeks.has(format(week, DATE_FORMAT)))
  }
  return units
}

/**
 * Walks the units oldest-first, forgiving the first `DECAY_GRACE_UNITS` of every
 * run of misses and charging each miss after that. The run is reset by any
 * completion, so a comeback wipes the slate clean.
 */
function chargeMisses(units: Array<boolean>): {
  decayedUnits: number
  missedStreak: number
} {
  let decayedUnits = 0
  let missedStreak = 0

  for (const done of units) {
    if (done) {
      missedStreak = 0
      continue
    }
    missedStreak++
    if (missedStreak > DECAY_GRACE_UNITS) decayedUnits++
  }

  return { decayedUnits, missedStreak }
}

export function computeHabitXp({
  frequency,
  totalCompletions,
  createdAt,
  completionDates,
  today,
}: {
  frequency: string
  totalCompletions: number
  /** `_creationTime` of the habit, in ms. */
  createdAt: number
  /** Completion dates inside the lookback window, as `yyyy-MM-dd`. */
  completionDates: Array<string>
  today: string
}): HabitXp {
  const earnedXp = totalCompletions * XP_PER_COMPLETION
  const todayDate = toDate(today)

  // Decay is only charged from whichever is later: the habit's birthday, or the
  // start of the lookback window. Earned XP still counts all-time.
  const windowStart = subDays(todayDate, DECAY_LOOKBACK_DAYS - 1)
  const createdDate = toDate(format(new Date(createdAt), DATE_FORMAT))
  const start = createdDate > windowStart ? createdDate : windowStart

  const done = new Set(completionDates)
  const units =
    frequency === 'weekly'
      ? weeklyUnits(done, start, todayDate)
      : dailyUnits(done, start, todayDate)

  const { decayedUnits, missedStreak } = chargeMisses(units)

  // However long you disappear for, you keep half of what you earned.
  const decayXp = Math.min(
    decayedUnits * XP_PER_MISSED_UNIT,
    Math.floor(earnedXp * MAX_DECAY_RATIO),
  )

  return {
    earnedXp,
    decayXp,
    decayedUnits,
    xp: earnedXp - decayXp,
    missedStreak,
    graceLeft: Math.max(0, DECAY_GRACE_UNITS - missedStreak),
  }
}

/** True once a habit has burned through its grace and is actively losing XP. */
export function isDecaying(habit: { missedStreak: number }): boolean {
  return habit.missedStreak > DECAY_GRACE_UNITS
}

/** True while a habit is missing units but has not started losing XP yet. */
export function isAtRisk(habit: { missedStreak: number }): boolean {
  return habit.missedStreak > 0 && !isDecaying(habit)
}
