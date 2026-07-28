import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { endOfWeek, format, startOfWeek, subDays } from 'date-fns'
import { AnimatePresence, motion } from 'motion/react'
import { isDecaying } from 'convex/habits/xp'
import { BackButton } from '@/components/app/back-button'
import { computeRun } from '@/components/app/habits/habit-helpers'
import { RunWall } from '@/components/app/habits/run-wall'
import { HabitRow } from '@/components/app/habits/habit-row'
import { StandingLedger } from '@/components/app/habits/standing-ledger'
import { YearSheet } from '@/components/app/habits/year-sheet'
import { CreateHabitDialog } from '@/components/app/habits/create-habit-dialog'
import { HabitsEmptyState } from '@/components/app/habits/habits-empty-state'
import { HabitsPageSkeleton } from '@/components/app/habits/habits-page-skeleton'

export const Route = createFileRoute('/(app)/habits/')({
  loader: async () => {},
  pendingComponent: HabitsPageSkeleton,
  component: HabitsPage,
})

const RISE = { duration: 0.42, ease: [0.22, 1, 0.36, 1] } as const

function HabitsPage() {
  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
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

  const doneToday = habits.filter((h) => h.completedToday).length
  const totalHabits = habits.length
  const totalXP = habits.reduce((sum, h) => sum + h.xp, 0)
  const totalEarned = habits.reduce((sum, h) => sum + h.earnedXp, 0)
  const totalDecay = habits.reduce((sum, h) => sum + h.decayXp, 0)
  const decayingHabits = habits.filter(isDecaying)
  const run = computeRun(activityData, today)
  const marksThisYear = Object.values(activityData).reduce((s, n) => s + n, 0)

  const weeklyPossible = totalHabits * 7
  const weeklyRate =
    weeklyPossible > 0
      ? Math.round((weekCompletions / weeklyPossible) * 100)
      : 0

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col p-4 sm:p-6">
      <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
        <div className="flex min-w-0 items-center gap-4">
          <BackButton />
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Habits
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {totalHabits === 0
                ? 'One mark a day is the whole method.'
                : doneToday === totalHabits
                  ? 'All marked. The day is closed.'
                  : `${totalHabits - doneToday} left to mark today`}
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <CreateHabitDialog />
        </div>
      </header>

      {totalHabits === 0 ? (
        <HabitsEmptyState />
      ) : (
        <div className="w-full flex-1 space-y-6 pb-8">
          <RunWall
            run={run}
            today={today}
            doneToday={doneToday}
            totalHabits={totalHabits}
          />

          <div className="grid gap-6 lg:grid-cols-12">
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...RISE, delay: 0.06 }}
              className="lg:col-span-8"
              aria-label="Today's habits"
            >
              <div className="flex items-baseline justify-between border-b border-hairline-strong pb-2">
                <h2 className="label-meta text-muted-foreground">Today</h2>
                <span
                  data-numeric
                  className="font-mono text-[11px] font-semibold text-muted-foreground"
                >
                  {doneToday}/{totalHabits}
                </span>
              </div>

              <ul>
                <AnimatePresence mode="popLayout">
                  {habits.map((habit, i) => (
                    <HabitRow
                      key={habit._id}
                      habit={habit}
                      index={i}
                      today={today}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>

            <div className="lg:col-span-4">
              <StandingLedger
                doneToday={doneToday}
                totalHabits={totalHabits}
                weeklyRate={weeklyRate}
                weekCompletions={weekCompletions}
                totalXP={totalXP}
                totalEarned={totalEarned}
                totalDecay={totalDecay}
                decayingHabits={decayingHabits}
              />
            </div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...RISE, delay: 0.12 }}
            aria-label="The last twelve months"
          >
            <div className="flex items-baseline justify-between border-b border-hairline-strong pb-2">
              <h2 className="label-meta text-muted-foreground">
                Last 12 months
              </h2>
              <span
                data-numeric
                className="font-mono text-[11px] font-semibold text-muted-foreground"
              >
                {marksThisYear.toLocaleString()} marks
              </span>
            </div>
            <div className="pt-3">
              <YearSheet
                activityData={activityData}
                totalHabits={totalHabits}
              />
            </div>
          </motion.section>
        </div>
      )}
    </div>
  )
}
