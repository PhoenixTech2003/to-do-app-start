import { useState } from 'react'
import { addDays, format, isSameDay, parse, startOfDay } from 'date-fns'
import { X } from 'lucide-react'
import {
  RECURRENCE_PRESETS,
  WEEKDAY_LABEL,
  describeRecurrence,
  sameRecurrence,
} from 'convex/todos/recurrence'
import { DateLeaf, Leaf, MonthSheet } from './date-leaf'
import type { RecurrenceFreq, RecurrenceRule } from 'convex/todos/recurrence'
import { GUTTER } from '@/components/app/docket'
import { gutterInk, gutterTime } from '@/lib/todo-time'
import { dateKey } from '@/lib/calendar-month'
import { cn } from '@/lib/utils'

/**
 * ── Writing an entry ──
 *
 * The fields a twodo is composed from, printed in the docket's own language:
 * the left margin carries priority, the right gutter carries time, and both are
 * live while you type. Composing a task and reading one use the same two
 * columns, so the form is a preview of the line it will print.
 *
 * Nothing here floats. Bands that need more room unfold a leaf beneath
 * themselves — see `date-leaf.tsx`.
 */

export type Priority = 'high' | 'medium' | 'low' | 'none'

/** Ink for the margin rule. `none` is the bare rule — no priority, no colour. */
export const PRIORITY_SPINE: Record<Priority, string> = {
  high: 'var(--destructive)',
  medium: 'var(--chart-4)',
  low: 'var(--chart-2)',
  none: 'var(--border)',
}

/** A day picked without a time is due by end of the working day, not midnight. */
const DEFAULT_HOUR = 17

const QUICK_DAYS = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: 'Next week', days: 7 },
]

function chipClasses(selected: boolean) {
  return cn(
    'label-meta rounded-sm border px-2 py-1 transition-colors duration-[var(--dur-1)] ease-[var(--ease-standard)]',
    selected
      ? 'border-foreground bg-foreground text-background'
      : 'border-hairline text-muted-foreground hover:border-hairline-strong hover:text-foreground',
  )
}

