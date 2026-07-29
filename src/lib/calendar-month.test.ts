import { describe, expect, it } from 'vitest'
import {
  dateKey,
  getMonthGrid,
  parseCalendarDate,
  parseCalendarMonth,
} from './calendar-month'

describe('calendar month helpers', () => {
  it('builds complete Monday-to-Sunday calendar weeks', () => {
    const { days } = getMonthGrid(new Date(2026, 6, 1))

    expect(days).toHaveLength(35)
    expect(dateKey(days[0])).toBe('2026-06-29')
    expect(dateKey(days.at(-1)!)).toBe('2026-08-02')
  })

  it('rejects impossible URL dates and months', () => {
    const fallback = new Date(2026, 6, 15)

    expect(dateKey(parseCalendarMonth('2026-13', fallback))).toBe('2026-07-01')
    expect(parseCalendarDate('2026-02-31')).toBeUndefined()
  })
})
