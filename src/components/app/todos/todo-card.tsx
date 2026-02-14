import { format } from 'date-fns'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import type { Todo } from '@/types/global'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'

interface TodoCardProps {
  todo: Todo
}

export function TodoCard({ todo }: TodoCardProps) {
  const toggleTodo = useConvexMutation(
    api.todos.mutations.ToggleTodoCompletetion,
  )
  return (
    <Card
      key={todo._id}
      className="flex-row items-start justify-between gap-4 p-4 rounded-lg  bg-card/50"
    >
      <CardContent className="flex flex-1  justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <Checkbox
            onCheckedChange={() =>
              toggleTodo({ todoId: todo._id, isCompleted: !todo.completed })
            }
            className="shadow-xl"
            checked={todo.completed}
            aria-label={`Mark ${todo.title} complete`}
          />
          <div>
            <div
              className={`text-sm font-medium ${
                todo.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {todo.title}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {todo.description}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Due:{' '}
              {todo.dueDate &&
                format(todo.dueDate, 'EEEE, dd MMMM, yyyy HH:mm:ss')}
            </div>
          </div>
        </div>
        <div className="grid">
          <div className="flex flex-1 items-center  gap-3">
            <span
              className={`px-2 py-1 text-xs rounded-full font-medium tracking-wide ${
                todo.priority === 'high'
                  ? 'bg-red-600 text-white'
                  : todo.priority === 'medium'
                    ? 'bg-yellow-400 text-black'
                    : 'bg-green-600 text-white'
              }`}
            >
              {todo.priority}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
