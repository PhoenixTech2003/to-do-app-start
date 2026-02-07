import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createListFormSchema } from '@/validation/create-list-from-schema'

interface CreateListFormProps {
  workspaceId: Id<'workspace'>
  setCreateDialogIsOpen: (value: boolean) => void
}

export function CreateListForm({
  workspaceId,
  setCreateDialogIsOpen,
}: CreateListFormProps) {
  const addList = useConvexMutation(api.workspace.mutations.createList)
  const form = useForm({
    defaultValues: {
      title: '',
    },
    validators: {
      onSubmit: createListFormSchema,
    },
    onSubmit: (formData) => {
      const addListPromise = addList({
        title: formData.value.title,
        workspaceId,
      })
      toast.promise(addListPromise, {
        loading: 'Please wait while we add your Twodo list',
        success: () => {
          setCreateDialogIsOpen(false)
          return `${formData.value.title} list has been created successfully`
        },
        error: 'Failed to create list please try again',
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
                placeholder="Groceries List"
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
          <Field className="py-4">
            <Button
              disabled={isSubmitting && !isSubmitSuccessful}
              type="submit"
            >
              Add List
            </Button>
          </Field>
        )}
      />
    </form>
  )
}
