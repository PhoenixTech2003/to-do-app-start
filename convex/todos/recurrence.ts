import { v } from 'convex/values'
import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarWeeks,
  format,
  getDay,
  isValid,
  parse,
  startOfWeek,
} from 'date-fns'

/**
 * ── Repetition ──
 *
 * A recurring twodo is a series of ordinary entries: completing one prints the
 * next. The rule travels with each occurrence, so the row you are looking at
 * always knows how to produce its successor and nothing depends on a template
 * living somewhere else.
 *
 * Pure on purpose — no Convex context, no browser APIs — so the server that
 * prints the next entry and the form that describes the rule agree exactly.
 */

export const recurrenceValidator = v.object({
  freq: v.union(
    v.literal('daily'),
    v.literal('weekly'),
    v.literal('monthly'),
    v.literal('yearly'),
  ),
  /** Every N days/weeks/months/years. */
  interval: v.number(),
  /** Weekly only: which days, 0 = Sunday. Empty means "same day as the due date". */
  weekdays: v.optional(v.array(v.number())),
  /** Last date the series may land on, inclusive. `yyyy-MM-dd`. */
  until: v.optional(v.string()),
  /** Total number of occurrences in the series. */
  count: v.optional(v.number()),
})

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceRule {
  freq: RecurrenceFreq
  interval: number
  weekdays?: Array<number>
  until?: string
  count?: number
}

const WEEKDAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WORKING_WEEK = [1, 2, 3, 4, 5]

/** The four rules worth a single tap. Everything else is Custom. */
export const RECURRENCE_PRESETS: Array<{
  label: string
  rule: RecurrenceRule
}> = [
  { label: 'Daily', rule: { freq: 'daily', interval: 1 } },
  {
    label: 'Weekdays',
    rule: { freq: 'weekly', interval: 1, weekdays: WORKING_WEEK },
  },
  { label: 'Weekly', rule: { freq: 'weekly', interval: 1 } },
  { label: 'Monthly', rule: { freq: 'monthly', interval: 1 } },
]

function normalizeInterval(interval: number) {
  return Math.max(1, Math.round(interval))
}

function sortedDays(weekdays: Array<number>) {
  return Array.from(new Set(weekdays)).sort((a, b) => a - b)
}

function sameDays(a: Array<number>, b: Array<number>) {
  const left = sortedDays(a)
  const right = sortedDays(b)
  return (
    left.length === right.length && left.every((day, i) => day === right[i])
  )
}

export function sameRecurrence(a?: RecurrenceRule, b?: RecurrenceRule) {
  if (!a || !b) return a === b
  return (
    a.freq === b.freq &&
    normalizeInterval(a.interval) === normalizeInterval(b.interval) &&
    sameDays(a.weekdays ?? [], b.weekdays ?? []) &&
    a.until === b.until &&
    a.count === b.count
  )
}

/**
 * The next day this rule lands on after `from`, honouring the chosen weekdays
 * and skipping whole weeks when the interval is more than one.
 */
function nextWeeklyDay(from: Date, weekdays: Array<number>, interval: number) {
  const anchorWeek = startOfWeek(from, { weekStartsOn: 1 })
  const days = sortedDays(weekdays)

  for (let step = 1; step <= 7 * interval + 7; step++) {
    const candidate = addDays(from, step)
    if (!days.includes(getDay(candidate))) continue
    const weeksOut = differenceInCalendarWeeks(candidate, anchorWeek, {
      weekStartsOn: 1,
    })
    if (weeksOut % interval === 0) return candidate
  }

  return addDays(from, 7 * interval)
}

/**
 * The date the next occurrence is due, or `null` when the series has run out.
 *
 * @param dueDate `yyyy-MM-dd` of the occurrence being completed.
 * @param index   0-based position of that occurrence in the series.
 */
export function nextOccurrenceDate(
  rule: RecurrenceRule,
  dueDate: string,
  index = 0,
): string | null {
  if (rule.count !== undefined && index + 1 >= rule.count) return null

  const from = parse(dueDate, 'yyyy-MM-dd', new Date())
  if (!isValid(from)) return null

  const interval = normalizeInterval(rule.interval)
  let next: Date

  if (rule.freq === 'weekly' && rule.weekdays && rule.weekdays.length > 0) {
    next = nextWeeklyDay(from, rule.weekdays, interval)
  } else if (rule.freq === 'daily') {
    next = addDays(from, interval)
  } else if (rule.freq === 'weekly') {
    next = addDays(from, 7 * interval)
  } else if (rule.freq === 'monthly') {
    next = addMonths(from, interval)
  } else {
    next = addYears(from, interval)
  }

  const nextDate = format(next, 'yyyy-MM-dd')
  // Both are `yyyy-MM-dd`, so string order is date order.
  if (rule.until && nextDate > rule.until) return null

  return nextDate
}

function everyLabel(interval: number, unit: string) {
  return interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}s`
}

/** The rule in plain words: "Every 2 weeks on Mon, Thu, 10 times". */
export function describeRecurrence(rule: RecurrenceRule): string {
  const interval = normalizeInterval(rule.interval)
  const weekdays = rule.weekdays ?? []
  let base: string

  if (rule.freq === 'weekly' && weekdays.length > 0) {
    base =
      interval === 1 && sameDays(weekdays, WORKING_WEEK)
        ? 'Every weekday'
        : `${everyLabel(interval, 'week')} on ${sortedDays(weekdays)
            .map((day) => WEEKDAY_LABEL[day])
            .join(', ')}`
  } else {
    const unit =
      rule.freq === 'daily'
        ? 'day'
        : rule.freq === 'weekly'
          ? 'week'
          : rule.freq === 'monthly'
            ? 'month'
            : 'year'
    base = everyLabel(interval, unit)
  }

  if (rule.count !== undefined) {
    return `${base}, ${rule.count} times`
  }
  if (rule.until) {
    const until = parse(rule.until, 'yyyy-MM-dd', new Date())
    if (isValid(until)) return `${base}, until ${format(until, 'd MMM yyyy')}`
  }
  return base
}

export { WEEKDAY_LABEL, WORKING_WEEK }
