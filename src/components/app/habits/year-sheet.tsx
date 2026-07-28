import { useMemo } from 'react'
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  getMonth,
  startOfWeek,
  subDays,
} from 'date-fns'
import { MONTH_LABELS } from './habit-helpers'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const CELL = 11
const GAP = 2.5
const MONTH_GAP = 7
const DAY_LABEL_W = 26

/**
 * Ink density, five steps. The record is printed in the same ink the marks are
 * struck in — colour on this page means one thing only, and it means today.
 */
const INK = [6, 17, 32, 52, 80].map(
  (pct) => `color-mix(in srgb, var(--foreground) ${pct}%, transparent)`,
)

function inkFor(count: number, totalHabits: number): string {
  if (totalHabits === 0 || count === 0) return INK[0]
  const ratio = count / totalHabits
  if (ratio >= 1) return INK[4]
  if (ratio >= 0.66) return INK[3]
  if (ratio >= 0.33) return INK[2]
  return INK[1]
}

/**
 * The year, printed. Weeks run down the columns, months are pulled apart by a
 * hair so the eye can find its way, and the only coloured cell on the sheet is
 * today's.
 */
export function YearSheet({
  activityData,
  totalHabits,
}: {
  activityData: Record<string, number>
  totalHabits: number
}) {
  const { weeks, monthLabels, todayStr } = useMemo(() => {
    const now = new Date()
    const today = format(now, 'yyyy-MM-dd')
    const gridStart = startOfWeek(subDays(now, 364), { weekStartsOn: 1 })
    const gridEnd = endOfWeek(now, { weekStartsOn: 1 })
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

    const grid: Array<Array<Date>> = []
    for (let i = 0; i < allDays.length; i += 7) {
      grid.push(allDays.slice(i, i + 7))
    }

    const seen = new Set<number>()
    const labels: Array<string | null> = grid.map((week) => {
      for (const day of week) {
        if (day.getDate() <= 7 && !seen.has(getMonth(day))) {
          seen.add(getMonth(day))
          return MONTH_LABELS[getMonth(day)]
        }
      }
      return null
    })

    return { weeks: grid, monthLabels: labels, todayStr: today }
  }, [])

  // Both rows map the same array, so the same offset keeps them in register.
  const offsetFor = (i: number) =>
    monthLabels[i] !== null && i > 0 ? MONTH_GAP : 0

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']

  return (
    <div
      className="overflow-x-auto rounded-lg border border-hairline-strong bg-surface-sunken px-4 py-3.5"
      style={{ boxShadow: 'var(--elev-inset)' }}
    >
      <div className="flex min-w-fit pb-1.5" style={{ gap: GAP }}>
        <div className="shrink-0" style={{ width: DAY_LABEL_W }} />
        {monthLabels.map((label, i) => (
          <div
            key={i}
            className="shrink-0 overflow-visible"
            style={{ width: CELL, marginLeft: offsetFor(i) }}
          >
            {label && (
              <span className="label-meta whitespace-nowrap text-muted-foreground/60">
                {label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex min-w-fit" style={{ gap: GAP }}>
        <div
          className="flex shrink-0 flex-col"
          style={{ width: DAY_LABEL_W - GAP, gap: GAP }}
        >
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end"
              style={{ height: CELL }}
            >
              <span className="label-meta pr-1 leading-none text-muted-foreground/45">
                {label}
              </span>
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div
            key={wi}
            className="flex flex-col"
            style={{ gap: GAP, marginLeft: offsetFor(wi) }}
          >
            {week.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const count = activityData[dateStr] ?? 0
              const isToday = dateStr === todayStr

              if (dateStr > todayStr) {
                return (
                  <div key={dateStr} style={{ width: CELL, height: CELL }} />
                )
              }

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <div
                      style={{
                        width: CELL,
                        height: CELL,
                        borderRadius: 1.5,
                        background:
                          isToday && count > 0
                            ? 'var(--primary)'
                            : inkFor(count, totalHabits),
                        boxShadow: isToday
                          ? '0 0 0 1px var(--primary)'
                          : undefined,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="font-mono text-[11px]">
                    <span className="font-semibold" data-numeric>
                      {count}/{totalHabits}
                    </span>{' '}
                    {format(date, 'd MMM yyyy')}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="label-meta text-muted-foreground/45">None</span>
        {INK.map((ink) => (
          <div
            key={ink}
            style={{
              width: 9,
              height: 9,
              borderRadius: 1.5,
              background: ink,
            }}
          />
        ))}
        <span className="label-meta text-muted-foreground/45">All</span>
      </div>
    </div>
  )
}
