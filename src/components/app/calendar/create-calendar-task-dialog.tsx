import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { format, parse } from 'date-fns'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { z } from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import { TimeRail } from '@/components/app/todos/date-leaf'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const addTodo = useConvexMutation(api.todos.mutations.createTodo)
  const { data: lists = [] } = useQuery(
    convexQuery(api.workspace.queries.GetUserListsForMove, {
      searchTerm: undefined,
    }),
  )

  const workspaces = new Map<string, typeof lists>()
  for (const list of lists) {
    const workspaceLists = workspaces.get(list.workspaceTitle) ?? []
    workspaceLists.push(list)
    workspaces.set(list.workspaceTitle, workspaceLists)
  }

  const form = useForm({
    defaultValues: {
      title: '',
      time: '09:00',
      destination: 'inbox',
      priority: 'none' as 'high' | 'medium' | 'low' | 'none',
    },
    validators: {
      onSubmit: calendarTaskSchema,
    },
    onSubmit: ({ value }) => {
      const dueDate = parse(
        `${dateKey(date)} ${value.time}`,
        'yyyy-MM-dd HH:mm',
        date,
      )
      const createPromise = addTodo({
        listId:
          value.destination === 'inbox'
            ? undefined
            : (value.destination as Id<'lists'>),
        title: value.title.trim(),
        priority: value.priority,
        dueDate: format(dueDate, "yyyy-MM-dd'T'HH:mm"),
        scheduledFuntionRunTime: dueDate.getTime() + 60_000,
      })

      toast.promise(createPromise, {
        loading: 'Adding task to the day…',
        success: () => {
          onOpenChange(false)
          form.reset()
          return `"${value.title.trim()}" added to ${format(date, 'd MMMM')}`
        },
        error: 'Task could not be added. Try again.',
      })

      return createPromise
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a task</DialogTitle>
          <DialogDescription>
            Schedule it for {format(date, 'EEEE, d MMMM yyyy')} and choose where
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
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Prepare the client notes"
                    autoFocus
                    autoComplete="off"
                  />
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
                      onChange={field.handleChange}
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
