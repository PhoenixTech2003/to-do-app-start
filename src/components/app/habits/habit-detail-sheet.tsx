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
import { Flame, Trash2, Trophy } from 'lucide-react'
import { CATEGORY_FILL, CATEGORY_META } from './habit-helpers'
import type { Category } from './habit-helpers'
import type { Id } from 'convex/_generated/dataModel'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type HabitDetail = {
  _id: Id<'habits'>
  _creationTime: number
  title: string
  description?: string
  category: Category
  frequency: string
  currentStreak: number
  longestStreak: number
  totalCompletions: number
  completedToday: boolean
}

const CELL = 8
const GAP = 2

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.05 },
})

export function HabitDetailSheet({
  habit,
  today,
  open,
  onOpenChange,
}: {
  habit: HabitDetail
  today: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const meta = CATEGORY_META[habit.category]
  const fill = CATEGORY_FILL[habit.category]
  const Icon = meta.icon

  const now = new Date()
  const stripStart = format(subDays(now, 83), 'yyyy-MM-dd')

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
  const xp = habit.totalCompletions * 10
  const isNewRecord =
    habit.currentStreak > 0 && habit.currentStreak >= habit.longestStreak

  function handleDelete() {
    const promise = deleteHabit({ habitId: habit._id })
    toast.promise(promise, {
      loading: 'Removing habit...',
      success: () => {
        onOpenChange(false)
        return 'Habit removed'
      },
      error: 'Failed to delete',
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-lg',
                meta.bg,
              )}
            >
              <Icon className={cn('size-4', meta.accent)} />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-bold tracking-tight truncate">
                {habit.title}
              </SheetTitle>
              {habit.description && (
                <SheetDescription className="text-xs line-clamp-2 mt-0.5">
                  {habit.description}
                </SheetDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Badge
              variant="outline"
              className={cn(
                'text-[9px] px-1.5 py-0 h-4 border-transparent',
                meta.bg,
                meta.accent,
              )}
            >
              <Icon className="size-2.5 mr-0.5" />
              {meta.label}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground"
            >
              {habit.frequency}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-0 h-4 text-muted-foreground"
            >
              {daysActive}d active
            </Badge>
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* Streak hero */}
          <motion.div {...stagger(0)}>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className={cn(
                  'relative rounded-lg border p-4 text-center overflow-hidden',
                  meta.bg,
                )}
              >
                {isNewRecord && (
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-amber-400/5" />
                )}
                <div className="relative">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame
                      className={cn(
                        'size-3.5',
                        habit.currentStreak >= 7
                          ? 'text-amber-400'
                          : meta.accent,
                      )}
                    />
                  </div>
                  <p
                    className={cn(
                      'text-3xl font-black font-mono tabular-nums tracking-tighter',
                      isNewRecord ? 'text-amber-400' : meta.accent,
                    )}
                  >
                    {habit.currentStreak}
                  </p>
                  <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1">
                    Current Streak
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4 text-center bg-muted/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="size-3.5 text-muted-foreground/50" />
                </div>
                <p className="text-3xl font-black font-mono tabular-nums tracking-tighter text-muted-foreground/70">
                  {habit.longestStreak}
                </p>
                <p className="text-[9px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1">
                  Personal Best
                </p>
              </div>
            </div>
            {isNewRecord && (
              <div className="flex justify-center mt-2">
                <Badge className="bg-amber-400/15 text-amber-400 border-amber-400/30 text-[9px] font-mono font-bold uppercase tracking-wider hover:bg-amber-400/15">
                  New Record
                </Badge>
              </div>
            )}
          </motion.div>

          {/* Stats grid */}
          <motion.div
            {...stagger(1)}
            className="grid grid-cols-4 rounded-md border bg-card divide-x divide-border"
          >
            <MiniStat label="Done" value={String(habit.totalCompletions)} />
            <MiniStat label="XP" value={String(xp)} />
            <MiniStat label="Days" value={String(daysActive)} />
            <MiniStat label="Rate" value={`${completionRate}%`} />
          </motion.div>

          {/* 12-week strip */}
          <motion.div {...stagger(2)}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn('h-1.5 w-1.5 rounded-full', fill)} />
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Last 12 Weeks
              </h3>
            </div>
            {completions === undefined ? (
              <Skeleton className="h-[78px] w-full rounded-md" />
            ) : (
              <ActivityStrip
                completions={completions}
                category={habit.category}
              />
            )}
          </motion.div>

          {/* Recent completions */}
          {completions !== undefined && completions.length > 0 && (
            <motion.div {...stagger(3)}>
              <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Recent
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {completions
                  .slice(-10)
                  .reverse()
                  .map((date) => (
                    <Badge
                      key={date}
                      variant="outline"
                      className="text-[9px] font-mono text-muted-foreground px-2 py-0.5"
                    >
                      {format(new Date(date + 'T12:00:00'), 'MMM d')}
                    </Badge>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Delete */}
          <motion.div {...stagger(4)} className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 text-xs gap-2"
            >
              <Trash2 className="size-3" />
              Delete Habit
            </Button>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 text-center">
      <p className="text-base font-bold tabular-nums font-mono">{value}</p>
      <p className="text-[8px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
        {label}
      </p>
    </div>
  )
}

function ActivityStrip({
  completions,
  category,
}: {
  completions: Array<string>
  category: Category
}) {
  const fill = CATEGORY_FILL[category]
  const completionSet = useMemo(() => new Set(completions), [completions])

  const { weeks, todayStr } = useMemo(() => {
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const start = subDays(now, 83)
    const gridStart = startOfWeek(start, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(now, { weekStartsOn: 1 })
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd })

    const weeks: Array<Array<Date>> = []
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7))
    }

    return { weeks, todayStr }
  }, [])

  const dayLabels = ['M', '', 'W', '', 'F', '', '']

  return (
    <div className="rounded-md border bg-card p-3 overflow-x-auto">
      <div className="flex min-w-fit" style={{ gap: GAP }}>
        <div className="flex flex-col shrink-0" style={{ width: 14, gap: GAP }}>
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end"
              style={{ height: CELL }}
            >
              <span className="text-[7px] font-mono text-muted-foreground/40 leading-none">
                {label}
              </span>
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col" style={{ gap: GAP }}>
            {week.map((date) => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const isCompleted = completionSet.has(dateStr)
              const isFuture = dateStr > todayStr
              const isToday = dateStr === todayStr

              if (isFuture) {
                return (
                  <div
                    key={dateStr}
                    style={{ width: CELL, height: CELL }}
                    className="rounded-[1.5px]"
                  />
                )
              }

              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <div
                      style={{ width: CELL, height: CELL }}
                      className={cn(
                        'rounded-[1.5px] transition-colors',
                        isCompleted ? fill : 'bg-muted/20 dark:bg-muted/10',
                        isToday && 'ring-1 ring-foreground/25',
                      )}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] font-mono">
                    {isCompleted ? 'Done' : 'Missed'} · {format(date, 'MMM d')}
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
