import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { endOfWeek, format, startOfWeek, subDays } from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'
import { BackButton } from '@/components/app/back-button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getLevel } from '@/components/app/habits/habit-helpers'
import { StatCell } from '@/components/app/habits/stat-cell'
import { HabitCard } from '@/components/app/habits/habit-card'
import { YearGraph } from '@/components/app/habits/year-graph'
import { CreateHabitDialog } from '@/components/app/habits/create-habit-dialog'
import { HabitsEmptyState } from '@/components/app/habits/habits-empty-state'
import { HabitsPageSkeleton } from '@/components/app/habits/habits-page-skeleton'

export const Route = createFileRoute('/(app)/habits/')({
  loader: async () => {},
  pendingComponent: HabitsPageSkeleton,
  component: HabitsPage,
})

function HabitsPage() {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const weekStart = format(
    startOfWeek(now, { weekStartsOn: 1 }),
    'yyyy-MM-dd',
  )
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const yearStart = format(subDays(now, 364), 'yyyy-MM-dd')

  const habits = useQuery(api.habits.queries.getHabitsWithStatus, { today })
  const activityData = useQuery(api.habits.queries.getActivityData, {
    startDate: yearStart,
    endDate: today,
  })
  const weekCompletions = useQuery(api.habits.queries.getWeekCompletions, {
    startDate: weekStart,
    endDate: weekEnd,
  })

  const isLoading =
    habits === undefined ||
    activityData === undefined ||
    weekCompletions === undefined

  if (isLoading) return <HabitsPageSkeleton />

  const completedCount = habits.filter((h) => h.completedToday).length
  const totalHabits = habits.length
  const completionRate =
    totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0
  const bestStreak = habits.reduce(
    (max, h) => Math.max(max, h.currentStreak),
    0,
  )
  const longestEver = habits.reduce(
    (max, h) => Math.max(max, h.longestStreak),
    0,
  )
  const totalXP = habits.reduce((sum, h) => sum + h.totalCompletions * 10, 0)
  const levelInfo = getLevel(totalXP)
  const totalCompletionsYear = Object.values(activityData).reduce(
    (s, n) => s + n,
    0,
  )

  const weeklyPossible = totalHabits * 7
  const weeklyRate =
    weeklyPossible > 0
      ? Math.round((weekCompletions / weeklyPossible) * 100)
      : 0

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Habits
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {totalHabits === 0
                ? 'Build the life you want, one day at a time'
                : completionRate === 100
                  ? 'Perfect day. Every single one.'
                  : bestStreak >= 14
                    ? `${bestStreak}-day streak. Keep rewriting.`
                    : `${completedCount}/${totalHabits} today`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CreateHabitDialog />
        </div>
      </header>

      {totalHabits === 0 ? (
        <HabitsEmptyState />
      ) : (
        <div className="flex-1 w-full space-y-10 pb-6">
          {/* Stat Strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 rounded-md border bg-card divide-y sm:divide-y-0 sm:divide-x divide-border"
          >
            <StatCell
              label="Streak"
              value={`${bestStreak}d`}
              sub={`best ${longestEver}d`}
            />
            <StatCell
              label="Today"
              value={`${completedCount}/${totalHabits}`}
              sub={`${completionRate}%`}
            />
            <StatCell
              label="Week"
              value={`${weeklyRate}%`}
              sub={`${weekCompletions} done`}
            />
            <div className="p-3 sm:p-4">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                Lv.{levelInfo.level} {levelInfo.title}
              </span>
              <p className="text-lg font-bold tabular-nums font-mono mt-0.5">
                {totalXP}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  XP
                </span>
              </p>
              <Progress value={levelInfo.progress} className="h-0.5 mt-1.5" />
            </div>
          </motion.div>

          {/* Today's Habits */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    completionRate === 100 ? 'bg-chart-3' : 'bg-chart-4',
                  )}
                />
                <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Today&apos;s Habits
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                {completedCount}/{totalHabits}
              </span>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {habits.map((habit, i) => (
                  <HabitCard
                    key={habit._id}
                    habit={habit}
                    index={i}
                    today={today}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>

          {/* Year Graph */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.12 }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {format(now, 'yyyy')} Activity
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                {totalCompletionsYear} completions
              </span>
            </div>
            <YearGraph activityData={activityData} totalHabits={totalHabits} />
          </motion.section>
        </div>
      )}
    </div>
  )
}
