import { useEffect, useRef, useState } from 'react'
import {
  addDays,
  addMonths,
  endOfWeek,
  format,
  getISOWeek,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { dateKey, getMonthGrid } from '@/lib/calendar-month'
import { cn } from '@/lib/utils'

/**
 * ── The leaf ──
 *
 * Picking a date does not float over the slip; the sheet unfolds. The panel
 * opens in flow, always directly beneath the band that owns it, so it appears
 * in the same place every time on every screen — nothing flips, nothing is
 * clipped by the dialog, nothing covers the field you are editing.
 */
export function Leaf({
  open,
  children,
}: {
  open: boolean
  children: React.ReactNode
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden border-t border-hairline bg-surface-sunken/60"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const WEEKDAY_HEAD = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/**
 * A month, ruled like the calendar page: a week-number margin and seven
 * columns. The margin is why this reads as the app's own ledger rather than a
 * generic date grid — and week numbers are how people plan more than a week out.
 */
export function MonthSheet({
  selected,
  onSelect,
}: {
  selected?: Date
  onSelect: (date: Date) => void
}) {
  const today = startOfDay(new Date())
  const [month, setMonth] = useState(() => startOfMonth(selected ?? today))
  const [focused, setFocused] = useState(() => selected ?? today)
  const gridRef = useRef<HTMLDivElement>(null)
  const wantsFocus = useRef(false)

  // Follow the field: choosing "Next week" from the band moves the sheet too.
  useEffect(() => {
    if (selected && !isSameMonth(selected, month)) {
      setMonth(startOfMonth(selected))
    }
    if (selected) setFocused(selected)
    // Keyed on the day itself: paging months with ‹ › must not be yanked back.
  }, [selected ? dateKey(selected) : undefined])

  useEffect(() => {
    if (!wantsFocus.current) return
    wantsFocus.current = false
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-day="${dateKey(focused)}"]`)
      ?.focus()
  }, [focused])

  const moveFocus = (next: Date) => {
    wantsFocus.current = true
    setFocused(next)
    if (!isSameMonth(next, month)) setMonth(startOfMonth(next))
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const moves: Record<string, (() => Date) | undefined> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => startOfWeek(focused, { weekStartsOn: 1 }),
      End: () => endOfWeek(focused, { weekStartsOn: 1 }),
      PageUp: () => addMonths(focused, -1),
      PageDown: () => addMonths(focused, 1),
    }
    const move = moves[event.key]
    if (!move) return
    event.preventDefault()
    moveFocus(move())
  }

  const { weeks } = getMonthGrid(month)

  return (
    <div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, -1))}
          aria-label="Previous month"
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="label-meta text-foreground" aria-live="polite">
          {format(month, 'MMMM yyyy')}
        </span>
        <button
          type="button"
          onClick={() => setMonth(addMonths(month, 1))}
          aria-label="Next month"
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={format(month, 'MMMM yyyy')}
        onKeyDown={handleKeyDown}
        className="grid grid-cols-[1.75rem_repeat(7,minmax(0,1fr))] gap-y-0.5 px-3 pb-3"
      >
        <span className="label-meta pb-1 text-center text-muted-foreground/50">
          Wk
        </span>
        {WEEKDAY_HEAD.map((day) => (
          <span
            key={day}
            className="label-meta pb-1 text-center text-muted-foreground"
          >
            {day}
          </span>
        ))}

        {weeks.map((week) => (
          <div key={dateKey(week[0])} role="row" className="contents">
            {/* The margin: the same week column the calendar page rules by. */}
            <span
              aria-hidden
              className="self-center border-r border-hairline pr-1 text-right font-mono text-[10px] tabular-nums text-muted-foreground/45"
            >
              {getISOWeek(week[0])}
            </span>
            {week.map((day) => {
              const isSelected = selected ? isSameDay(day, selected) : false
              const isToday = isSameDay(day, today)
              const outside = !isSameMonth(day, month)
              return (
                <button
                  key={dateKey(day)}
                  type="button"
                  role="gridcell"
                  data-day={dateKey(day)}
                  tabIndex={isSameDay(day, focused) ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={format(day, 'EEEE d MMMM yyyy')}
                  onClick={() => onSelect(day)}
                  className={cn(
                    'mx-auto flex size-7 items-center justify-center rounded-sm font-mono text-[11px] tabular-nums',
                    'transition-colors duration-[var(--dur-1)] ease-[var(--ease-standard)]',
                    isSelected
                      ? 'bg-foreground font-semibold text-background'
                      : isToday
                        ? 'font-semibold text-primary hover:bg-accent'
                        : outside
                          ? 'text-muted-foreground/35 hover:bg-accent/60'
                          : 'text-foreground/80 hover:bg-accent/60',
                  )}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

/** The hours a task is actually due at. Anything else gets typed. */
const TIME_STAMPS = ['08:00', '12:00', '17:00', '20:00']

export function TimeRail({
  value,
  onChange,
  label = 'At',
}: {
  /** `HH:mm`. */
  value: string
  onChange: (time: string) => void
  label?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline px-3 py-2.5">
      <span className="label-meta w-8 shrink-0 text-muted-foreground">
        {label}
      </span>
      {TIME_STAMPS.map((stamp) => (
        <button
          key={stamp}
          type="button"
          onClick={() => onChange(stamp)}
          className={cn(
            'rounded-sm border px-2 py-1 font-mono text-[11px] tabular-nums transition-colors duration-[var(--dur-1)]',
            value === stamp
              ? 'border-foreground bg-foreground text-background'
              : 'border-hairline text-muted-foreground hover:border-hairline-strong hover:text-foreground',
          )}
        >
          {stamp}
        </button>
      ))}
      <input
        type="time"
        step={300}
        value={value}
        onChange={(event) => event.target.value && onChange(event.target.value)}
        aria-label="Exact time"
        className="ml-auto h-7 rounded-sm border border-hairline bg-card px-1.5 font-mono text-[11px] tabular-nums"
      />
    </div>
  )
}

/** The date leaf itself: a month, then the hour it falls due. */
export function DateLeaf({
  value,
  onChange,
}: {
  value?: Date
  onChange: (date: Date) => void
}) {
  const time = value ? format(value, 'HH:mm') : '17:00'

  const selectDay = (day: Date) => {
    const [hours, minutes] = time.split(':').map(Number)
    const next = new Date(day)
    next.setHours(hours, minutes, 0, 0)
    onChange(next)
  }

  const selectTime = (next: string) => {
    const [hours, minutes] = next.split(':').map(Number)
    const day = new Date(value ?? startOfDay(new Date()))
    day.setHours(hours, minutes, 0, 0)
    onChange(day)
  }

  return (
    <div>
      <MonthSheet selected={value} onSelect={selectDay} />
      <TimeRail value={time} onChange={selectTime} />
    </div>
  )
}
