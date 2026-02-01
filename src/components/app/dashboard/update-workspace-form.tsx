import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import type { WorkspaceItem } from '@/types/global'
import { updateWorkspaceFormSchema } from '@/validation/update-workspace-form-schema'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UpdateWorkspaceFormProps {
  workspaceData: WorkspaceItem
  setUpdateWorkspaceDialogIsOpen: (value: boolean) => void
}

export function UpdateWorkspaceDetailsForm({
  workspaceData,
  setUpdateWorkspaceDialogIsOpen,
}: UpdateWorkspaceFormProps) {
  const updateWorkSpaceDetails = useConvexMutation(
    api.dashboard.mutations.updateWorkspaceDetails,
  )
  const form = useForm({
    defaultValues: {
      title: workspaceData.title,
    },
    validators: {
      onSubmit: updateWorkspaceFormSchema,
    },
    onSubmit: (formData) => {
      const updateWorkSpaceDetailsPromise = updateWorkSpaceDetails({
        title: formData.value.title,
        workspaceId: workspaceData._id,
      })

      toast.promise(updateWorkSpaceDetailsPromise, {
        loading: 'Please wait while we update your workspace',
        success: () => {
          setUpdateWorkspaceDialogIsOpen(false)
          return 'Workspace updated successfully'
        },
        error: 'An error occured while updating the workspace',
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
            <Field className="py-4" data-invalid={isInvalid}>
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
      <form.Subscribe
        selector={(state) => [state.isDirty, state.isPristine]}
        children={([isDirty, isPristine]) => (
          <Button
            className="py-2"
            disabled={!isDirty && isPristine}
            type="submit"
          >
            Update
          </Button>
        )}
      />
    </form>
  )
}
