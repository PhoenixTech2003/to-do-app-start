import { useState } from 'react'
import { addHours, format, startOfHour } from 'date-fns'
import { Bell, BellOff, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import {
  describeTodoReminder,
  todoReminderPresets,
} from 'convex/notifications/reminderTimes'
import type { Todo } from '@/types/global'
import { useLocalMutation } from '@/state/hooks'
import { Button } from '@/components/ui/button'
import { DateLeaf } from '@/components/app/todos/date-leaf'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

/**
 * A todo's push reminder. It is set here like any other field and synced, but
 * only the mobile app receives the notification.
 */
export function TodoReminderPicker({ todo }: { todo: Todo }) {
  const setReminder = useLocalMutation('setTodoReminder')
  const [open, setOpen] = useState(false)
  const current = todo.reminderAt
  const [custom, setCustom] = useState(() =>
    current
      ? new Date(current)
      : todo.dueDate
        ? new Date(`${todo.dueDate}T09:00`)
        : addHours(startOfHour(new Date()), 1),
  )
  const customAt = custom.getTime()

  function set(at: number | null) {
    setReminder({ todoId: todo._id, reminderAt: at })
      .then(() => {
        setOpen(false)
        toast.success(
          at
            ? `Reminder set for ${describeTodoReminder(at)}`
            : 'Reminder turned off',
        )
      })
      .catch((error: Error) => toast.error(error.message))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-sm text-left transition-colors hover:text-foreground',
            current ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          <Bell
            className={cn('size-3.5', current && 'text-primary')}
            aria-hidden
          />
          {current ? describeTodoReminder(current) : 'Add a reminder'}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 overflow-hidden p-0">
        <div className="space-y-1 p-2">
          {todoReminderPresets(todo.dueDate, todo.dueTime).map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => set(preset.at)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                preset.at === current && 'text-primary',
              )}
            >
              {preset.label}
              <span
                data-numeric
                className="font-mono text-[11px] text-muted-foreground"
              >
                {format(preset.at, 'EEE HH:mm')}
              </span>
            </button>
          ))}
        </div>
        {/* The same month sheet and time rail every date is picked on. */}
        <div className="border-t border-hairline bg-surface-sunken/60">
          <span className="label-meta block px-3 pt-2.5 text-muted-foreground">
            Or pick a moment
          </span>
          <DateLeaf value={custom} onChange={setCustom} />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-hairline px-3 py-2.5">
          {current ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => set(null)}
            >
              <BellOff className="size-3.5" />
              Turn off
            </Button>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            disabled={customAt <= Date.now()}
            onClick={() => set(customAt)}
          >
            Set {format(custom, 'd MMM HH:mm')}
          </Button>
        </div>
        <p className="flex items-center gap-1.5 border-t border-hairline px-3 py-2 text-[11px] text-muted-foreground">
          <Smartphone className="size-3" aria-hidden />
          Delivered as a push notification to the mobile app.
        </p>
      </PopoverContent>
    </Popover>
  )
}
