import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { format, parse } from 'date-fns'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import { useLocalMutation, useLocalQuery } from '@/state/hooks'
import { DateAwareTitleInput } from '@/components/app/todos/date-aware-title-input'
import { TimeRail } from '@/components/app/todos/date-leaf'
import { useNaturalDueDate } from '@/hooks/use-natural-due-date'
import { titleWithoutNaturalDate } from '@/lib/natural-date'
import { dateKey } from '@/lib/calendar-month'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DEFAULT_TIME = '00:00'

const calendarTaskSchema = z.object({
  title: z.string().trim().min(1, 'Enter a task title'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a time'),
  destination: z.string(),
  priority: z.enum(['high', 'medium', 'low', 'none']),
})

interface CreateCalendarTaskDialogProps {
  date: Date
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateCalendarTaskDialog({
  date,
  open,
  onOpenChange,
}: CreateCalendarTaskDialogProps) {
  const addTodo = useLocalMutation('createTodo')
  const lists = useLocalQuery('GetUserListsForMove', {
    searchTerm: undefined,
  })

  const workspaces = new Map<string, typeof lists>()
  for (const list of lists) {
    const workspaceLists = workspaces.get(list.workspaceTitle) ?? []
    workspaceLists.push(list)
    workspaces.set(list.workspaceTitle, workspaceLists)
  }

  // A day named in the title ("tomorrow", "friday") moves the task off `date`.
  const [writtenDay, setWrittenDay] = useState<Date>()
  const day = writtenDay ?? date

  const form = useForm({
    defaultValues: {
      title: '',
      time: DEFAULT_TIME,
      destination: 'inbox',
      priority: 'none' as 'high' | 'medium' | 'low' | 'none',
    },
    validators: {
      onSubmit: calendarTaskSchema,
    },
    onSubmit: ({ value }) => {
      const title = titleWithoutNaturalDate(value.title)
      const dueDate = parse(
        `${dateKey(day)} ${value.time}`,
        'yyyy-MM-dd HH:mm',
        day,
      )
      const createPromise = addTodo({
        listId:
          value.destination === 'inbox'
            ? undefined
            : (value.destination as Id<'lists'>),
        title,
        priority: value.priority,
        dueDate: format(dueDate, "yyyy-MM-dd'T'HH:mm"),
      })

      toast.promise(createPromise, {
        loading: 'Adding task to the day…',
        success: () => {
          onOpenChange(false)
          form.reset()
          readTitle('')
          return `"${title}" added to ${format(day, 'd MMMM')}`
        },
        error: 'Task could not be added. Try again.',
      })

      return createPromise
    },
  })

  const { match, readTitle, markManual } = useNaturalDueDate((due, found) => {
    setWrittenDay(found?.hasDay ? due : undefined)
    form.setFieldValue('time', due ? format(due, 'HH:mm') : DEFAULT_TIME)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            Schedule it for {format(day, 'EEEE, d MMMM yyyy')} and choose where
            it belongs.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            form.handleSubmit()
          }}
        >
          <form.Field
            name="title"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Task</FieldLabel>
                  {/* The same well as an Input, around the title line that
                      marks the date phrase it reads. */}
                  <div
                    data-invalid={isInvalid}
                    className="flex h-9 items-center rounded-md border border-hairline-strong bg-surface-sunken px-3 shadow-inset-well transition-[box-shadow,border-color] duration-[var(--dur-2)] ease-[var(--ease-standard)] focus-within:border-ring focus-within:bg-card data-[invalid=true]:border-destructive data-[invalid=true]:ring-2 data-[invalid=true]:ring-destructive/25"
                  >
                    <div className="min-w-0 flex-1">
                      <DateAwareTitleInput
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={(value) => {
                          field.handleChange(value)
                          readTitle(value)
                        }}
                        match={match}
                        aria-invalid={isInvalid}
                        placeholder="Prepare the client notes tomorrow at 9"
                        autoFocus
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          {/* The day is already chosen — only the hour is in question, and it
              is picked from the same rail as everywhere else. */}
          <form.Field
            name="time"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Due time</FieldLabel>
                  <div className="overflow-hidden rounded-md border border-hairline bg-surface-sunken/60">
                    <TimeRail
                      value={field.state.value}
                      onChange={(time) => {
                        markManual()
                        field.handleChange(time)
                      }}
                      label="At"
                    />
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />

          <form.Field
            name="priority"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Priority</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(
                      value as 'high' | 'medium' | 'low' | 'none',
                    )
                  }
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <form.Field
            name="destination"
            children={(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Workspace / list</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={field.handleChange}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inbox">Inbox</SelectItem>
                    {Array.from(workspaces.entries()).map(
                      ([workspace, workspaceLists]) => (
                        <SelectGroup key={workspace}>
                          <SelectLabel className="label-meta">
                            {workspace}
                          </SelectLabel>
                          {workspaceLists.map((list) => (
                            <SelectItem key={list._id} value={list._id}>
                              {list.title}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting}>
                  Add to day
                </Button>
              )}
            />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
