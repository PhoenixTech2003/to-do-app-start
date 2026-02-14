import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createSubtaskFormSchema } from '@/validation/create-subtask-form-schema'

interface CreateSubtaskFormProps {
  todoId: Id<'todos'>
  setCreateDialogIsOpen: (value: boolean) => void
}

export function CreateSubtaskForm({ todoId, setCreateDialogIsOpen }: CreateSubtaskFormProps) {
  const addSubtask = useConvexMutation(api.todos.mutations.addSubTask)
  const form = useForm({
    defaultValues: {
      title: '',
    },
    validators: {
      onSubmit: createSubtaskFormSchema,
    },
    onSubmit: (formData) => {
      const p = addSubtask({ todoId, title: formData.value.title })
      toast.promise(p, {
        loading: 'Creating subtask...',
        success: () => {
          setCreateDialogIsOpen(false)
          return `${formData.value.title} created`
        },
        error: 'Failed to create subtask',
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
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
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
            <Button disabled={isSubmitting && !isSubmitSuccessful} type="submit">
              Add Subtask
            </Button>
          </div>
        )}
      />
    </form>
  )
}
