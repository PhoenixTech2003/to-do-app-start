import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { format, parse } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type z from 'zod'
import type { Todo } from '@/types/global'
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
import { DateTimePicker } from '@/components/ui/date-time-picker'

interface UpdateTodoFormProps {
  todo: Todo
  setUpdateDialogIsOpen: (value: boolean) => void
}

export function UpdateTodoForm({
  todo,
  setUpdateDialogIsOpen,
}: UpdateTodoFormProps) {
  const updateTodo = useConvexMutation(api.todos.mutations.updateTodo)
  const dueTime = todo.dueTime || '00:00'
  const dueDate = todo.dueDate
    ? format(todo.dueDate, 'yyyy-MM-dd')
    : format(new Date(), 'yyyy-MM-dd')
  const parsedDate = parse(
    `${dueDate} ${dueTime}`,
    'yyyy-MM-dd HH:mm',
    new Date(),
  )
  const defaultValues: z.input<typeof createTodoFormSchema> = {
    title: todo.title,
    description: todo.description,
    dueDate: parsedDate,
    priority: todo.priority,
  }

  const form = useForm({
    defaultValues,

    validators: {
      onSubmit: createTodoFormSchema,
    },
    onSubmit: (formData) => {
      const usersTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const scheduledFunctionRunTime = formData.value.dueDate
        ? formData.value.dueDate.getTime() + 60000
        : undefined
      const updateTodoPromise = updateTodo({
        todoId: todo._id,
        title: formData.value.title,
        description: formData.value.description,
        dueDate: formData.value.dueDate
          ? formatInTimeZone(
              formData.value.dueDate,
              usersTimeZone,
              "yyyy-MM-dd'T'HH:mm",
            )
          : undefined,
        priority: formData.value.priority,
        scheduledFunctionRunTime,
      })
      toast.promise(updateTodoPromise, {
        loading: 'Please wait while we update your twodo',
        success: () => {
          setUpdateDialogIsOpen(false)
          return `"${formData.value.title}" has been updated successfully`
        },
        error: 'Failed to update todo please try again',
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
              <DateTimePicker
                value={field.state.value}
                setValue={field.handleChange}
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
                defaultValue={field.state.value}
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(
                    value as 'high' | 'medium' | 'low' | 'none',
                  )
                }
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">none</SelectItem>
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
              Update Todo
            </Button>
          </Field>
        )}
      />
    </form>
  )
}
