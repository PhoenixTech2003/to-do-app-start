import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { isAfter, parse } from 'date-fns'
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
  // No due date: simple toggle (overdue also goes to completed)
  if (!dueDate) {
    return status === 'completed' ? 'pending' : 'completed'
  }

  // Has due date: completing a todo goes back to pending or overdue based on date,
  // otherwise mark as completed
  const now = new Date()
  if (status === 'completed') {
    return isAfter(now, dueDate) ? 'overdue' : 'pending'
  }

  return 'completed'
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