/** A field band on the slip: its label sits in the same column on every row. */
export function Band({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hairline px-4 py-2.5">
      <span className="label-meta w-[4.5rem] shrink-0 text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

/**
 * The gutter mark this entry will carry once it is filed. Same column, same
 * function, same ink as every printed row.
 */
export function EntryMark({ date }: { date?: Date }) {
  const due = date
    ? gutterTime(format(date, 'yyyy-MM-dd'), format(date, 'HH:mm'))
    : gutterTime()

  return (
    <span
      data-numeric
      title={due.long}
      className={cn(
        'mt-0.5 font-mono text-[11px] leading-5 font-semibold',
        GUTTER,
        gutterInk[due.tone],
      )}
    >
      {due.short}
    </span>
  )
}

/** Monday-first, matching the week margin on the calendar sheet. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

const FREQ_UNITS: Array<{ freq: RecurrenceFreq; label: string }> = [
  { freq: 'daily', label: 'Days' },
  { freq: 'weekly', label: 'Weeks' },
  { freq: 'monthly', label: 'Months' },
  { freq: 'yearly', label: 'Years' },
]

/**
 * When an entry is due and how it comes back. Both bands unfold into the same
 * kind of leaf, and only one is ever open — so the sheet never grows in two
 * places at once and the control is always where you left it.
 */
export function WhenBands({
  due,
  onDueChange,
  recurrence,
  onRecurrenceChange,
  /** Subtasks are due once; repetition belongs to the entry above them. */
  withRepeat = true,
}: {
  due?: Date
  onDueChange: (date?: Date) => void
  recurrence?: RecurrenceRule
  onRecurrenceChange: (rule?: RecurrenceRule) => void
  withRepeat?: boolean
}) {
  const [openLeaf, setOpenLeaf] = useState<'due' | 'repeat' | null>(null)

  const dayFromNow = (days: number) => addDays(startOfDay(new Date()), days)

  const selectDay = (day: Date) => {
    const next = new Date(day)
    next.setHours(due?.getHours() ?? DEFAULT_HOUR, due?.getMinutes() ?? 0, 0, 0)
    onDueChange(next)
  }

  const clearDue = () => {
    onDueChange(undefined)
    // A rule with nothing to repeat from is no rule at all.
    onRecurrenceChange(undefined)
    setOpenLeaf(null)
  }

  const matchedQuick = due
    ? QUICK_DAYS.find((quick) => isSameDay(due, dayFromNow(quick.days)))
    : undefined

  const matchedPreset = recurrence
    ? RECURRENCE_PRESETS.find((preset) =>
        sameRecurrence(preset.rule, recurrence),
      )
    : undefined
  const isCustomRule = Boolean(recurrence) && !matchedPreset
  const rule: RecurrenceRule = recurrence ?? { freq: 'weekly', interval: 1 }
  const endsOn =
    rule.until !== undefined
      ? 'on'
      : rule.count !== undefined
        ? 'after'
        : 'never'

  const patchRule = (next: Partial<RecurrenceRule>) =>
    onRecurrenceChange({ ...rule, ...next })

  const toggleWeekday = (day: number) => {
    const current = rule.weekdays ?? []
    const next = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day]
    patchRule({
      weekdays: next.length > 0 ? next.sort((a, b) => a - b) : undefined,
    })
  }

  const setEnds = (kind: 'never' | 'on' | 'after') => {
    if (kind === 'never') patchRule({ until: undefined, count: undefined })
    if (kind === 'on')
      patchRule({
        until: dateKey(addDays(startOfDay(new Date()), 30)),
        count: undefined,
      })
    if (kind === 'after') patchRule({ count: 10, until: undefined })
  }

  return (
    <>
      <Band label="Due">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {QUICK_DAYS.map((quick) => (
            <button
              key={quick.label}
              type="button"
              onClick={() => selectDay(dayFromNow(quick.days))}
              className={chipClasses(matchedQuick?.label === quick.label)}
            >
              {quick.label}
            </button>
          ))}

          <button
            type="button"
            aria-expanded={openLeaf === 'due'}
            onClick={() =>
              setOpenLeaf((current) => (current === 'due' ? null : 'due'))
            }
            className={cn(
              chipClasses(
                openLeaf === 'due' || (Boolean(due) && !matchedQuick),
              ),
              due && 'tabular-nums',
            )}
          >
            {due ? format(due, 'd MMM HH:mm') : 'Pick a date'}
          </button>

          {due && (
            <button
              type="button"
              onClick={clearDue}
              aria-label="Clear due date"
              className="rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </Band>

      <Leaf open={openLeaf === 'due'}>
        <DateLeaf value={due} onChange={onDueChange} />
      </Leaf>

      {withRepeat && (
        <>
          <Band label="Repeat">
            {due ? (
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onRecurrenceChange(undefined)
                    setOpenLeaf(null)
                  }}
                  className={chipClasses(!recurrence)}
                >
                  Never
                </button>

                {RECURRENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      onRecurrenceChange(preset.rule)
                      setOpenLeaf(null)
                    }}
                    className={chipClasses(
                      matchedPreset?.label === preset.label,
                    )}
                  >
                    {preset.label}
                  </button>
                ))}

                <button
                  type="button"
                  aria-expanded={openLeaf === 'repeat'}
                  onClick={() => {
                    if (!recurrence) onRecurrenceChange(rule)
                    setOpenLeaf((current) =>
                      current === 'repeat' ? null : 'repeat',
                    )
                  }}
                  className={chipClasses(openLeaf === 'repeat' || isCustomRule)}
                >
                  {isCustomRule ? describeRecurrence(rule) : 'Custom'}
                </button>
              </div>
            ) : (
              <span className="font-mono text-[11px] text-muted-foreground/60">
                Give it a due date to repeat from
              </span>
            )}
          </Band>

          <Leaf open={openLeaf === 'repeat' && Boolean(due)}>
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
              <span className="label-meta w-12 shrink-0 text-muted-foreground">
                Every
              </span>
              <input
                type="number"
                min={1}
                max={365}
                value={rule.interval}
                onChange={(e) =>
                  patchRule({
                    interval: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                aria-label="Interval"
                className="h-7 w-12 rounded-sm border border-hairline bg-card px-1.5 text-center font-mono text-sm tabular-nums"
              />
              <div className="flex flex-wrap gap-1">
                {FREQ_UNITS.map((unit) => (
                  <button
                    key={unit.freq}
                    type="button"
                    onClick={() =>
                      patchRule({
                        freq: unit.freq,
                        weekdays:
                          unit.freq === 'weekly' ? rule.weekdays : undefined,
                      })
                    }
                    className={chipClasses(rule.freq === unit.freq)}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            {rule.freq === 'weekly' && (
              <div className="flex items-center gap-2 border-t border-hairline px-3 py-2.5">
                <span className="label-meta w-12 shrink-0 text-muted-foreground">
                  On
                </span>
                <div className="flex gap-1">
                  {WEEK_ORDER.map((day) => {
                    const selected = (rule.weekdays ?? []).includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeekday(day)}
                        aria-pressed={selected}
                        aria-label={WEEKDAY_LABEL[day]}
                        className={cn(
                          'size-6 rounded-sm border font-mono text-[10px] font-semibold transition-colors',
                          selected
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-hairline text-muted-foreground hover:border-hairline-strong hover:text-foreground',
                        )}
                      >
                        {WEEKDAY_LABEL[day].charAt(0)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-3 py-2.5">
              <span className="label-meta w-12 shrink-0 text-muted-foreground">
                Ends
              </span>
              <button
                type="button"
                onClick={() => setEnds('never')}
                className={chipClasses(endsOn === 'never')}
              >
                Never
              </button>
              <button
                type="button"
                onClick={() => setEnds('on')}
                className={chipClasses(endsOn === 'on')}
              >
                On date
              </button>
              <button
                type="button"
                onClick={() => setEnds('after')}
                className={chipClasses(endsOn === 'after')}
              >
                After
              </button>

              {endsOn === 'after' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={rule.count ?? 10}
                    onChange={(e) =>
                      patchRule({
                        count: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    aria-label="Number of times"
                    className="h-7 w-14 rounded-sm border border-hairline bg-card px-1.5 text-center font-mono text-sm tabular-nums"
                  />
                  <span className="label-meta text-muted-foreground">
                    times
                  </span>
                </div>
              )}
            </div>

            {/* The same month sheet, so "until" is chosen the way every date is. */}
            {endsOn === 'on' && (
              <div className="border-t border-hairline">
                <MonthSheet
                  selected={
                    rule.until
                      ? parse(rule.until, 'yyyy-MM-dd', new Date())
                      : undefined
                  }
                  onSelect={(day) => patchRule({ until: dateKey(day) })}
                />
              </div>
            )}
          </Leaf>
        </>
      )}
    </>
  )
}

/**
 * Priority, chosen in the margin. Each option is the stroke it will print, so
 * you pick the spine rather than a word describing it.
 */
export function PriorityMargin({
  value,
  onChange,
  name = 'priority',
}: {
  value: Priority
  onChange: (priority: Priority) => void
  name?: string
}) {
  const options: Array<{ value: Priority; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Med' },
    { value: 'high', label: 'High' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-1 transition-colors duration-[var(--dur-1)] ease-[var(--ease-standard)]',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
              selected
                ? 'border-hairline-strong bg-surface-sunken text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className="h-3.5 w-[3px] rounded-[1px] transition-opacity"
              style={{
                background: PRIORITY_SPINE[option.value],
                opacity: selected ? 1 : 0.45,
              }}
            />
            <span className="label-meta">{option.label}</span>
          </label>
        )
      })}
    </div>
  )
}
