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
import { cn } from '@/lib/utils'

const CELL = 11
const GAP = 2
const DAY_LABEL_W = 28

export function YearGraph({
  activityData,
  totalHabits,
}: {
  activityData: Record<string, number>
  totalHabits: number
}) {
  const { weeks, monthLabels, todayStr } = useMemo(() => {
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const yearAgo = subDays(now, 364)
    const gridStart = startOfWeek(yearAgo, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(now, { weekStartsOn: 1 })
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

    const weeks: Array<Array<Date>> = []
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7))
    }

    const seen = new Set<number>()
    const monthLabels: Array<string | null> = weeks.map((week) => {
      for (const d of week) {
        if (d.getDate() === 1 && !seen.has(getMonth(d))) {
          seen.add(getMonth(d))
          return MONTH_LABELS[getMonth(d)]
        }
      }
      return null
    })

    return { weeks, monthLabels, todayStr }
  }, [])

  function getCellClass(count: number): string {
    if (totalHabits === 0 || count === 0) return 'bg-muted/20 dark:bg-muted/10'
    const ratio = count / totalHabits
    if (ratio >= 1) return 'bg-emerald-400 dark:bg-emerald-400'
    if (ratio >= 0.75) return 'bg-emerald-400/65 dark:bg-emerald-400/60'
    if (ratio >= 0.5) return 'bg-emerald-500/45 dark:bg-emerald-500/40'
    if (ratio >= 0.25) return 'bg-emerald-600/30 dark:bg-emerald-600/25'
    return 'bg-emerald-700/18 dark:bg-emerald-700/15'
  }

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']

  return (
    <div className="rounded-md border bg-card p-4 overflow-x-auto">
      <div className="flex min-w-fit mb-1" style={{ gap: GAP }}>
        <div className="shrink-0" style={{ width: DAY_LABEL_W }} />
        {monthLabels.map((label, i) => (
          <div
            key={i}
            className="shrink-0 overflow-visible"
            style={{ width: CELL }}
          >
            {label && (
              <span className="text-[9px] font-mono text-muted-foreground/60 whitespace-nowrap">
                {label}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex min-w-fit" style={{ gap: GAP }}>
        <div
          className="flex flex-col shrink-0"
          style={{ width: DAY_LABEL_W - GAP, gap: GAP }}
        >
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end"
              style={{ height: CELL }}
            >
              <span className="text-[8px] font-mono text-muted-foreground/40 leading-none pr-1">
                {label}
              </span>
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
            {week.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const count = activityData[dateStr] ?? 0
              const isFuture = dateStr > todayStr
              const isToday = dateStr === todayStr

              if (isFuture) {
                return (
                  <div
                    key={dateStr}
                    style={{ width: CELL, height: CELL }}
                    className="rounded-[2px]"
                  />
                )
              }

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <div
                      style={{ width: CELL, height: CELL }}
                      className={cn(
                        'rounded-[2px] transition-colors',
                        getCellClass(count),
                        isToday && 'ring-1 ring-foreground/25',
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[11px] font-mono">
                    <span className="font-semibold">
                      {count}/{totalHabits}
                    </span>{' '}
                    {format(date, 'MMM d, yyyy')}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[8px] font-mono text-muted-foreground/40">
          Less
        </span>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <div
            key={ratio}
            className={cn(
              'size-[9px] rounded-[2px]',
              getCellClass(Math.ceil(ratio * totalHabits)),
            )}
          />
        ))}
        <span className="text-[8px] font-mono text-muted-foreground/40">
          More
        </span>
      </div>
    </div>
  )
}
