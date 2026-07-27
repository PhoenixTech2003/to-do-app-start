import { cn } from '@/lib/utils'

type SectionTone = 'pending' | 'completed' | 'overdue'

// The dot colour is the section's status, matching the priority/status hues
// used on the cards themselves.
const toneDot: Record<SectionTone, string> = {
  pending: 'bg-chart-4',
  completed: 'bg-chart-3',
  overdue: 'bg-destructive',
}

interface TodoSectionHeadingProps {
  tone: SectionTone
  title: string
  /** Omitted on empty states, where a zero adds nothing. */
  count?: number
  className?: string
}

export function TodoSectionHeading({
  tone,
  title,
  count,
  className,
}: TodoSectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-b border-hairline pb-2',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('size-1.5 rounded-full', toneDot[tone])} />
        <h2 className="label-meta text-muted-foreground">{title}</h2>
      </div>
      {count !== undefined && (
        <span
          data-numeric
          className="rounded-full border border-hairline bg-surface-sunken px-1.5 py-px font-mono text-[10px] font-semibold text-muted-foreground"
        >
          {count}
        </span>
      )}
    </div>
  )
}
