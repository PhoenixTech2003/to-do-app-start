import { useState } from 'react'
import { format } from 'date-fns'
import { Bell, BellOff, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import {
  describeTodoReminder,
  todoReminderPresets,
} from 'convex/notifications/reminderTimes'
import type { Todo } from '@/types/global'
import { useLocalMutation } from '@/state/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    format(
      current ??
        (todo.dueDate ? new Date(`${todo.dueDate}T09:00`) : new Date()),
      "yyyy-MM-dd'T'HH:mm",
    ),
  )
  const customAt = custom ? new Date(custom).getTime() : NaN

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
      <PopoverContent align="start" className="w-72 space-y-3">
        <div className="space-y-1">
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
        <div className="space-y-2 border-t border-hairline pt-3">
          <label
            className="label-meta text-muted-foreground"
            htmlFor="reminder-at"
          >
            Or pick a moment
          </label>
          <div className="flex gap-2">
            <Input
              id="reminder-at"
              type="datetime-local"
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              disabled={!Number.isFinite(customAt) || customAt <= Date.now()}
              onClick={() => set(customAt)}
            >
              Set
            </Button>
          </div>
        </div>
        {current && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => set(null)}
          >
            <BellOff className="size-3.5" />
            Turn off
          </Button>
        )}
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Smartphone className="size-3" aria-hidden />
          Delivered as a push notification to the mobile app.
        </p>
      </PopoverContent>
    </Popover>
  )
}
