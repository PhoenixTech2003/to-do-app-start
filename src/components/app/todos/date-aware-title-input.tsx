import { useRef } from 'react'
import { CalendarClock } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { NaturalDateMatch } from '@/lib/natural-date'
import { splitTitleAtNaturalDate } from '@/lib/natural-date'
import { cn } from '@/lib/utils'

interface DateAwareTitleInputProps extends Omit<
  ComponentProps<'input'>,
  'onChange' | 'value'
> {
  value: string
  match?: NaturalDateMatch
  onValueChange: (value: string) => void
}

/**
 * A native input laid over a visual text mirror. The input keeps selection,
 * keyboard, autofill, and screen-reader behaviour; the aria-hidden mirror is
 * only responsible for painting the matched date expression.
 */
export function DateAwareTitleInput({
  value,
  match,
  onValueChange,
  className,
  onScroll,
  ...props
}: DateAwareTitleInputProps) {
  const mirrorRef = useRef<HTMLDivElement>(null)
  const parts = splitTitleAtNaturalDate(value, match)

  return (
    <div className="relative min-w-0 overflow-hidden">
      <div
        ref={mirrorRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre text-[15px] leading-snug font-medium text-foreground"
      >
        {match ? (
          <>
            {parts.before}
            <mark className="rounded-[2px] bg-primary/15 text-primary decoration-primary/60 underline decoration-1 underline-offset-2">
              {parts.highlighted}
            </mark>
            {parts.after}
          </>
        ) : (
          value
        )}
      </div>

      <input
        {...props}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onScroll={(event) => {
          if (mirrorRef.current) {
            mirrorRef.current.scrollLeft = event.currentTarget.scrollLeft
          }
          onScroll?.(event)
        }}
        className={cn(
          'relative w-full bg-transparent text-[15px] leading-snug font-medium text-transparent caret-foreground selection:bg-primary/20 placeholder:text-muted-foreground/50 focus-visible:outline-none',
          className,
        )}
      />
    </div>
  )
}

/**
 * Offered under the title while a date phrase is filling the due date: keep
 * it, or keep the words as plain text. Leaving it alone keeps it.
 */
export function NaturalDateSuggestion({
  match,
  onAccept,
  onDismiss,
}: {
  match: NaturalDateMatch
  onAccept: () => void
  onDismiss: () => void
}) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground"
    >
      <CalendarClock className="size-3 text-primary" aria-hidden />
      <span className="min-w-0 truncate">
        <span className="text-primary">“{match.text.trim()}”</span> sets the due
        date
      </span>
      <span className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onAccept}
          className="label-meta rounded-sm border border-hairline px-1.5 py-0.5 transition-colors hover:border-hairline-strong hover:text-foreground"
        >
          Use date
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="label-meta rounded-sm px-1.5 py-0.5 transition-colors hover:text-foreground"
        >
          Keep as text
        </button>
      </span>
    </div>
  )
}
