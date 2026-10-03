import { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { format, subDays } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { isDecaying } from 'convex/habits/xp'
import { CATEGORY_FILL, CATEGORY_META } from './habit-helpers'
import { HabitDetailSheet } from './habit-detail-sheet'
import { MarkSlot } from './tally'
import type { HabitWithStatus } from '@/types/global'
import { useLocalMutation, useLocalQuery } from '@/state/hooks'
import { cn } from '@/lib/utils'

/**
 * A habit is a ruled line in the record, not a card: name on the left, a
 * leader carrying the eye across, its standing on the right. The only control
 * is the slot where today's mark goes.
 */
export function HabitRow({
  habit,
  index,
  today,
}: {
  habit: HabitWithStatus
  index: number
  today: string
}) {
  const toggle = useLocalMutation('toggleHabitCompletion')
  const deleteHabit = useLocalMutation('deleteHabit')
  const completedToday = habit.completedToday
  const [sheetOpen, setSheetOpen] = useState(false)
  const meta = CATEGORY_META[habit.category]
  const Icon = meta.icon
  const decaying = isDecaying(habit)
  const missedUnit = habit.frequency === 'weekly' ? 'w' : 'd'

  function handleToggle() {
    void toggle({ habitId: habit._id, date: today, completed: !completedToday })
  }

  function handleDelete() {
    void deleteHabit({ habitId: habit._id })
    toast.success('Habit removed on this device')
  }

  return (
    <>
      <motion.li
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.24,
          delay: index * 0.035,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="group/row relative flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-hairline py-2.5 pr-1 transition-colors duration-200 last:border-b-0 hover:bg-accent/45 sm:flex-nowrap sm:gap-4"
      >
        <button
          onClick={handleToggle}
          aria-pressed={completedToday}
          className="-my-1 flex shrink-0 items-center justify-center rounded-sm px-2 py-1 transition-transform duration-100 active:translate-y-px disabled:opacity-60"
          aria-label={
            completedToday
              ? `Unmark ${habit.title} for today`
              : `Mark ${habit.title} done today`
          }
        >
          <MarkSlot marked={completedToday} />
        </button>

        <button
          onClick={() => setSheetOpen(true)}
          className="flex min-w-0 flex-1 items-baseline gap-2.5 rounded-sm text-left sm:gap-3"
          aria-label={`Open ${habit.title}`}
        >
          <span
            className={cn(
              'shrink-0 truncate text-[15px] leading-snug font-medium transition-colors duration-200',
              completedToday
                ? 'text-muted-foreground line-through decoration-primary/70 decoration-[1.5px]'
                : 'text-foreground',
            )}
          >
            {habit.title}
          </span>

          {/* Leader: carries the eye from the name to its standing. */}
          <span
            aria-hidden="true"
            className="hidden min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-hairline-strong/60 sm:block"
          />

          <span className="hidden shrink-0 items-center gap-1.5 md:flex">
            <Icon className={cn('size-3 opacity-70', meta.accent)} />
            <span className="label-meta text-muted-foreground/70">
              {meta.label}
            </span>
          </span>
        </button>

        <WeekStrip habit={habit} today={today} />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Standing
            streak={habit.currentStreak}
            missed={habit.missedStreak}
            unit={missedUnit}
            decaying={decaying}
            graceLeft={habit.graceLeft}
            decayXp={habit.decayXp}
          />

          <button
            onClick={handleDelete}
            className="rounded-sm p-1.5 text-muted-foreground/0 transition-colors duration-200 group-hover/row:text-muted-foreground/45 hover:!text-destructive focus-visible:text-destructive"
            aria-label={`Remove ${habit.title}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </motion.li>

      <HabitDetailSheet
        habit={{ ...habit, completedToday }}
        today={today}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}

/**
 * The right-hand figure. A live run counts up in ink; a habit that has spent
 * its grace counts down in red. A habit that is simply new says nothing.
 */
function Standing({
  streak,
  missed,
  unit,
  decaying,
  graceLeft,
  decayXp,
}: {
  streak: number
  missed: number
  unit: string
  decaying: boolean
  graceLeft: number
  decayXp: number
}) {
  if (streak > 0) {
    return (
      <span
        data-numeric
        title={`${streak} in a row`}
        className={cn(
          'font-mono text-xs font-semibold tabular-nums',
          streak >= 7 ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {streak}
        <span className="font-normal text-muted-foreground/60">{unit}</span>
      </span>
    )
  }

  if (missed > 0) {
    return (
      <span
        data-numeric
        title={
          decaying
            ? `Draining ${decayXp} XP — ${missed} missed`
            : `${graceLeft} more missed and XP starts draining`
        }
        className={cn(
          'font-mono text-xs font-semibold tabular-nums',
          decaying ? 'text-destructive' : 'text-muted-foreground/60',
        )}
      >
        −{missed}
        <span className="font-normal opacity-60">{unit}</span>
      </span>
    )
  }

  return <span className="w-6" aria-hidden="true" />
}

/**
 * The last seven days, oldest first. Any of them can be marked or unmarked —
 * a day missed in the app is often a day done but not recorded.
 */
function WeekStrip({
  habit,
  today,
}: {
  habit: HabitWithStatus
  today: string
}) {
  const toggle = useLocalMutation('toggleHabitCompletion')
  const anchor = new Date(`${today}T12:00:00`)
  const days = Array.from({ length: 7 }, (_, i) => subDays(anchor, 6 - i))
  const marked = useLocalQuery('getHabitCompletions', {
    habitId: habit._id,
    startDate: format(days[0], 'yyyy-MM-dd'),
    endDate: today,
  })

  return (
    <div
      role="group"
      aria-label={`${habit.title}, last seven days`}
      className="order-last flex w-full gap-1 pl-10 sm:order-none sm:w-auto sm:pl-0"
    >
      {days.map((day) => {
        const key = format(day, 'yyyy-MM-dd')
        const done = marked.includes(key)
        const isToday = key === today
        return (
          <button
            key={key}
            type="button"
            aria-pressed={done}
            aria-label={`${format(day, 'EEEE d MMMM')}: ${done ? 'marked' : 'not marked'}`}
            title={format(day, 'EEE d MMM')}
            onClick={() =>
              void toggle({ habitId: habit._id, date: key, completed: !done })
            }
            className="group/day flex w-6 flex-col items-center gap-1 rounded-sm py-0.5 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span
              className={cn(
                'h-1.5 w-full rounded-full transition-colors duration-200',
                done
                  ? CATEGORY_FILL[habit.category]
                  : 'bg-surface-sunken group-hover/day:bg-muted-foreground/25',
              )}
            />
            <span
              className={cn(
                'font-mono text-[9px] leading-none',
                isToday
                  ? 'font-bold text-foreground'
                  : 'text-muted-foreground/70',
              )}
            >
              {format(day, 'EEEEE')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
