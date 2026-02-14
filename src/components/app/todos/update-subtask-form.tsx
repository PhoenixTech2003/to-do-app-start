import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createSubtaskFormSchema } from '@/validation/create-subtask-form-schema'

interface UpdateSubtaskFormProps {
  subtaskId: Id<'subTasks'>
  title: string
  setUpdateDialogIsOpen: (value: boolean) => void
}

export function UpdateSubtaskForm({
  subtaskId,
  title,
  setUpdateDialogIsOpen,
}: UpdateSubtaskFormProps) {
  const updateSubtask = useConvexMutation(api.todos.mutations.updateSubTask)
  const form = useForm({
    defaultValues: {
      title,
    },
    validators: {
      onSubmit: createSubtaskFormSchema,
    },
    onSubmit: (formData) => {
      const p = updateSubtask({
        subTaskId: subtaskId,
        title: formData.value.title,
      })
      toast.promise(p, {
        loading: 'Updating subtask...',
        success: () => {
          setUpdateDialogIsOpen(false)
          return 'Subtask updated'
        },
        error: 'Failed to update subtask',
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
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
              <FieldLabel htmlFor={field.name}>Title</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Subtask title"
                autoComplete="off"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Subscribe
        selector={(state) => [state.isSubmitting, state.isSubmitSuccessful]}
        children={([isSubmitting, isSubmitSuccessful]) => (
          <div className="py-4">
            <Button
              disabled={isSubmitting && !isSubmitSuccessful}
              type="submit"
            >
              Update
            </Button>
          </div>
        )}
      />
    </form>
  )
}
