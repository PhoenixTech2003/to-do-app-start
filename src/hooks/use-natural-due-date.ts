import { useState } from 'react'
import type { NaturalDateMatch } from '@/lib/natural-date'
import {
  naturalDateExpressionKey,
  parseNaturalDate,
  titleWithoutNaturalDate,
} from '@/lib/natural-date'

interface NaturalDueDateInitialValues {
  /** The title the form opened with, so its date phrase is not re-read as new. */
  title: string
  /** Whether that entry already carries a due date. */
  dueDate?: Date
}

type Source = 'none' | 'natural' | 'manual'

/**
 * Reading the date out of the title as it is typed.
 *
 * The due date has one owner at a time: the phrase in the title, or the hand
 * that touched the date bands. Once a date is set by hand — or was already on
 * the entry when the slip opened — the title stops moving it, until the phrase
 * itself changes. A changed phrase is a new intent, and takes the field back.
 *
 * A phrase that fills the date is only a suggestion: it can be accepted, or
 * kept as plain text — then it neither sets the date nor is stripped from the
 * title, until a different phrase is written.
 */
export function useNaturalDueDate(
  setDueDate: (date?: Date, match?: NaturalDateMatch) => void,
  initial?: NaturalDueDateInitialValues,
) {
  const [rawMatch, setRawMatch] = useState<NaturalDateMatch | undefined>(() =>
    initial?.title ? parseNaturalDate(initial.title) : undefined,
  )
  const [source, setSource] = useState<Source>(
    initial?.dueDate ? 'manual' : 'none',
  )
  const [previousKey, setPreviousKey] = useState(() =>
    naturalDateExpressionKey(rawMatch),
  )
  const [dismissedKey, setDismissedKey] = useState<string>()
  const [accepted, setAccepted] = useState(false)

  /** Call with every keystroke on the title. */
  function readTitle(title: string) {
    const parsed = parseNaturalDate(title)
    const key = naturalDateExpressionKey(parsed)
    const nextMatch =
      key !== undefined && key === dismissedKey ? undefined : parsed
    const expressionChanged = key !== previousKey

    setPreviousKey(key)
    setRawMatch(nextMatch)
    if (expressionChanged) {
      setAccepted(false)
      if (key !== dismissedKey) setDismissedKey(undefined)
    }

    if (nextMatch && (source === 'none' || expressionChanged)) {
      setDueDate(nextMatch.date, nextMatch)
      setSource('natural')
      return
    }

    if (!nextMatch && source === 'natural') {
      setDueDate(undefined)
      setSource('none')
    }
  }

  /** Call when the date is set from the bands rather than the title. */
  function markManual() {
    setSource('manual')
  }

  /** Keep the phrase as the date. */
  function accept() {
    setAccepted(true)
  }

  /** Keep the phrase as plain text: undo the date it set, never strip it. */
  function dismiss() {
    setDismissedKey(naturalDateExpressionKey(rawMatch))
    setRawMatch(undefined)
    if (source === 'natural') {
      setDueDate(undefined)
      setSource('none')
    }
  }

  // Only a phrase that is actually setting the date is marked and stripped.
  const match = source === 'natural' ? rawMatch : undefined

  /** The title to save: without the phrase only if the phrase set the date. */
  function cleanTitle(title: string) {
    return match ? titleWithoutNaturalDate(title, match) : title.trim()
  }

  return {
    match,
    /** True while the filled date is waiting to be accepted or dismissed. */
    suggesting: Boolean(match) && !accepted,
    readTitle,
    markManual,
    accept,
    dismiss,
    cleanTitle,
  }
}
