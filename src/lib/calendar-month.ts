import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

const MONTH_FORMAT = 'yyyy-MM'
const DATE_FORMAT = 'yyyy-MM-dd'

export function parseCalendarMonth(value: string | undefined, fallback: Date) {
  if (!value) return startOfMonth(fallback)

  const parsed = parse(value, MONTH_FORMAT, fallback)
  return isValid(parsed) && format(parsed, MONTH_FORMAT) === value
    ? startOfMonth(parsed)
    : startOfMonth(fallback)
}

export function parseCalendarDate(value: string | undefined) {
  if (!value) return undefined

  const parsed = parse(value, DATE_FORMAT, new Date())
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value
    ? parsed
    : undefined
}

export function getMonthGrid(month: Date) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  // The sheet is ruled by week, not by day: the month view draws one band per
  // week so the left margin can carry the week number.
  const weeks: Array<Array<Date>> = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return { monthStart, monthEnd, days, weeks }
}

export function dateKey(date: Date) {
  return format(date, DATE_FORMAT)
}

export function monthKey(date: Date) {
  return format(date, MONTH_FORMAT)
}
