import { describe, expect, it } from 'vitest'
import {
  describeHabitReminder,
  reminderChoice,
  resolveReminder,
  habitUnitDates,
  nextHabitReminder,
  shiftReminder,
} from './reminderTimes'

// Thursday 2 October 2026, 10:00 in Blantyre (UTC+2).
const now = Date.UTC(2026, 9, 2, 8, 0)
const zone = 'Africa/Blantyre'

describe('habit reminders', () => {
  it('fires later today, or tomorrow once today has passed', () => {
    expect(
      nextHabitReminder({ reminderTime: '18:30', timeZone: zone }, now),
    ).toBe(Date.UTC(2026, 9, 2, 16, 30))
    expect(
      nextHabitReminder({ reminderTime: '07:00', timeZone: zone }, now),
    ).toBe(Date.UTC(2026, 9, 3, 5, 0))
  })

  it('skips to the next chosen weekday', () => {
    // Mondays only: the next one is 5 October.
    expect(
      nextHabitReminder(
        { reminderTime: '07:00', reminderDays: [1], timeZone: zone },
        now,
      ),
    ).toBe(Date.UTC(2026, 9, 5, 5, 0))
  })

  it('stays off without a valid time', () => {
    expect(nextHabitReminder({ reminderTime: null }, now)).toBeNull()
    expect(nextHabitReminder({ reminderTime: '25:00' }, now)).toBeNull()
  })

  it('counts a weekly habit as settled by any mark this week', () => {
    expect(habitUnitDates('daily', zone, now)).toEqual(['2026-10-02'])
    const week = habitUnitDates('weekly', zone, now)
    expect(week[0]).toBe('2026-09-28')
    expect(week[6]).toBe('2026-10-04')
  })

  it('describes the schedule', () => {
    expect(describeHabitReminder('07:00', [])).toBe('Every day at 07:00')
    expect(describeHabitReminder('07:00', [5, 1, 2, 3, 4])).toBe(
      'Weekdays at 07:00',
    )
    expect(describeHabitReminder(null, null)).toBe('Off')
  })
})

describe('todo reminders', () => {
  it('keeps the same distance from the due date on the next occurrence', () => {
    const at = new Date('2026-10-02T08:50:00').getTime()
    expect(shiftReminder(at, '2026-10-02', '2026-10-09')).toBe(
      new Date('2026-10-09T08:50:00').getTime(),
    )
  })
})

describe('reminder choices', () => {
  it('follows the due date and round-trips through a saved reminder', () => {
    const at = resolveReminder({ offset: 60 }, '2026-10-05', '14:00')
    expect(at).toBe(new Date('2026-10-05T13:00:00').getTime())
    expect(resolveReminder({ offset: 60 }, '2026-10-06', '14:00')).toBe(
      new Date('2026-10-06T13:00:00').getTime(),
    )
    expect(reminderChoice(at, '2026-10-05', '14:00')).toEqual({ offset: 60 })
  })

  it('keeps a fixed moment, and needs a due date for relative ones', () => {
    const fixed = new Date('2026-10-05T07:30:00').getTime()
    expect(reminderChoice(fixed, '2026-10-05', '14:00')).toEqual({ at: fixed })
    expect(resolveReminder({ at: fixed }, null, null)).toBe(fixed)
    expect(resolveReminder({ offset: 0 }, null, null)).toBeNull()
    // Without a time, a day is due at 09:00.
    expect(resolveReminder({ offset: 1440 }, '2026-10-05', null)).toBe(
      new Date('2026-10-04T09:00:00').getTime(),
    )
  })
})
