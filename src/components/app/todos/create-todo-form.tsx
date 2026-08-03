import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { formatInTimeZone } from 'date-fns-tz'
import {
  Band,
  EntryMark,
  PRIORITY_SPINE,
  PriorityMargin,
  WhenBands,
} from './entry-fields'
import type z from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import type { Priority } from './entry-fields'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { createTodoFormSchema } from '@/validation/create-todo-form-schema'

interface CreateTodoFormProps {
  listId?: Id<'lists'>
  setCreateDialogIsOpen: (value: boolean) => void
}

export function CreateTodoForm({
  listId,
  setCreateDialogIsOpen,
}: CreateTodoFormProps) {
  const addTodo = useConvexMutation(api.todos.mutations.createTodo)

  const defaultValues: z.input<typeof createTodoFormSchema> = {
    title: '',
    priority: 'none',
  }

  const form = useForm({
    defaultValues,

    validators: {
      onSubmit: createTodoFormSchema,
    },
    onSubmit: (formData) => {
      const usersTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const scheduledFunctionRunTime = formData.value.dueDate
        ? formData.value.dueDate.getTime() + 60000
        : undefined
      const addTodoPromise = addTodo({
        listId,
        title: formData.value.title,
        description: formData.value.description,
        dueDate: formData.value.dueDate
          ? formatInTimeZone(
              formData.value.dueDate,
              usersTimeZone,
              "yyyy-MM-dd'T'HH:mm",
            )
          : undefined,
        priority: formData.value.priority,
        recurrence: formData.value.recurrence,
        scheduledFuntionRunTime: scheduledFunctionRunTime,
      })
      toast.promise(addTodoPromise, {
        loading: 'Adding your twodo…',
        success: () => {
          setCreateDialogIsOpen(false)
          return `"${formData.value.title}" added`
        },
        error: 'The twodo could not be added. Try again.',
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      onKeyDown={(e) => {
        // Enter files the entry from the title line; from the note, where a
        // plain Enter is a new paragraph, it takes the modifier.
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          form.handleSubmit()
        }
      }}
    >
      {/* A leaf can make the slip taller than the screen; the bands scroll and
          the actions stay put. */}
      <div className="max-h-[60vh] overflow-y-auto">
        {/* ── The line being written ──
          The margin takes the priority you choose and the gutter shows the
          mark this entry will carry, so the form reads as the row it becomes. */}
        <form.Subscribe
          selector={(state) => ({
            priority: state.values.priority,
            dueDate: state.values.dueDate,
          })}
          children={({ priority, dueDate }) => (
            <div
              className="spine flex items-start gap-3 py-3.5 pr-3 pl-4"
              style={
                {
                  '--spine': PRIORITY_SPINE[priority as Priority],
                } as React.CSSProperties
              }
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <form.Field
                  name="title"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <>
                        <input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          aria-label="Title"
                          placeholder="Write the next line"
                          autoComplete="off"
                          autoFocus
                          className="w-full bg-transparent text-[15px] leading-snug font-medium placeholder:text-muted-foreground/50 focus-visible:outline-none"
                        />
                        {isInvalid && (
                          <p className="font-mono text-[11px] text-destructive">
                            A twodo needs a title.
                          </p>
                        )}
                      </>
                    )
                  }}
                />

                <form.Field
                  name="description"
                  children={(field) => (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-label="Note"
                      placeholder="Add a note"
                      rows={2}
                      className="w-full resize-none bg-transparent text-xs leading-relaxed text-muted-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none"
                    />
                  )}
                />
              </div>

              <EntryMark date={dueDate} />
            </div>
          )}
        />

        <form.Subscribe
          selector={(state) => ({
            dueDate: state.values.dueDate,
            recurrence: state.values.recurrence,
          })}
          children={({ dueDate, recurrence }) => (
            <WhenBands
              due={dueDate}
              onDueChange={(date) => form.setFieldValue('dueDate', date)}
              recurrence={recurrence}
              onRecurrenceChange={(rule) =>
                form.setFieldValue('recurrence', rule)
              }
            />
          )}
        />

        <form.Field
          name="priority"
          children={(field) => (
            <Band label="Priority">
              <PriorityMargin
                value={field.state.value}
                onChange={(priority) => field.handleChange(priority)}
              />
            </Band>
          )}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline bg-surface-sunken px-4 py-3">
        <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          <Kbd>⏎</Kbd> to add
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCreateDialogIsOpen(false)}
          >
            Cancel
          </Button>
          <form.Subscribe
            selector={(state) => [state.isSubmitting, state.isSubmitSuccessful]}
            children={([isSubmitting, isSubmitSuccessful]) => (
              <Button
                size="sm"
                disabled={isSubmitting && !isSubmitSuccessful}
                type="submit"
              >
                Add twodo
              </Button>
            )}
          />
        </div>
      </div>
    </form>
  )
}
