import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { formatInTimeZone } from 'date-fns-tz'
import { setHours, setMinutes } from 'date-fns'
import {
  Band,
  EntryMark,
  PRIORITY_SPINE,
  PriorityMargin,
  ReminderBand,
  WhenBands,
  reminderAtFor,
} from './entry-fields'
import {
  DateAwareTitleInput,
  NaturalDateSuggestion,
} from './date-aware-title-input'
import { ListSelect } from './list-select'
import {
  EntryLine,
  LineError,
  NoteInput,
  SlipActions,
  submitOnModEnter,
} from './entry-slip'
import type z from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import type { Priority } from './entry-fields'
import type { ReminderChoice } from 'convex/notifications/reminderTimes'
import { useLocalMutation } from '@/state/hooks'
import { createTodoFormSchema } from '@/validation/create-todo-form-schema'
import { useNaturalDueDate } from '@/hooks/use-natural-due-date'

interface CreateTodoFormProps {
  listId?: Id<'lists'>
  /** The day the slip was opened on, e.g. from the calendar. */
  defaultDue?: Date
  /** Show a List band so the entry can be filed anywhere, not just here. */
  chooseList?: boolean
  setCreateDialogIsOpen: (value: boolean) => void
}

export function CreateTodoForm({
  listId,
  defaultDue,
  chooseList = false,
  setCreateDialogIsOpen,
}: CreateTodoFormProps) {
  const addTodo = useLocalMutation('createTodo')

  const defaultValues: z.input<typeof createTodoFormSchema> = {
    title: '',
    priority: 'none',
    dueDate: defaultDue,
  }

  const [reminder, setReminder] = useState<ReminderChoice | null>(null)
  const [destination, setDestination] = useState<Id<'lists'> | undefined>(
    listId,
  )
  const form = useForm({
    defaultValues,

    validators: {
      onSubmit: createTodoFormSchema,
    },
    onSubmit: (formData) => {
      const title = cleanTitle(formData.value.title)
      const usersTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

      const addTodoPromise = addTodo({
        listId: destination,
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
      toast.promise(addTodoPromise, {
        loading: 'Adding your todo…',
        success: () => {
          setCreateDialogIsOpen(false)
          return `"${title}" added`
        },
        error: 'The todo could not be added. Try again.',
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
  } = useNaturalDueDate((date, found) => {
    // On a slip opened on a day, "at 9" keeps that day; dropping the phrase
    // goes back to it.
    const due =
      defaultDue && (!date || !found?.hasDay)
        ? date
          ? setMinutes(setHours(defaultDue, date.getHours()), date.getMinutes())
          : defaultDue
        : date
    form.setFieldValue('dueDate', due)
    // A rule with nothing to repeat from is no rule at all.
    if (!due) form.setFieldValue('recurrence', undefined)
  })

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
        {/* ── The line being written ──
          The margin takes the priority you choose and the gutter shows the
          mark this entry will carry, so the form reads as the row it becomes. */}
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

        {chooseList && (
          <Band label="List">
            <ListSelect value={destination} onChange={setDestination} />
          </Band>
        )}
      </div>

      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.isSubmitSuccessful]}
        children={([isSubmitting, isSubmitSuccessful]) => (
          <SlipActions
            submitLabel="Add todo"
            hint="to add"
            onCancel={() => setCreateDialogIsOpen(false)}
            disabled={isSubmitting && !isSubmitSuccessful}
          />
        )}
      />
    </form>
  )
}
