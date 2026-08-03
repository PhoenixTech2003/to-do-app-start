import { describe, expect, it } from 'vitest'
import { describeRecurrence, nextOccurrenceDate } from './recurrence'

// 2026-08-03 is a Monday, which every case below leans on.
const MONDAY = '2026-08-03'

describe('nextOccurrenceDate', () => {
  it('steps daily rules by their interval', () => {
    expect(nextOccurrenceDate({ freq: 'daily', interval: 1 }, MONDAY)).toBe(
      '2026-08-04',
    )
    expect(nextOccurrenceDate({ freq: 'daily', interval: 3 }, MONDAY)).toBe(
      '2026-08-06',
    )
  })

  it('keeps the same weekday when no days are chosen', () => {
    expect(nextOccurrenceDate({ freq: 'weekly', interval: 1 }, MONDAY)).toBe(
      '2026-08-10',
    )
    expect(nextOccurrenceDate({ freq: 'weekly', interval: 2 }, MONDAY)).toBe(
      '2026-08-17',
    )
  })

  it('walks the chosen weekdays, then skips whole weeks', () => {
    const weekdays = { freq: 'weekly' as const, interval: 1, weekdays: [1, 4] }
    // Monday → Thursday of the same week…
    expect(nextOccurrenceDate(weekdays, MONDAY)).toBe('2026-08-06')
    // …Thursday → the following Monday.
    expect(nextOccurrenceDate(weekdays, '2026-08-06')).toBe('2026-08-10')
  })

  it('honours the interval across weekday runs', () => {
    const fortnightly = {
      freq: 'weekly' as const,
      interval: 2,
      weekdays: [1, 4],
    }
    expect(nextOccurrenceDate(fortnightly, MONDAY)).toBe('2026-08-06')
    // The intervening week is skipped, so Thursday jumps a fortnight on.
    expect(nextOccurrenceDate(fortnightly, '2026-08-06')).toBe('2026-08-17')
  })

  it('clamps months that are too short', () => {
    expect(
      nextOccurrenceDate({ freq: 'monthly', interval: 1 }, '2026-01-31'),
    ).toBe('2026-02-28')
  })

  it('steps yearly rules', () => {
    expect(nextOccurrenceDate({ freq: 'yearly', interval: 1 }, MONDAY)).toBe(
      '2027-08-03',
    )
  })

  it('stops on the end date', () => {
    const rule = { freq: 'daily' as const, interval: 1, until: '2026-08-04' }
    expect(nextOccurrenceDate(rule, MONDAY)).toBe('2026-08-04')
    expect(nextOccurrenceDate(rule, '2026-08-04')).toBeNull()
  })

  it('stops after the requested number of occurrences', () => {
    const rule = { freq: 'daily' as const, interval: 1, count: 3 }
    expect(nextOccurrenceDate(rule, MONDAY, 0)).toBe('2026-08-04')
    expect(nextOccurrenceDate(rule, MONDAY, 1)).toBe('2026-08-04')
    expect(nextOccurrenceDate(rule, MONDAY, 2)).toBeNull()
  })

  it('returns null for an unparseable date', () => {
    expect(
      nextOccurrenceDate({ freq: 'daily', interval: 1 }, 'nonsense'),
    ).toBeNull()
  })
})

describe('describeRecurrence', () => {
  it('names the presets the way the chips do', () => {
    expect(describeRecurrence({ freq: 'daily', interval: 1 })).toBe('Every day')
    expect(
      describeRecurrence({
        freq: 'weekly',
        interval: 1,
        weekdays: [1, 2, 3, 4, 5],
      }),
    ).toBe('Every weekday')
    expect(describeRecurrence({ freq: 'weekly', interval: 1 })).toBe(
      'Every week',
    )
    expect(describeRecurrence({ freq: 'monthly', interval: 1 })).toBe(
      'Every month',
    )
  })

  it('spells out intervals, days and endings', () => {
    expect(
      describeRecurrence({ freq: 'weekly', interval: 2, weekdays: [4, 1] }),
    ).toBe('Every 2 weeks on Mon, Thu')
    expect(describeRecurrence({ freq: 'daily', interval: 1, count: 10 })).toBe(
      'Every day, 10 times',
    )
    expect(
      describeRecurrence({ freq: 'monthly', interval: 3, until: '2027-01-15' }),
    ).toBe('Every 3 months, until 15 Jan 2027')
  })
})
