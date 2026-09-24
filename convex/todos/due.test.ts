import { expect, it } from 'vitest'
import { isPastDue } from './due'

it('uses the saved time zone and waits until the due minute has ended', () => {
  const todo = {
    dueDate: '2026-09-24',
    dueTime: '10:00',
    timeZone: 'Africa/Blantyre',
  }
  expect(isPastDue(todo, Date.parse('2026-09-24T08:00:30Z'))).toBe(false)
  expect(isPastDue(todo, Date.parse('2026-09-24T08:01:00Z'))).toBe(true)
  expect(isPastDue({}, Date.now())).toBe(false)
})
