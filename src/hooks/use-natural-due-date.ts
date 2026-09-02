import { useRef, useState } from 'react'
import type { NaturalDateMatch } from '@/lib/natural-date'
import { naturalDateExpressionKey, parseNaturalDate } from '@/lib/natural-date'

interface NaturalDueDateInitialValues {
  /** The title the form opened with, so its date phrase is not re-read as new. */
  title: string
  /** Whether that entry already carries a due date. */
  dueDate?: Date
}

/**
 * Reading the date out of the title as it is typed.
 *
 * The due date has one owner at a time: the phrase in the title, or the hand
 * that touched the date bands. Once a date is set by hand — or was already on
 * the entry when the slip opened — the title stops moving it, until the phrase
 * itself changes. A changed phrase is a new intent, and takes the field back.
 */
export function useNaturalDueDate(
  setDueDate: (date?: Date) => void,
  initial?: NaturalDueDateInitialValues,
) {
  const [match, setMatch] = useState<NaturalDateMatch | undefined>(() =>
    initial?.title ? parseNaturalDate(initial.title) : undefined,
  )
  const source = useRef<'none' | 'natural' | 'manual'>(
    initial?.dueDate ? 'manual' : 'none',
  )
  const previousExpressionKey = useRef<string | undefined>(
    naturalDateExpressionKey(match),
  )

  /** Call with every keystroke on the title. */
  function readTitle(title: string) {
    const nextMatch = parseNaturalDate(title)
    const nextExpressionKey = naturalDateExpressionKey(nextMatch)
    const expressionChanged =
      nextExpressionKey !== previousExpressionKey.current

    previousExpressionKey.current = nextExpressionKey
    setMatch(nextMatch)

    if (nextMatch && (source.current === 'none' || expressionChanged)) {
      setDueDate(nextMatch.date)
      source.current = 'natural'
      return
    }

    if (!nextMatch && source.current === 'natural') {
      setDueDate(undefined)
      source.current = 'none'
    }
  }

  /** Call when the date is set from the bands rather than the title. */
  function markManual() {
    source.current = 'manual'
  }

  return { match, readTitle, markManual }
}
