import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { createWorkspaceFormSchema } from '@/validation/create-workspace-form-schema'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CreateWorkspaceDialogProps {
  setCreateDialogIsOpen: (value: boolean) => void
}

export function CreateWorkspaceForm({
  setCreateDialogIsOpen,
}: CreateWorkspaceDialogProps) {
  const addWorkspace = useConvexMutation(
    api.dashboard.mutations.createWorkspace,
  )
  const form = useForm({
    defaultValues: {
      title: '',
    },
    validators: {
      onSubmit: createWorkspaceFormSchema,
    },
    onSubmit: (value) => {
      const addWorkspacePromise = addWorkspace({ title: value.value.title })
      toast.promise(addWorkspacePromise, {
        loading: 'Please wait while we add your Twodo workspace',
        success: () => {
          setCreateDialogIsOpen(false)
          return `${value.value.title} workspace has been created successfully`
        },
        error: 'Failed to create workspace please try again',
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
                placeholder="School Workspace"
                autoComplete="off"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />
      <Field className="py-4">
        <Button type="submit">Add Workspace</Button>
      </Field>
    </form>
  )
}
