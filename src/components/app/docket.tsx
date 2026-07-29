import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * ── The docket ──
 *
 * The app's structural surface, and the sibling to the habits tally sheet.
 * Things in TwoDo are not cards floating over a page; they are entries
 * printed on one sheet. Two columns never move:
 *
 *   left margin  — the spine. Which priority, and whether it is still live.
 *   right gutter — time. Set in tabular mono at a fixed width, so a stack of
 *                  entries turns urgency into a stripe you can scan.
 *
 * Because entries share a single sheet, their spines meet and read as one
 * continuous, colour-segmented margin rule running down the page.
 */

/** The gutter column. Wide enough for `TODAY`, `−3mo`, `14:30`. */
export const GUTTER = 'w-[4.25rem] shrink-0 text-right tabular-nums'

export function Docket({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'edge-lit overflow-hidden rounded-lg border border-hairline bg-card shadow-elev-2',
        // The sheet rules itself. Every band after the first is separated by a
        // hairline, so rows never have to know whether they are first, and a
        // motion wrapper around one can't knock a rule out.
        '[&>*+*]:border-t [&>*+*]:border-hairline',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * The printed header band. No status dot: the label says what the section is,
 * and the only thing allowed to carry colour is a count that needs attention.
 */
export function DocketHeader({
  label,
  count,
  urgent = false,
  children,
}: {
  label: string
  count?: number
  /** Terracotta the count — reserved for work that is already late. */
  urgent?: boolean
  /** Trailing controls, sat before the gutter. */
  children?: ReactNode
}) {
  return (
    <div className="flex items-center gap-3 bg-surface-sunken py-2 pr-3 pl-4">
      <h2 className="label-meta min-w-0 flex-1 truncate text-muted-foreground">
        {label}
      </h2>
      {children}
      {count !== undefined && (
        <span
          data-numeric
          className={cn(
            'font-mono text-[11px] font-semibold',
            GUTTER,
            urgent && count > 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {count}
        </span>
      )}
    </div>
  )
}

/** A ruled entry. Rows separate themselves so a docket can mix row types. */
export function DocketRow({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 py-3 pr-3 pl-4',
        'transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * The docket's footer rule — where pagination, totals and "nothing here yet"
 * live, so the sheet always closes with a line instead of trailing off.
 */
export function DocketFoot({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-surface-sunken px-4 py-2.5',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * A loading sheet is still a sheet — the rules and the two columns are already
 * printed, only the entries have yet to arrive.
 */
export function DocketRowsSkeleton({
  rows = 3,
  check = true,
}: {
  rows?: number
  /** Index rows have no checkbox — they are places, not work. */
  check?: boolean
}) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-t border-hairline py-3.5 pr-3 pl-4 first:border-t-0"
        >
          {check && (
            <span className="size-5 shrink-0 rounded-[6px] bg-surface-sunken" />
          )}
          <span
            className="h-3.5 flex-1 rounded bg-surface-sunken"
            style={{ maxWidth: `${70 - i * 12}%` }}
          />
          <span className={cn(GUTTER, 'h-3 rounded bg-surface-sunken')} />
        </div>
      ))}
    </div>
  )
}

/** An empty sheet still reads as a sheet: one ruled line saying what to do. */
export function DocketEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

/**
 * A blank sheet. Not a shrug in the middle of the page — the paper is already
 * ruled and waiting, which is the invitation. The ghost lines say what a row
 * will look like once there is one.
 */
export function DocketBlank({
  label,
  message,
  ghosts = 3,
  check = false,
  action,
}: {
  label: string
  message: ReactNode
  ghosts?: number
  check?: boolean
  action?: ReactNode
}) {
  return (
    <Docket>
      <DocketHeader label={label} />
      <div aria-hidden>
        {Array.from({ length: ghosts }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-t border-hairline py-3.5 pr-3 pl-4 first:border-t-0"
          >
            {check && (
              <span className="size-5 shrink-0 rounded-[6px] border border-dashed border-hairline-strong" />
            )}
            <span
              className="h-px flex-1 border-t border-dashed border-hairline-strong"
              style={{ maxWidth: `${64 - i * 14}%` }}
            />
            <span
              className={cn(
                GUTTER,
                'h-px border-t border-dashed border-hairline-strong',
              )}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-3 bg-surface-sunken px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        {action}
      </div>
    </Docket>
  )
}
