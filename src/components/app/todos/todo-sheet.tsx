import React from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { StateHandler } from '../state-handler'
import { CreateSubtaskDialog } from './add-subtask-dialog'
import { TodoCheckInput } from './todo-check-input'
import { SubtaskItem } from './subtask-item'
import type { Id } from 'convex/_generated/dataModel'
import type { Todo } from '@/types/global'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TodoSheetProps {
  children: React.ReactNode
  todo: Todo
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

export function TodoSheet({
  children,
  todo,
  isOpen,
  setIsOpen,
  onEdit,
  onDelete,
}: TodoSheetProps) {
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetAllSubtasks, {
      todoId: todo._id,
    }),
  )

  const updateSubtask = useConvexMutation(api.todos.mutations.updateSubTask)
  const deleteSubtask = useConvexMutation(api.todos.mutations.deleteSubTask)

  const handleToggle = (id: Id<'subTasks'>, checked: boolean) => {
    updateSubtask({ subTaskId: id, completed: checked })
  }

  const handleDelete = async (id: Id<'subTasks'>) => {
    const p = deleteSubtask({ subTaskId: id })
    await p
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0">
              <TodoCheckInput todo={todo} />
            </div>
            <SheetTitle className="truncate">{todo.title}</SheetTitle>
          </div>
          <SheetDescription className="line-clamp-3">
            {todo.description}
          </SheetDescription>
          <div className="flex items-center gap-2 text-sm">
            {todo.dueDate && <Calendar size={16} className="shrink-0" />}
            {todo.dueDate && (
              <span className="truncate">
                Due: {format(todo.dueDate, 'EEE, dd MMM yyyy')}{' '}
                {todo.dueTime ? `at ${todo.dueTime}` : ''}
              </span>
            )}
          </div>
        </SheetHeader>
        <div className="px-4">
          <div className="flex justify-between items-center">
            <h2 className=" font-bold">Subtasks</h2>
            <CreateSubtaskDialog todoId={todo._id} />
          </div>

          <StateHandler
            isFetching={isFetching}
            isError={isError}
            error={error}
            isEmpty={data.subtasks.length === 0}
            emptyState={
              <div className="text-sm text-muted-foreground">No subtasks</div>
            }
          >
            <ScrollArea className="w-full h-72 px-4">
              <div className="mt-3 space-y-2">
                {data.subtasks.map((subtask) => (
                  <SubtaskItem
                    key={subtask._id}
                    st={subtask}
                    onToggle={() =>
                      handleToggle(subtask._id, !subtask.completed)
                    }
                    onDelete={() => handleDelete(subtask._id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </StateHandler>
        </div>
        <SheetFooter>
          <Button variant="outline" size="sm" className="flex-1 py-2" onClick={onEdit}>
            Edit Twodo
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 py-2"
            onClick={onDelete}
          >
            Delete Twodo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
