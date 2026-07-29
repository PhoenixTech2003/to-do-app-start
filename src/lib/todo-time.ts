import { differenceInCalendarDays, format, isValid, parse } from 'date-fns'

/**
 * The gutter's brain.
 *
 * Every listed thing in TwoDo carries a right-hand column of time. It is set
 * in tabular mono at a fixed width, so a stack of entries turns urgency into a
 * vertical stripe you can read without reading a single title.
 *
 * The column holds distance, not a date: `−3d` is something you act on,
 * `12 Aug 2026` is something you have to do arithmetic on. The absolute date
 * stays available as the entry's title attribute and in the detail sheet.
 */

export type GutterTone = 'late' | 'now' | 'soon' | 'later' | 'none'

export interface GutterTime {
  /** Fixed-width mark for the gutter column. */
  short: string
  /** Full date, for tooltips and screen readers. */
  long: string
  tone: GutterTone
}

const EMPTY: GutterTime = { short: '—', long: 'No due date', tone: 'none' }

function parseDue(dueDate?: string, dueTime?: string): Date | undefined {
  if (!dueDate) return undefined
  const parsed = dueTime
    ? parse(`${dueDate} ${dueTime}`, 'yyyy-MM-dd HH:mm', new Date())
    : parse(dueDate, 'yyyy-MM-dd', new Date())
  return isValid(parsed) ? parsed : undefined
}

/** Days → the shortest honest unit. 6d, 3w, 4mo. */
function magnitude(days: number): string {
  const n = Math.abs(days)
  if (n < 7) return `${n}d`
  if (n < 60) return `${Math.round(n / 7)}w`
  return `${Math.round(n / 30)}mo`
}

export function gutterTime(
  dueDate?: string,
  dueTime?: string,
  status?: string,
): GutterTime {
  const due = parseDue(dueDate, dueTime)

  if (!due) {
    // A todo can be marked overdue by the server without carrying a date.
    return status === 'overdue'
      ? { short: 'LATE', long: 'Overdue', tone: 'late' }
      : EMPTY
  }

  const days = differenceInCalendarDays(due, new Date())
  const long = dueTime
    ? `${format(due, 'EEEE d MMMM yyyy')} at ${dueTime}`
    : format(due, 'EEEE d MMMM yyyy')

  if (days < 0) return { short: `−${magnitude(days)}`, long, tone: 'late' }
  if (days === 0) return { short: dueTime ?? 'TODAY', long, tone: 'now' }
  return {
    short: `+${magnitude(days)}`,
    long,
    tone: days <= 3 ? 'soon' : 'later',
  }
}

/**
 * Ink weight for the gutter. Only the two states that need you today carry
 * colour; everything else is the page's own ink, stepped down by distance.
 */
export const gutterInk: Record<GutterTone, string> = {
  late: 'text-destructive',
  now: 'text-primary',
  soon: 'text-foreground/70',
  later: 'text-muted-foreground',
  none: 'text-muted-foreground/40',
}

/** How long ago a thing was made, for index rows that have no due date. */
export function openedAgo(creationTime: number): GutterTime {
  const days = Math.abs(differenceInCalendarDays(creationTime, new Date()))
  return {
    short: days === 0 ? 'TODAY' : `${magnitude(days)} ago`,
    long: `Opened ${format(creationTime, 'd MMMM yyyy')}`,
    tone: days === 0 ? 'now' : 'later',
  }
}
