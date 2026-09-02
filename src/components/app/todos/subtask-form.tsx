import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { formatInTimeZone } from 'date-fns-tz'
import { isValid, parse } from 'date-fns'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { EntryMark, WhenBands } from './entry-fields'
import { DateAwareTitleInput } from './date-aware-title-input'
import type z from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import type { SubTask } from '@/types/global'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
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
}

interface SubtaskSlipProps {
  defaultValues: SubtaskFormValues
  submitLabel: string
  messages: { loading: string; success: string; error: string }
  submit: (payload: SubtaskPayload) => Promise<unknown>
  onClose: () => void
}

function SubtaskSlip({
  defaultValues,
  submitLabel,
  messages,
  submit,
  onClose,
}: SubtaskSlipProps) {
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

  const { match, readTitle, markManual } = useNaturalDueDate(
    (date) => form.setFieldValue('dueDate', date),
    { title: defaultValues.title, dueDate: defaultValues.dueDate },
  )

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
      <div className="max-h-[60vh] overflow-y-auto">
        <form.Subscribe
          selector={(state) => state.values.dueDate}
          children={(dueDate) => (
            <div className="spine flex items-start gap-3 py-3.5 pr-3 pl-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
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
                          <p className="font-mono text-[11px] text-destructive">
                            A subtask needs a title.
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
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline bg-surface-sunken px-4 py-3">
        <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
          <Kbd>⏎</Kbd> to save
        </span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
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
                {submitLabel}
              </Button>
            )}
          />
        </div>
      </div>
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
  const addSubtask = useConvexMutation(api.todos.mutations.addSubTask)

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
  const updateSubtask = useConvexMutation(api.todos.mutations.updateSubTask)

  return (
    <SubtaskSlip
      defaultValues={{
        title: subtask.title,
        description: subtask.description,
        dueDate: subtaskDueDate(subtask),
      }}
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
