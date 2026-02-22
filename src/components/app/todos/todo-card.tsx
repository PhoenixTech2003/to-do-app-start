import { format } from 'date-fns'
import { forwardRef, useState } from 'react'
import { TodoSheet } from './todo-sheet'
import { TodoCheckInput } from './todo-check-input'
import type { Todo } from '@/types/global'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface TodoCardProps {
  todo: Todo
}

export const TodoCard = forwardRef<HTMLDivElement, TodoCardProps>(
  ({ todo }: TodoCardProps, ref) => {
    const [sheetIsOpen, setSheetIsOpen] = useState(false)

    function setSheetIsOpenHanlder(value: boolean) {
      setSheetIsOpen(value)
    }
    return (
      <TodoSheet
        isOpen={sheetIsOpen}
        setIsOpen={setSheetIsOpenHanlder}
        todo={todo}
      >
        <Card
          ref={ref}
          key={todo._id}
          onClick={() => setSheetIsOpen(true)}
          className="flex-row items-start justify-between gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg bg-card/50"
        >
          <CardContent className="flex flex-1 hover:cursor-pointer justify-between gap-2 sm:gap-4 p-2 sm:p-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <TodoCheckInput todo={todo} />
              </div>
              <div className="min-w-0">
                <div
                  className={cn(
                    'text-sm font-medium truncate',
                    todo.status === 'completed' &&
                      'line-through text-muted-foreground',
                  )}
                >
                  {todo.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {todo.description}
                </div>
                <div
                  className={cn(
                    'text-xs mt-2',
                    todo.status === 'overdue'
                      ? 'text-red-600 dark:text-red-400 font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  <p className="truncate">
                    Due:{' '}
                    {todo.dueDate && format(todo.dueDate, 'dd MMM, yyyy')}
                    {todo.dueTime && ` at ${todo.dueTime}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="shrink-0 self-center">
              <span
                className={`px-2 py-1 text-xs rounded-full font-medium tracking-wide ${
                  todo.priority === 'high'
                    ? 'bg-red-600 dark:bg-red-700 text-white'
                    : todo.priority === 'medium'
                      ? 'bg-yellow-400 dark:bg-yellow-500 text-black dark:text-black'
                      : 'bg-green-600 dark:bg-green-700 text-white'
                }`}
              >
                {todo.priority}
              </span>
            </div>
          </CardContent>
        </Card>
      </TodoSheet>
    )
  },
)
