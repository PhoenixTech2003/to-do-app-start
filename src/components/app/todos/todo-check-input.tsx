import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { isAfter, isBefore, parse } from 'date-fns'
import type { Todo } from '@/types/global'
import { Checkbox } from '@/components/ui/checkbox'

interface TodoCheckInputProps {
  todo: Todo
}

function getTodoStatus({
  status,
  dueDate,
}: {
  status: 'pending' | 'completed' | 'overdue'
  dueDate?: Date
}) {
  if (!dueDate) {
    return 'pending'
  }
  const now = new Date()
  console.log(dueDate)
  console.log(now)
  console.log(isBefore(dueDate, now))
  if (status === 'pending') {
    return 'completed'
  }
  if (status === 'completed' && isBefore(now, dueDate)) {
    return 'pending'
  }
  if (status === 'completed' && isAfter(now, dueDate)) {
    return 'overdue'
  }
  if (status === 'overdue') {
    return 'completed'
  }
  return 'pending'
}

export function TodoCheckInput({ todo }: TodoCheckInputProps) {
  const toggleTodo = useConvexMutation(api.todos.mutations.toggleTodoStatus)
  const formattedDate =
    todo.dueDate && todo.dueTime
      ? parse(`${todo.dueDate} ${todo.dueTime}`, 'yyyy-MM-dd HH:mm', new Date())
      : undefined

  return (
    <Checkbox
      onCheckedChange={() =>
        toggleTodo({
          todoId: todo._id,
          status: getTodoStatus({
            status: todo.status,
            dueDate: formattedDate,
          }),
        })
      }
      className="shrink-0"
      checked={todo.status === 'completed'}
      aria-label={`Mark ${todo.title} complete`}
    />
  )
}
