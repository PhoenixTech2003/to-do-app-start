import { useState } from 'react'
import { Bell, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { describeHabitReminder } from 'convex/notifications/reminderTimes'
import type { HabitWithStatus } from '@/types/global'
import { useLocalMutation } from '@/state/hooks'
import { Button } from '@/components/ui/button'
import { TimePicker } from '@/components/ui/time-picker'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

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
            className={cn(
              'label-meta rounded-sm border px-2.5 py-1 transition-colors',
              enabled === option.on
                ? 'border-foreground bg-foreground text-background'
                : 'border-hairline text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {enabled && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <TimePicker value={time} onChange={setTime} />
            <div className="flex gap-1" role="group" aria-label="Days">
              {WEEKDAYS.map((label, day) => {
                const on = days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    aria-label={WEEKDAY_NAMES[day]}
                    onClick={() =>
                      setDays(
                        on ? days.filter((d) => d !== day) : [...days, day],
                      )
                    }
                    className={cn(
                      'size-7 rounded-full border text-[11px] font-semibold transition-colors',
                      on
                        ? 'border-foreground bg-foreground text-background'
                        : 'border-input hover:bg-accent',
                    )}
                  >
                    {label}
                  </button>
                )
              })}
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
