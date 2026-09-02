import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * ── The tally ──
 *
 * How much of an entry is left, printed the way a docket would: one mark per
 * part, struck through as each is done. It is a count first and a graphic
 * second — the figure beside it says what is left, and it counts *down*, so
 * the movement you notice is work disappearing.
 *
 * Marks are laid in ink as they are struck, left to right, on a spring. Past
 * a dozen parts the marks would be thinner than the rule between rows, so the
 * tally collapses into one continuous rule that fills instead.
 */

const MAX_MARKS = 12

const spring = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 34,
  mass: 0.7,
}

interface SubtaskMeterProps {
  total: number
  done: number
  /**
   * `rail` — inline under a printed row: marks, then the figure.
   * `bar` — the full width of a panel, with the figure spelled out.
   */
  variant?: 'rail' | 'bar'
  className?: string
}

export function SubtaskMeter({
  total,
  done,
  variant = 'rail',
  className,
}: SubtaskMeterProps) {
  if (total === 0) return null

  const remaining = Math.max(total - done, 0)
  const complete = remaining === 0
  const ratio = done / total

  const label = complete
    ? 'All done'
    : `${remaining} left${variant === 'bar' ? ` of ${total}` : ''}`

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-2',
        variant === 'bar' && 'w-full gap-3',
        className,
      )}
      title={`${done} of ${total} subtasks done`}
    >
      <div
        aria-hidden
        className={cn(
          'flex items-center gap-[3px]',
          variant === 'bar' && 'w-full',
        )}
      >
        {total <= MAX_MARKS && variant === 'rail' ? (
          Array.from({ length: total }, (_, index) => (
            <Mark
              key={index}
              struck={index < done}
              index={index}
              complete={complete}
            />
          ))
        ) : (
          <Rule ratio={ratio} complete={complete} />
        )}
      </div>

      {/* The figure. It replaces itself rather than morphing, so a completion
          reads as one thing leaving and a smaller one arriving. */}
      <div
        className={cn(
          'relative h-[14px] shrink-0 overflow-hidden',
          variant === 'bar' && 'h-4',
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'label-meta flex items-center gap-1 whitespace-nowrap',
              complete ? 'text-chart-3' : 'text-muted-foreground',
              variant === 'bar' && 'text-[11px]',
            )}
          >
            {complete && <Check className="size-3 stroke-[3]" />}
            {label}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

/** One part of the entry: a hollow well, or ink struck across it. */
function Mark({
  struck,
  index,
  complete,
}: {
  struck: boolean
  index: number
  complete: boolean
}) {
  return (
    <span className="relative h-[3px] w-2.5 overflow-hidden rounded-full bg-hairline-strong/50">
      <motion.span
        initial={false}
        animate={{ scaleX: struck ? 1 : 0 }}
        transition={{ ...spring, delay: struck ? index * 0.02 : 0 }}
        className={cn(
          'absolute inset-0 origin-left rounded-full',
          complete ? 'bg-chart-3' : 'bg-primary',
        )}
      />
    </span>
  )
}

/** The same tally, drawn as one rule, for entries with many parts. */
function Rule({ ratio, complete }: { ratio: number; complete: boolean }) {
  return (
    <span className="relative h-[3px] w-full min-w-14 flex-1 overflow-hidden rounded-full bg-hairline-strong/50">
      <motion.span
        initial={false}
        animate={{ scaleX: ratio }}
        transition={spring}
        className={cn(
          'absolute inset-0 origin-left rounded-full',
          complete ? 'bg-chart-3' : 'bg-primary',
        )}
      />
    </span>
  )
}
