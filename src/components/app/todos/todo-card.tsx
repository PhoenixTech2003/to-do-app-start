import { format } from 'date-fns'
import type { Todo } from '@/types/global'

interface TodoCardProps {
  todo: Todo
}

export function TodoCard({ todo }: TodoCardProps) {
  return (
    <article
      key={todo._id}
      className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card/50"
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={todo.completed}
          readOnly
          className="mt-1 h-4 w-4 rounded border"
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

      <div className="flex items-center gap-3">
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
    </article>
  )
}
