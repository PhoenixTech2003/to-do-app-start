import { addDays, format, startOfWeek } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'

/**
 * ── Reminders ──
 *
 * A todo reminds once, at an absolute moment. A habit reminds at a time of
 * day, on chosen weekdays (none chosen = every day), until it is marked for
 * its day or week.
 *
 * Pure on purpose — no Convex context, no browser APIs — so the server that
 * schedules the push and the forms that describe it agree exactly.
 */

const WEEKDAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function isReminderTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function isReminderDays(value: unknown): value is Array<number> {
  return (
    Array.isArray(value) &&
    value.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)
  )
}

/** The next moment after `now` a habit reminder should fire, or null. */
export function nextHabitReminder(
  habit: {
    reminderTime?: string | null
    reminderDays?: Array<number> | null
    timeZone?: string | null
  },
  now = Date.now(),
): number | null {
  if (!isReminderTime(habit.reminderTime)) return null
  const zone = habit.timeZone ?? 'UTC'
  const days = habit.reminderDays?.length ? new Set(habit.reminderDays) : null
  // Noon keeps the day arithmetic clear of DST transitions.
  const today = new Date(
    `${formatInTimeZone(now, zone, 'yyyy-MM-dd')}T12:00:00`,
  )
  for (let offset = 0; offset <= 7; offset++) {
    const day = addDays(today, offset)
    if (days && !days.has(day.getDay())) continue
    const at = fromZonedTime(
      `${format(day, 'yyyy-MM-dd')}T${habit.reminderTime}`,
      zone,
    ).getTime()
    if (at > now) return at
  }
  return null
}

/**
 * The dates a habit's current unit covers in its own zone: today for a daily
 * habit, Monday–Sunday for a weekly one. A mark on any of them settles it.
 */
export function habitUnitDates(
  frequency: 'daily' | 'weekly',
  timeZone: string | null | undefined,
  now = Date.now(),
): Array<string> {
  const today = formatInTimeZone(now, timeZone ?? 'UTC', 'yyyy-MM-dd')
  if (frequency === 'daily') return [today]
  const monday = startOfWeek(new Date(`${today}T12:00:00`), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), 'yyyy-MM-dd'),
  )
}

export function describeHabitReminder(
  time: string | null | undefined,
  days: Array<number> | null | undefined,
) {
  if (!isReminderTime(time)) return 'Off'
  if (!days?.length || days.length === 7) return `Every day at ${time}`
  const sorted = [...days].sort((a, b) => a - b)
  if (sorted.join() === '1,2,3,4,5') return `Weekdays at ${time}`
  if (sorted.join() === '0,6') return `Weekends at ${time}`
  return `${sorted.map((d) => WEEKDAY_LABEL[d]).join(', ')} at ${time}`
}

/** One-tap todo reminders, relative to the due moment when there is one. */
export function todoReminderPresets(
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
  now = Date.now(),
): Array<{ label: string; at: number }> {
  if (!dueDate) return []
  // A date without a time is due at the end of the day; remind that morning.
  const due = new Date(`${dueDate}T${dueTime ?? '09:00'}:00`).getTime()
  const presets = dueTime
    ? [
        { label: 'At due time', at: due },
        { label: '10 minutes before', at: due - 10 * 60_000 },
        { label: '1 hour before', at: due - 60 * 60_000 },
        { label: '1 day before', at: addDays(due, -1).getTime() },
      ]
    : [
        { label: 'That morning (09:00)', at: due },
        { label: 'The day before (09:00)', at: addDays(due, -1).getTime() },
      ]
  return presets.filter((preset) => preset.at > now)
}

export function describeTodoReminder(at: number | null | undefined) {
  if (!at) return 'Off'
  return format(at, "EEE d MMM 'at' HH:mm")
}

/**
 * A recurring todo's next occurrence keeps its reminder the same distance
 * from its due date.
 */
export function shiftReminder(
  reminderAt: number,
  fromDate: string,
  toDate: string,
) {
  const days = Math.round(
    (new Date(`${toDate}T12:00:00`).getTime() -
      new Date(`${fromDate}T12:00:00`).getTime()) /
      86_400_000,
  )
  return addDays(reminderAt, days).getTime()
}
