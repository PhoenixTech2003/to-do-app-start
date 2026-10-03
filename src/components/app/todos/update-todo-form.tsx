import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { format, parse } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import {
  Band,
  EntryMark,
  PRIORITY_SPINE,
  PriorityMargin,
  ReminderBand,
  WhenBands,
  reminderAtFor,
  reminderChoiceFor,
} from './entry-fields'
import {
  DateAwareTitleInput,
  NaturalDateSuggestion,
} from './date-aware-title-input'
import {
  EntryLine,
  LineError,
  NoteInput,
  SlipActions,
  submitOnModEnter,
} from './entry-slip'
import type z from 'zod'
import type { Priority } from './entry-fields'
import type { ReminderChoice } from 'convex/notifications/reminderTimes'
import type { Todo } from '@/types/global'
import { useLocalMutation } from '@/state/hooks'
import { createTodoFormSchema } from '@/validation/create-todo-form-schema'
import { useNaturalDueDate } from '@/hooks/use-natural-due-date'

interface UpdateTodoFormProps {
  todo: Todo
  setUpdateDialogIsOpen: (value: boolean) => void
}

export function UpdateTodoForm({
  todo,
  setUpdateDialogIsOpen,
}: UpdateTodoFormProps) {
  const updateTodo = useLocalMutation('updateTodo')
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

  const [reminder, setReminder] = useState<ReminderChoice | null>(
    reminderChoiceFor(todo),
  )
  const form = useForm({
    defaultValues,

    validators: {
      onSubmit: createTodoFormSchema,
    },
    onSubmit: (formData) => {
      const title = cleanTitle(formData.value.title)
      const usersTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

      const updateTodoPromise = updateTodo({
        todoId: todo._id,
        title,
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
        reminderAt: reminderAtFor(reminder, formData.value.dueDate),
      })
      toast.promise(updateTodoPromise, {
        loading: 'Saving your changes…',
        success: () => {
          setUpdateDialogIsOpen(false)
          return `"${title}" updated`
        },
        error: 'The todo could not be updated. Try again.',
      })
    },
  })

  const {
    match: naturalDateMatch,
    suggesting,
    readTitle,
    markManual,
    accept,
    dismiss,
    cleanTitle,
  } = useNaturalDueDate(
    (date) => {
      form.setFieldValue('dueDate', date)
      // A rule with nothing to repeat from is no rule at all.
      if (!date) form.setFieldValue('recurrence', undefined)
    },
    { title: todo.title, dueDate: parsedDate },
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      onKeyDown={submitOnModEnter(() => form.handleSubmit())}
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
            <EntryLine
              spine={PRIORITY_SPINE[priority as Priority]}
              mark={<EntryMark date={dueDate} />}
            >
              <form.Field
                name="title"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <>
                      <DateAwareTitleInput
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onValueChange={(value) => {
                          field.handleChange(value)
                          readTitle(value)
                        }}
                        match={naturalDateMatch}
                        aria-invalid={isInvalid}
                        aria-label="Title"
                        placeholder="Write the next line"
                        autoComplete="off"
                        autoFocus
                      />
                      {isInvalid && (
                        <LineError>A todo needs a title.</LineError>
                      )}
                      {suggesting && naturalDateMatch && (
                        <NaturalDateSuggestion
                          match={naturalDateMatch}
                          onAccept={accept}
                          onDismiss={dismiss}
                        />
                      )}
                    </>
                  )
                }}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <NoteInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ''}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                )}
              />
            </EntryLine>
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
              onDueChange={(date) => {
                markManual()
                form.setFieldValue('dueDate', date)
              }}
              recurrence={recurrence}
              onRecurrenceChange={(rule) =>
                form.setFieldValue('recurrence', rule)
              }
            />
          )}
        />

        <form.Subscribe
          selector={(state) => state.values.dueDate}
          children={(dueDate) => (
            <ReminderBand
              due={dueDate}
              value={reminder}
              onChange={setReminder}
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

      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.isSubmitSuccessful]}
        children={([isSubmitting, isSubmitSuccessful]) => (
          <SlipActions
            submitLabel="Save changes"
            hint="to save"
            onCancel={() => setUpdateDialogIsOpen(false)}
            disabled={isSubmitting && !isSubmitSuccessful}
          />
        )}
      />
    </form>
  )
}
