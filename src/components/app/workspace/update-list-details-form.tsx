import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import type { ListItem } from '@/types/global'
import { updateListFormSchema } from '@/validation/update-list-form-schema'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UpdateListFormProps {
  listData: ListItem
  setUpdateListDialogIsOpen: (value: boolean) => void
}

export function UpdateListDetailsForm({
  listData,
  setUpdateListDialogIsOpen,
}: UpdateListFormProps) {
  const updateListDetails = useConvexMutation(
    api.workspace.mutations.updatelistDetails,
  )
  const form = useForm({
    defaultValues: {
      title: listData.title,
    },
    validators: {
      onSubmit: updateListFormSchema,
    },
    onSubmit: (formData) => {
      const updateListDetailsPromise = updateListDetails({
        title: formData.value.title,
        listId: listData._id,
      })

      toast.promise(updateListDetailsPromise, {
        loading: 'Please wait while we update your list',
        success: () => {
          setUpdateListDialogIsOpen(false)
          return 'List updated successfully'
        },
        error: 'An error occured while updating the list',
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
                placeholder="Grocery List"
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
