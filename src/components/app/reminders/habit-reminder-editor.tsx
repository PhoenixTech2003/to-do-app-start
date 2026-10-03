import { useState } from 'react'
import { Bell, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { describeHabitReminder } from 'convex/notifications/reminderTimes'
import type { HabitWithStatus } from '@/types/global'
import { useLocalMutation } from '@/state/hooks'
import { Button } from '@/components/ui/button'
import { TimeRail } from '@/components/app/todos/date-leaf'
import { WeekdayChips, chipClasses } from '@/components/app/todos/entry-fields'
import { cn } from '@/lib/utils'

/**
 * A habit's push reminder: a time, and optionally the weekdays it applies to.
 * Synced like any other field; only the mobile app is notified.
 */
export function HabitReminderEditor({ habit }: { habit: HabitWithStatus }) {
  const setReminder = useLocalMutation('setHabitReminder')
  const [enabled, setEnabled] = useState(!!habit.reminderTime)
  const [time, setTime] = useState(habit.reminderTime ?? '19:00')
  const [days, setDays] = useState<Array<number>>(habit.reminderDays ?? [])

  function save(reminderTime: string | null) {
    setReminder({
      habitId: habit._id,
      reminderTime,
      reminderDays: days.length ? days : null,
    })
      .then(() =>
        toast.success(
          reminderTime
            ? describeHabitReminder(reminderTime, days)
            : 'Reminder turned off',
        ),
      )
      .catch((error: Error) => toast.error(error.message))
  }

  return (
    <section className="space-y-3 rounded-lg border border-hairline-strong bg-card px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="label-meta flex items-center gap-1.5 text-muted-foreground">
          <Bell
            className={cn('size-3', habit.reminderTime && 'text-primary')}
            aria-hidden
          />
          Reminder
        </span>
        <span className="text-xs text-muted-foreground">
          {describeHabitReminder(habit.reminderTime, habit.reminderDays)}
        </span>
      </div>
      <div className="flex gap-1.5" role="group" aria-label="Reminder">
        {[
          { label: 'Off', on: false },
          { label: 'On', on: true },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={enabled === option.on}
            onClick={() => setEnabled(option.on)}
            className={chipClasses(enabled === option.on)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {enabled && (
        <>
          {/* The time rail and day toggles the entry slip uses. */}
          <div className="overflow-hidden rounded-md border border-hairline bg-surface-sunken/60 [&>div:first-child]:border-t-0">
            <TimeRail value={time} onChange={setTime} />
            <div className="flex items-center gap-1.5 border-t border-hairline px-3 py-2.5">
              <span className="label-meta w-8 shrink-0 text-muted-foreground">
                On
              </span>
              <WeekdayChips
                value={days}
                onToggle={(day) =>
                  setDays(
                    days.includes(day)
                      ? days.filter((d) => d !== day)
                      : [...days, day],
                  )
                }
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {describeHabitReminder(time, days)}. No days picked means every day.{' '}
            {habit.frequency === 'weekly'
              ? 'Skipped once it is marked this week.'
              : 'Skipped on days it is already marked.'}
          </p>
        </>
      )}
      <Button size="sm" onClick={() => save(enabled ? time : null)}>
        {enabled ? 'Save reminder' : 'Save — no reminder'}
      </Button>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Smartphone className="size-3" aria-hidden />
        Delivered as a push notification to the mobile app.
      </p>
    </section>
  )
}
