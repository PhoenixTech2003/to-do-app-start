import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'

export const Route = createFileRoute(
  '/dashboard/workspace/$workspaceId/lists/$listId/todos/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const todos = useMemo(
    () => [
      {
        id: 't1',
        title: 'Design homepage wireframe',
        notes: 'Use cards for tasks and highlight priorities',
        completed: false,
        assignee: 'Ada',
        dueDate: 'Mar 2',
        priority: 'high',
      },
      {
        id: 't2',
        title: 'Write unit tests for list mutations',
        notes: 'Cover create/update/delete',
        completed: false,
        assignee: 'Chiyem',
        dueDate: 'Mar 6',
        priority: 'medium',
      },
      {
        id: 't3',
        title: 'Refactor workspace header',
        notes: 'Make header responsive and accessible',
        completed: true,
        assignee: 'Sam',
        dueDate: 'Feb 20',
        priority: 'low',
      },
    ],
    [],
  )

  return (
    <div className="p-6">
      <header className="mb-4">
        <h2 className="text-2xl font-semibold">List Todos</h2>
        <p className="text-sm text-muted-foreground">Showing todos for this list (sample data).</p>
      </header>

      <div className="space-y-3">
        {todos.map((todo) => (
          <article
            key={todo.id}
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
                <div className="text-xs text-muted-foreground mt-1">{todo.notes}</div>
                <div className="text-xs text-muted-foreground mt-2">Due: {todo.dueDate}</div>
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

              <div className="text-sm">{todo.assignee}</div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
