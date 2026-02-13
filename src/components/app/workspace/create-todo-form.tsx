import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import type { Id } from 'convex/_generated/dataModel'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTodoFormSchema } from '@/validation/create-todo-form-schema'

interface CreateTodoFormProps {
  listId: Id<'lists'>
  setCreateDialogIsOpen: (value: boolean) => void
}

export function CreateTodoForm({
  listId,
  setCreateDialogIsOpen,
}: CreateTodoFormProps) {
  const addTodo = useConvexMutation(api.todos.mutations.createTodo)
  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      priority: 'none',
    },

    validators: {
      onSubmit: createTodoFormSchema,
    },
    onSubmit: (formData) => {
      const addTodoPromise = addTodo({
        listId,
        title: formData.value.title,
        description: formData.value.description,
        dueDate: formData.value.dueDate || undefined,
        priority: formData.value.priority as 'high' | 'medium' | 'low' | 'none',
      })
      toast.promise(addTodoPromise, {
        loading: 'Please wait while we add your twodo',
        success: () => {
          setCreateDialogIsOpen(false)
          return `"${formData.value.title}" has been added successfully`
        },
        error: 'Failed to create todo please try again',
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
                placeholder="Buy groceries"
                autoComplete="off"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Field
        name="description"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Add details about this todo..."
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Field
        name="dueDate"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Due Date (Optional)</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="date"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      />

      <form.Field
        name="priority"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Priority (Optional)</FieldLabel>
              <Select
                value={field.state.value || 'medium'}
                onValueChange={(value) =>
                  field.handleChange(value as 'high' | 'medium' | 'low')
                }
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
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
              Add Todo
            </Button>
          </Field>
        )}
      />
    </form>
  )
}
