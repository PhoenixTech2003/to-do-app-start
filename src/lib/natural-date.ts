import { en } from 'chrono-node'

const DEFAULT_DUE_HOUR = 17

export interface NaturalDateMatch {
  date: Date
  index: number
  text: string
}

/**
 * Finds the last date expression in a title and resolves it in local time.
 * The last expression wins because due dates are most often written as a
 * suffix ("Send the report tomorrow at 9"). For ranges, the end is the due
 * moment.
 */
export function parseNaturalDate(
  title: string,
  referenceDate = new Date(),
): NaturalDateMatch | undefined {
  const result = en.casual
    .parse(title, referenceDate, { forwardDate: true })
    .at(-1)

  if (!result) return undefined

  const components = result.end ?? result.start
  const date = components.date()
  const tags = result.tags()
  const hasMeaningfulTime =
    components.isCertain('hour') ||
    tags.has('parser/ENCasualTimeParser') ||
    tags.has('casualReference/tonight')

  // Chrono carries the reference time into date-only relative expressions.
  // The rest of the app deliberately treats a picked day as due at 17:00.
  if (!hasMeaningfulTime) {
    date.setHours(DEFAULT_DUE_HOUR, 0, 0, 0)
  } else {
    date.setSeconds(0, 0)
  }

  return {
    date,
    index: result.index,
    text: result.text,
  }
}

export function naturalDateExpressionKey(match?: NaturalDateMatch) {
  return match?.text.trim().toLocaleLowerCase()
}

export function splitTitleAtNaturalDate(
  title: string,
  match?: NaturalDateMatch,
) {
  if (!match) {
    return { before: title, highlighted: '', after: '' }
  }

  const end = match.index + match.text.length
  return {
    before: title.slice(0, match.index),
    highlighted: title.slice(match.index, end),
    after: title.slice(end),
  }
}

/** Removes a detected expression while keeping the remaining title tidy. */
export function titleWithoutNaturalDate(
  title: string,
  match: NaturalDateMatch | undefined = parseNaturalDate(title),
) {
  if (!match) return title.trim()

  const parts = splitTitleAtNaturalDate(title, match)
  const before = parts.before.replace(/[\s,;:–—-]+$/u, '')
  const after = parts.after.replace(/^[\s,;:–—-]+/u, '')
  const separator = before && after && !/^[.!?]/u.test(after) ? ' ' : ''
  const cleaned = `${before}${separator}${after}`
    .replace(/\s+([,.!?])/gu, '$1')
    .trim()

  // A date expression by itself is still a valid task title. Never save an
  // empty or punctuation-only title after removing it.
  return /[\p{L}\p{N}]/u.test(cleaned) ? cleaned : title.trim()
}
