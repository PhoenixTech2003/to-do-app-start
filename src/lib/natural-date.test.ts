import { describe, expect, it } from 'vitest'
import {
  naturalDateExpressionKey,
  parseNaturalDate,
  splitTitleAtNaturalDate,
  titleWithoutNaturalDate,
} from './natural-date'

const REFERENCE_DATE = new Date(2026, 8, 2, 10, 30)

function expectLocalDate(
  actual: Date,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  expect([
    actual.getFullYear(),
    actual.getMonth(),
    actual.getDate(),
    actual.getHours(),
    actual.getMinutes(),
  ]).toEqual([year, month, day, hour, minute])
}

describe('parseNaturalDate', () => {
  it('extracts an explicit date and time with its title range', () => {
    const match = parseNaturalDate('Pay rent tomorrow at 9am', REFERENCE_DATE)

    expect(match?.index).toBe(9)
    expect(match?.text).toBe('tomorrow at 9am')
    expectLocalDate(match!.date, 2026, 8, 3, 9, 0)
  })

  it('uses 17:00 for an expression without a time', () => {
    const match = parseNaturalDate('Call mum tomorrow', REFERENCE_DATE)

    expect(match?.text).toBe('tomorrow')
    expectLocalDate(match!.date, 2026, 8, 3, 17, 0)
  })

  it('keeps the implied time for a part of the day', () => {
    const match = parseNaturalDate(
      'Write the outline this evening',
      REFERENCE_DATE,
    )

    expect(match?.text).toBe('this evening')
    expectLocalDate(match!.date, 2026, 8, 2, 20, 0)
  })

  it('uses the end of a parsed range as the due moment', () => {
    const match = parseNaturalDate(
      'Workshop tomorrow from 10 to 11',
      REFERENCE_DATE,
    )

    expect(match?.text).toBe('tomorrow from 10 to 11')
    expectLocalDate(match!.date, 2026, 8, 3, 11, 0)
  })

  it('returns no match for an ordinary title', () => {
    expect(parseNaturalDate('Buy two apples', REFERENCE_DATE)).toBeUndefined()
  })

  it('normalizes expression identity without depending on its title position', () => {
    const first = parseNaturalDate('Tomorrow call Sam', REFERENCE_DATE)
    const second = parseNaturalDate('Please call Sam TOMORROW', REFERENCE_DATE)

    expect(naturalDateExpressionKey(first)).toBe(
      naturalDateExpressionKey(second),
    )
  })

  it('splits the title around the exact expression for highlighting', () => {
    const title = 'Pay rent tomorrow at 9am please'
    const match = parseNaturalDate(title, REFERENCE_DATE)

    expect(splitTitleAtNaturalDate(title, match)).toEqual({
      before: 'Pay rent ',
      highlighted: 'tomorrow at 9am',
      after: ' please',
    })
  })

  it.each([
    ['Pay rent tomorrow at 9am', 'Pay rent'],
    ['Tomorrow at 9am, pay rent', 'pay rent'],
    ['Pay rent, tomorrow at 9am.', 'Pay rent.'],
    ['Pay rent tomorrow at 9am please', 'Pay rent please'],
  ])('removes the parsed expression from "%s"', (title, expected) => {
    const match = parseNaturalDate(title, REFERENCE_DATE)

    expect(titleWithoutNaturalDate(title, match)).toBe(expected)
  })

  it('keeps a date-only title rather than saving an empty task', () => {
    const title = 'Tomorrow at 9am'
    const match = parseNaturalDate(title, REFERENCE_DATE)

    expect(titleWithoutNaturalDate(title, match)).toBe(title)
  })
})
