import { useRef } from 'react'
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
