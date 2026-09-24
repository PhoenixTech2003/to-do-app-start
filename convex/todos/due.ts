import { fromZonedTime } from 'date-fns-tz'

export function isPastDue(
  todo: { dueDate?: string | null; dueTime?: string | null; timeZone?: string },
  now = Date.now(),
) {
  if (!todo.dueDate) return false
  const zone = todo.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const deadline =
    fromZonedTime(
      `${todo.dueDate}T${todo.dueTime ?? '23:59'}`,
      zone,
    ).getTime() + 60_000
  return Number.isFinite(deadline) && now >= deadline
}
