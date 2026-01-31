import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { updateWorkspaceFormSchema } from '@/validation/update-workspace-form-schema'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UpdateWorkspaceFormProps {
  workspaceName: string
}

export function UpdateWorkspaceDetailsForm({
  workspaceName,
}: UpdateWorkspaceFormProps) {
  const form = useForm({
    defaultValues: {
      title: workspaceName,
    },
    validators: {
      onSubmit: updateWorkspaceFormSchema,
    },
    onSubmit: async (formData) => {
      toast.success(`submitted form successfully with ${formData.value.title}`)
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
