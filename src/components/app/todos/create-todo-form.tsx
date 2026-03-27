import { useForm } from '@tanstack/react-form'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { formatInTimeZone } from 'date-fns-tz'
import type z from 'zod'
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
import { DateTimePicker } from '@/components/ui/date-time-picker'

interface CreateTodoFormProps {
  listId?: Id<'lists'>
  setCreateDialogIsOpen: (value: boolean) => void
}

function matchesInboxPendingQuery(args: { searchTerm?: string; priority?: string }, todo: {
  title: string
  priority: 'high' | 'medium' | 'low' | 'none'
}) {
  const normalizedSearchTerm = args.searchTerm?.trim().toLowerCase()
  const matchesSearch =
    !normalizedSearchTerm ||
    todo.title.toLowerCase().includes(normalizedSearchTerm)
  const matchesPriority = !args.priority || todo.priority === args.priority

  return matchesSearch && matchesPriority
}

export function CreateTodoForm({
  listId,
  setCreateDialogIsOpen,
}: CreateTodoFormProps) {
  const addTodo = useConvexMutation(
    api.todos.mutations.createTodo,
  ).withOptimisticUpdate((localStore, args) => {
    const { listId: argsListId, title, description, dueDate, priority } = args
    const dueDateStr = dueDate ? dueDate.split('T')[0] : undefined
    const dueTimeStr = dueDate ? dueDate.split('T')[1] : undefined

    const optimisticTodo = {
      _id: 'optimistic' + Math.random(),
      _creationTime: Date.now(),
      listId: argsListId,
      title,
      description,
      status: 'pending',
      dueDate: dueDateStr,
      dueTime: dueTimeStr,
      priority,
    } as any

    if (argsListId) {
      const pendingQueries = localStore.getAllQueries(
        api.todos.queries.GetPendingTodos,
      )
      for (const { args: qArgs, value } of pendingQueries) {
        if (qArgs.listId !== argsListId) continue
        if (!value) continue

        const isFirstPage = !(qArgs.paginationOpts as { cursor?: string }).cursor
        if (!isFirstPage) continue

        localStore.setQuery(api.todos.queries.GetPendingTodos, qArgs, {
          ...value,
          page: [optimisticTodo, ...value.page],
          isDone: false,
          continueCursor: 'optimistic',
        })
      }
      return
    }

    const inboxQueries = localStore.getAllQueries(api.todos.queries.GetInboxPendingTodos)
    for (const { args: qArgs, value } of inboxQueries) {
      if (!value) continue

      const isFirstPage = !(qArgs.paginationOpts as { cursor?: string }).cursor
      if (!isFirstPage) continue
      if (!matchesInboxPendingQuery(qArgs, optimisticTodo)) continue

      localStore.setQuery(api.todos.queries.GetInboxPendingTodos, qArgs, {
        ...value,
        page: [optimisticTodo, ...value.page],
        isDone: false,
        continueCursor: 'optimistic',
      })
    }
  })

  const defaultValues: z.input<typeof createTodoFormSchema> = {
    title: '',
    priority: 'none',
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
      const addTodoPromise = addTodo({
        listId,
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
        scheduledFuntionRunTime: scheduledFunctionRunTime,
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
              Add Todo
            </Button>
          </Field>
        )}
      />
    </form>
  )
}
