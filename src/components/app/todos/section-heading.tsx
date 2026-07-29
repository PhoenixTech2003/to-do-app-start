import { DocketHeader } from '../docket'

type SectionTone = 'pending' | 'completed' | 'overdue'

interface TodoSectionHeadingProps {
  tone: SectionTone
  title: string
  /** Omitted on empty states, where a zero adds nothing. */
  count?: number
}

/**
 * A section's header band. The status dot is gone: the label already says
 * which section this is, and colour in TwoDo is reserved for what needs you
 * now — which is why only an overdue count is allowed to go terracotta.
 */
export function TodoSectionHeading({
  tone,
  title,
  count,
}: TodoSectionHeadingProps) {
  return (
    <DocketHeader label={title} count={count} urgent={tone === 'overdue'} />
  )
}
