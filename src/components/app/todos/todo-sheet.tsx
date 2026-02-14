import React from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { CreateSubtaskDialog } from './add-subtask-dialog'
import { TodoCheckInput } from './todo-check-input'
import { SubtaskItem } from './subtask-item'
import type { Id } from 'convex/_generated/dataModel'
import type { Todo } from '@/types/global'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

interface TodoSheetProps {
  children: React.ReactNode
  todo: Todo
}

export function TodoSheet({ children, todo }: TodoSheetProps) {
  const { data } = useSuspenseQuery(
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
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <TodoCheckInput todo={todo} />
            <SheetTitle>{todo.title}</SheetTitle>
          </div>
          <SheetDescription>{todo.description}</SheetDescription>
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            {todo.dueDate &&
              `Due: ${format(todo.dueDate, 'EEEE, dd MMMM yyyy')} at ${format(todo.dueDate, 'HH:mm')}`}
          </div>
        </SheetHeader>
        <div className="px-4">
          <div className="flex justify-between items-center">
            <h2 className=" font-bold">Subtasks</h2>
            <CreateSubtaskDialog todoId={todo._id} />
          </div>

          <div className="mt-3 space-y-2">
            {data.subtasks.length === 0 && (
              <div className="text-sm text-muted-foreground">No subtasks</div>
            )}

            {data.subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask._id}
                st={subtask}
                onToggle={() => handleToggle(subtask._id, !subtask.completed)}
                onDelete={() => handleDelete(subtask._id)}
              />
            ))}
          </div>
        </div>
        <SheetFooter>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
