import { useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
} from 'date-fns'
import { Trash2, TrendingDown } from 'lucide-react'
import { DECAY_GRACE_UNITS, isDecaying } from 'convex/habits/xp'
import { CATEGORY_META } from './habit-helpers'
import { TallyWall, tallySizeFor } from './tally'
import type { HabitWithStatus } from '@/types/global'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const CELL = 9
const GAP = 2

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.28,
    delay: i * 0.05,
    ease: [0.22, 1, 0.36, 1] as const,
  },
})

/**
 * One habit's own record, kept in the same hand as the page it opens from:
 * its run as a wall of marks, its figures ruled like a statement, its history
 * printed in ink.
 */
export function HabitDetailSheet({
  habit,
  today,
  open,
  onOpenChange,
}: {
  habit: HabitWithStatus
  today: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const meta = CATEGORY_META[habit.category]
  const Icon = meta.icon

  const stripStart = format(subDays(new Date(), 83), 'yyyy-MM-dd')

  const completions = useQuery(
    api.habits.queries.getHabitCompletions,
    open
      ? { habitId: habit._id, startDate: stripStart, endDate: today }
      : 'skip',
  )

  const deleteHabit = useMutation(api.habits.mutations.deleteHabit)

  const daysActive = Math.max(
    1,
    Math.floor((Date.now() - habit._creationTime) / (1000 * 60 * 60 * 24)),
  )
  const expectedCompletions =
    habit.frequency === 'weekly'
      ? Math.max(1, Math.ceil(daysActive / 7))
      : daysActive
  const completionRate = Math.min(
    100,
    Math.round((habit.totalCompletions / expectedCompletions) * 100),
  )
  const decaying = isDecaying(habit)
  const unitLabel = habit.frequency === 'weekly' ? 'week' : 'day'
  const isNewRecord =
    habit.currentStreak > 0 && habit.currentStreak >= habit.longestStreak

  function handleDelete() {
    const promise = deleteHabit({ habitId: habit._id })
    toast.promise(promise, {
      loading: 'Removing habit…',
      success: () => {
        onOpenChange(false)
        return 'Habit removed'
      },
      error: 'Could not remove that habit. Try again.',
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="truncate text-base font-bold tracking-tight">
            {habit.title}
          </SheetTitle>
          {habit.description && (
            <SheetDescription className="mt-0.5 line-clamp-2 text-xs">
              {habit.description}
            </SheetDescription>
          )}
          <p className="mt-2 flex items-center gap-2 text-muted-foreground/80">
            <Icon className={cn('size-3 opacity-70', meta.accent)} />
            <span className="label-meta">{meta.label}</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span className="label-meta">{habit.frequency}</span>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <span className="label-meta" data-numeric>
              {daysActive}d kept
            </span>
          </p>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {/* This habit's own run */}
          <motion.div
            {...stagger(0)}
            className="edge-lit rounded-lg border border-hairline-strong bg-card px-4 py-3.5 shadow-elev-1"
          >
            <div className="flex items-baseline justify-between gap-3 pb-3">
              <span className="label-meta text-muted-foreground">
                Days in a row
              </span>
              {isNewRecord && (
                <span className="label-meta text-primary">Personal best</span>
              )}
            </div>

            {habit.currentStreak === 0 ? (
              <p className="text-sm text-muted-foreground">
                No run going. Mark it today to start one.
              </p>
            ) : (
              <TallyWall
                count={habit.currentStreak}
                markedToday={habit.completedToday}
                size={tallySizeFor(habit.currentStreak)}
              />
            )}

            <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-hairline pt-3">
              <p className="flex items-baseline gap-2">
                <span
                  data-numeric
                  className="font-mono text-2xl leading-none font-bold tracking-[-0.04em]"
                >
                  {habit.currentStreak}
                </span>
                <span className="text-xs text-muted-foreground">in a row</span>
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                longest <span data-numeric>{habit.longestStreak}</span>
              </p>
            </div>
          </motion.div>

          {/* Figures */}
          <motion.dl {...stagger(1)}>
            <Line label="Marked" value={String(habit.totalCompletions)} />
            <Line label="Kept" value={`${completionRate}%`} />
            <Line label="XP" value={habit.xp.toLocaleString()} />
          </motion.dl>

          {habit.decayXp > 0 ? (
            <p className="-mt-3 font-mono text-[11px] text-muted-foreground">
              <span data-numeric>{habit.earnedXp}</span> earned{' '}
              <span className="text-destructive">
                − <span data-numeric>{habit.decayXp}</span> drained over{' '}
                <span data-numeric>{habit.decayedUnits}</span> missed{' '}
                {unitLabel}
                {habit.decayedUnits === 1 ? '' : 's'}
              </span>
            </p>
          ) : habit.missedStreak > 0 ? (
            <p className="-mt-3 font-mono text-[11px] text-muted-foreground">
              <span data-numeric>{habit.missedStreak}</span> {unitLabel}
              {habit.missedStreak === 1 ? '' : 's'} missed ·{' '}
              <span data-numeric>{habit.graceLeft}</span> left before XP drains
            </p>
          ) : null}

          {decaying && (
            <motion.div
              {...stagger(2)}
              className="flex items-start gap-2.5 border-t border-destructive/20 pt-3"
            >
              <TrendingDown className="mt-0.5 size-3.5 shrink-0 text-destructive/80" />
              <p className="min-w-0 text-[12px] leading-relaxed text-muted-foreground">
                {DECAY_GRACE_UNITS} missed {unitLabel}s are forgiven — every{' '}
                {unitLabel} after that costs XP. Mark it once to stop the slide.
              </p>
            </motion.div>
          )}

          {/* Last 12 weeks */}
          <motion.div {...stagger(3)}>
            <h3 className="label-meta border-b border-hairline-strong pb-2 text-muted-foreground">
              Last 12 weeks
            </h3>
            <div className="pt-3">
              {completions === undefined ? (
                <Skeleton className="h-[84px] w-full rounded-lg" />
              ) : (
                <WeeksSheet completions={completions} today={today} />
              )}
            </div>
          </motion.div>

          {/* Recent marks */}
          {completions !== undefined && completions.length > 0 && (
            <motion.div {...stagger(4)}>
              <h3 className="label-meta border-b border-hairline-strong pb-2 text-muted-foreground">
                Recent marks
              </h3>
              <ul className="flex flex-wrap gap-x-3 gap-y-1.5 pt-3">
                {completions
                  .slice(-10)
                  .reverse()
                  .map((date) => (
                    <li
                      key={date}
                      data-numeric
                      className="font-mono text-[11px] text-muted-foreground"
                    >
                      {format(new Date(date + 'T12:00:00'), 'd MMM')}
                    </li>
                  ))}
              </ul>
            </motion.div>
          )}

          <motion.div {...stagger(5)} className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="w-full gap-2 border-destructive/20 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-3" />
              Remove habit
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-2.5 last:border-b-0">
      <dt className="label-meta text-muted-foreground">{label}</dt>
      <dd data-numeric className="font-mono text-sm font-semibold">
        {value}
      </dd>
    </div>
  )
}

/** Twelve weeks in the page's two inks: kept days in graphite, today in terracotta. */
function WeeksSheet({
  completions,
  today,
}: {
  completions: Array<string>
  today: string
}) {
  const kept = useMemo(() => new Set(completions), [completions])

  const weeks = useMemo(() => {
    const gridStart = startOfWeek(subDays(new Date(), 83), { weekStartsOn: 1 })
    const gridEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

    const grid: Array<Array<Date>> = []
    for (let i = 0; i < allDays.length; i += 7) {
      grid.push(allDays.slice(i, i + 7))
    }
    return grid
  }, [])

  const dayLabels = ['M', '', 'W', '', 'F', '', '']

  return (
    <div
      className="overflow-x-auto rounded-lg border border-hairline-strong bg-surface-sunken px-3 py-3"
      style={{ boxShadow: 'var(--elev-inset)' }}
    >
      <div className="flex min-w-fit" style={{ gap: GAP }}>
        <div className="flex shrink-0 flex-col" style={{ width: 14, gap: GAP }}>
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end"
              style={{ height: CELL }}
            >
              <span className="label-meta leading-none text-muted-foreground/45">
                {label}
              </span>
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
            {week.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const isKept = kept.has(dateStr)
              const isToday = dateStr === today

              if (dateStr > today) {
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
                        background: isToday
                          ? isKept
                            ? 'var(--primary)'
                            : 'color-mix(in srgb, var(--foreground) 6%, transparent)'
                          : isKept
                            ? 'color-mix(in srgb, var(--foreground) 72%, transparent)'
                            : 'color-mix(in srgb, var(--foreground) 6%, transparent)',
                        boxShadow: isToday
                          ? '0 0 0 1px var(--primary)'
                          : undefined,
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="font-mono text-[11px]">
                    {isKept ? 'Marked' : 'Missed'} · {format(date, 'd MMM')}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
