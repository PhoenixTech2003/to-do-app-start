import { format } from 'date-fns'
import { useState } from 'react'
import { TodoSheet } from './todo-sheet'
import { TodoCheckInput } from './todo-check-input'
import type { Todo } from '@/types/global'
import { Card, CardContent } from '@/components/ui/card'

interface TodoCardProps {
  todo: Todo
}

export function TodoCard({ todo }: TodoCardProps) {
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
        key={todo._id}
        onClick={() => setSheetIsOpen(true)}
        className="flex-row items-start justify-between gap-4 p-4 rounded-lg  bg-card/50"
      >
        <CardContent className="flex flex-1 hover:cursor-pointer  justify-between gap-4 p-4">
          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <TodoCheckInput todo={todo} />
            </div>
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
                <p>
                  Due Date:{' '}
                  {todo.dueDate && format(todo.dueDate, 'dd MMMM, yyyy')}
                </p>
                <p>Due Time: {todo.dueDate && format(todo.dueDate, 'HH:mm')}</p>
              </div>
            </div>
          </div>
          <div className="grid">
            <div className="flex flex-1 items-center  gap-3">
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
          </div>
        </CardContent>
      </Card>
    </TodoSheet>
  )
}
