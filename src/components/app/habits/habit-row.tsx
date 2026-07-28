import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Trash2 } from 'lucide-react'
import { isDecaying } from 'convex/habits/xp'
import { CATEGORY_META } from './habit-helpers'
import { HabitDetailSheet } from './habit-detail-sheet'
import { MarkSlot } from './tally'
import type { HabitWithStatus } from '@/types/global'
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
  const toggle = useMutation(api.habits.mutations.toggleHabitCompletion)
  const deleteHabit = useMutation(api.habits.mutations.deleteHabit)
  const [isToggling, setIsToggling] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const meta = CATEGORY_META[habit.category]
  const Icon = meta.icon
  const decaying = isDecaying(habit)
  const missedUnit = habit.frequency === 'weekly' ? 'w' : 'd'

  function handleToggle() {
    if (isToggling) return
    setIsToggling(true)
    toggle({ habitId: habit._id, date: today })
      .catch(() => toast.error('Could not save that mark. Try again.'))
      .finally(() => setIsToggling(false))
  }

  function handleDelete() {
    const promise = deleteHabit({ habitId: habit._id })
    toast.promise(promise, {
      loading: 'Removing habit…',
      success: 'Habit removed',
      error: 'Could not remove that habit. Try again.',
    })
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
        className="group/row relative flex items-center gap-3 border-b border-hairline py-2.5 pr-1 transition-colors duration-200 last:border-b-0 hover:bg-accent/45 sm:gap-4"
      >
        <button
          onClick={handleToggle}
          disabled={isToggling}
          aria-pressed={habit.completedToday}
          className="-my-1 flex shrink-0 items-center justify-center rounded-sm px-2 py-1 transition-transform duration-100 active:translate-y-px disabled:opacity-60"
          aria-label={
            habit.completedToday
              ? `Unmark ${habit.title} for today`
              : `Mark ${habit.title} done today`
          }
        >
          <MarkSlot marked={habit.completedToday} />
        </button>

        <button
          onClick={() => setSheetOpen(true)}
          className="flex min-w-0 flex-1 items-baseline gap-2.5 rounded-sm text-left sm:gap-3"
          aria-label={`Open ${habit.title}`}
        >
          <span
            className={cn(
              'shrink-0 truncate text-[15px] leading-snug font-medium transition-colors duration-200',
              habit.completedToday
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
        habit={habit}
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
