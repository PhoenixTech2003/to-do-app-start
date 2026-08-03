import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { format, parse } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import {
  Band,
  EntryMark,
  PRIORITY_SPINE,
  PriorityMargin,
  WhenBands,
} from './entry-fields'
import type z from 'zod'
import type { Priority } from './entry-fields'
import type { Todo } from '@/types/global'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { createTodoFormSchema } from '@/validation/create-todo-form-schema'

interface UpdateTodoFormProps {
  todo: Todo
  setUpdateDialogIsOpen: (value: boolean) => void
}

export function UpdateTodoForm({
  todo,
  setUpdateDialogIsOpen,
}: UpdateTodoFormProps) {
  const updateTodo = useConvexMutation(api.todos.mutations.updateTodo)
  // A todo with no due date stays without one — the picker opens empty rather
  // than silently proposing today.
  const parsedDate = todo.dueDate
    ? parse(
        `${format(todo.dueDate, 'yyyy-MM-dd')} ${todo.dueTime || '00:00'}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      )
    : undefined
  const defaultValues: z.input<typeof createTodoFormSchema> = {
    title: todo.title,
    description: todo.description,
    dueDate: parsedDate,
    recurrence: todo.recurrence,
    priority: todo.priority,
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
      const updateTodoPromise = updateTodo({
        todoId: todo._id,
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
        scheduledFunctionRunTime,
      })
      toast.promise(updateTodoPromise, {
        loading: 'Saving your changes…',
        success: () => {
          setUpdateDialogIsOpen(false)
          return `"${formData.value.title}" updated`
        },
        error: 'The twodo could not be updated. Try again.',
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
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault()
          form.handleSubmit()
        }
      }}
    >
      {/* A leaf can make the slip taller than the screen; the bands scroll and
          the actions stay put. */}
      <div className="max-h-[60vh] overflow-y-auto">
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
          <Kbd>⏎</Kbd> to save
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUpdateDialogIsOpen(false)}
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
                Save changes
              </Button>
            )}
          />
        </div>
      </div>
    </form>
  )
}
