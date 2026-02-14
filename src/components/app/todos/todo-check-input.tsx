import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import type { Todo } from '@/types/global'
import { Checkbox } from '@/components/ui/checkbox'

interface TodoCheckInputProps {
  todo: Todo
}

export function TodoCheckInput({ todo }: TodoCheckInputProps) {
  const toggleTodo = useConvexMutation(
    api.todos.mutations.ToggleTodoCompletetion,
  )
  return (
    <Checkbox
      onCheckedChange={() =>
        toggleTodo({ todoId: todo._id, isCompleted: !todo.completed })
      }
      className="flex-shrink-0"
      checked={todo.completed}
      aria-label={`Mark ${todo.title} complete`}
    />
  )
}
