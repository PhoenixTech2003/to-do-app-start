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

/**
 * A reminder as a form holds it: relative to the due moment ("1 hour
 * before"), so it follows the due date while the form is being edited, or a
 * fixed moment. It becomes a timestamp only when the entry is saved.
 */
export type ReminderChoice = { offset: number } | { at: number }

/** Minutes before the due moment. A day without a time is due at 09:00. */
export function reminderOffsets(
  dueTime: string | null | undefined,
): Array<{ label: string; offset: number }> {
  return dueTime
    ? [
        { label: 'At due time', offset: 0 },
        { label: '10 minutes before', offset: 10 },
        { label: '1 hour before', offset: 60 },
        { label: '1 day before', offset: 1440 },
      ]
    : [
        { label: 'That morning (09:00)', offset: 0 },
        { label: 'The day before (09:00)', offset: 1440 },
      ]
}

export function resolveReminder(
  choice: ReminderChoice | null | undefined,
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
): number | null {
  if (!choice) return null
  if ('at' in choice) return choice.at
  if (!dueDate) return null
  const due = new Date(`${dueDate}T${dueTime ?? '09:00'}:00`)
  // Whole days step by calendar day so the time survives DST changes.
  return choice.offset % 1440 === 0
    ? addDays(due, -choice.offset / 1440).getTime()
    : due.getTime() - choice.offset * 60_000
}

/** The form choice for a saved reminder: a preset if it matches one. */
export function reminderChoice(
  at: number | null | undefined,
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
): ReminderChoice | null {
  if (!at) return null
  const preset = dueDate
    ? reminderOffsets(dueTime).find(
        ({ offset }) => resolveReminder({ offset }, dueDate, dueTime) === at,
      )
    : undefined
  return preset ? { offset: preset.offset } : { at }
}

/** One-tap reminders relative to the due moment, still in the future. */
export function todoReminderPresets(
  dueDate: string | null | undefined,
  dueTime: string | null | undefined,
  now = Date.now(),
): Array<{ label: string; at: number }> {
  if (!dueDate) return []
  return reminderOffsets(dueTime)
    .map(({ label, offset }) => ({
      label,
      at: resolveReminder({ offset }, dueDate, dueTime)!,
    }))
    .filter((preset) => preset.at > now)
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
