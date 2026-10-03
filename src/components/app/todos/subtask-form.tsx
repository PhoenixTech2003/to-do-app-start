import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { formatInTimeZone } from 'date-fns-tz'
import { isValid, parse } from 'date-fns'
import { toast } from 'sonner'
import {
  EntryMark,
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
import type { Id } from 'convex/_generated/dataModel'
import type { SubTask } from '@/types/global'
import type { ReminderChoice } from 'convex/notifications/reminderTimes'
import { useLocalMutation } from '@/state/hooks'
import { createSubtaskFormSchema } from '@/validation/create-subtask-form-schema'
import { useNaturalDueDate } from '@/hooks/use-natural-due-date'

/**
 * ── Writing a part ──
 *
 * A subtask is written on the same slip as the entry it belongs to: the same
 * ruled bands, the same live gutter, the same date read out of the title as
 * you type. It carries no priority and no repetition — those are properties of
 * the entry above it, and a part inherits its parent's urgency by definition.
 */

type SubtaskFormValues = z.input<typeof createSubtaskFormSchema>

interface SubtaskPayload {
  title: string
  description?: string
  dueDate?: string
  reminderAt: number | null
}

interface SubtaskSlipProps {
  defaultValues: SubtaskFormValues
  defaultReminder?: ReminderChoice | null
  submitLabel: string
  messages: { loading: string; success: string; error: string }
  submit: (payload: SubtaskPayload) => Promise<unknown>
  onClose: () => void
}

function SubtaskSlip({
  defaultValues,
  defaultReminder = null,
  submitLabel,
  messages,
  submit,
  onClose,
}: SubtaskSlipProps) {
  const [reminder, setReminder] = useState(defaultReminder)
  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: createSubtaskFormSchema,
    },
    onSubmit: (formData) => {
      const usersTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const promise = submit({
        title: formData.value.title,
        description: formData.value.description || undefined,
        dueDate: formData.value.dueDate
          ? formatInTimeZone(
              formData.value.dueDate,
              usersTimeZone,
              "yyyy-MM-dd'T'HH:mm",
            )
          : undefined,
        reminderAt: reminderAtFor(reminder, formData.value.dueDate),
      })

      toast.promise(promise, {
        loading: messages.loading,
        success: () => {
          onClose()
          return messages.success
        },
        error: messages.error,
      })
    },
  })

  const { match, suggesting, readTitle, markManual, accept, dismiss } =
    useNaturalDueDate((date) => form.setFieldValue('dueDate', date), {
      title: defaultValues.title,
      dueDate: defaultValues.dueDate,
    })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      onKeyDown={submitOnModEnter(() => form.handleSubmit())}
    >
      <div className="max-h-[60vh] overflow-y-auto">
        <form.Subscribe
          selector={(state) => state.values.dueDate}
          children={(dueDate) => (
            <EntryLine mark={<EntryMark date={dueDate} />}>
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
                        match={match}
                        aria-invalid={isInvalid}
                        aria-label="Title"
                        placeholder="What needs doing first?"
                        autoComplete="off"
                        autoFocus
                      />
                      {isInvalid && (
                        <LineError>A subtask needs a title.</LineError>
                      )}
                      {suggesting && match && (
                        <NaturalDateSuggestion
                          match={match}
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
          selector={(state) => state.values.dueDate}
          children={(dueDate) => (
            <WhenBands
              due={dueDate}
              onDueChange={(date) => {
                markManual()
                form.setFieldValue('dueDate', date)
              }}
              onRecurrenceChange={() => undefined}
              withRepeat={false}
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
      </div>

      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.isSubmitSuccessful]}
        children={([isSubmitting, isSubmitSuccessful]) => (
          <SlipActions
            submitLabel={submitLabel}
            hint="to save"
            onCancel={onClose}
            disabled={isSubmitting && !isSubmitSuccessful}
          />
        )}
      />
    </form>
  )
}

export function CreateSubtaskForm({
  todoId,
  setCreateDialogIsOpen,
}: {
  todoId: Id<'todos'>
  setCreateDialogIsOpen: (value: boolean) => void
}) {
  const addSubtask = useLocalMutation('addSubTask')

  return (
    <SubtaskSlip
      defaultValues={{ title: '' }}
      submitLabel="Add subtask"
      messages={{
        loading: 'Adding the subtask…',
        success: 'Subtask added',
        error: 'The subtask could not be added. Try again.',
      }}
      submit={(payload) => addSubtask({ todoId, ...payload })}
      onClose={() => setCreateDialogIsOpen(false)}
    />
  )
}

/** A stored subtask carries its date as wall-clock strings; the slip wants a Date. */
function subtaskDueDate(subtask: SubTask) {
  if (!subtask.dueDate) return undefined

  const parsed = subtask.dueTime
    ? parse(
        `${subtask.dueDate} ${subtask.dueTime}`,
        'yyyy-MM-dd HH:mm',
        new Date(),
      )
    : parse(subtask.dueDate, 'yyyy-MM-dd', new Date())

  return isValid(parsed) ? parsed : undefined
}

export function UpdateSubtaskForm({
  subtask,
  setUpdateDialogIsOpen,
}: {
  subtask: SubTask
  setUpdateDialogIsOpen: (value: boolean) => void
}) {
  const updateSubtask = useLocalMutation('updateSubTask')

  return (
    <SubtaskSlip
      defaultValues={{
        title: subtask.title,
        description: subtask.description,
        dueDate: subtaskDueDate(subtask),
      }}
      defaultReminder={reminderChoiceFor(subtask)}
      submitLabel="Save subtask"
      messages={{
        loading: 'Saving the subtask…',
        success: 'Subtask updated',
        error: 'The subtask could not be saved. Try again.',
      }}
      submit={(payload) =>
        updateSubtask({ subTaskId: subtask._id, ...payload })
      }
      onClose={() => setUpdateDialogIsOpen(false)}
    />
  )
}
