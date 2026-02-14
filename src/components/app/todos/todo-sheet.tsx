import React, { useState } from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StateHandler } from '../state-handler'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { CreateSubtaskDialog } from './add-subtask-dialog'
import { TodoCheckInput } from './todo-check-input'
import { SubtaskItem } from './subtask-item'
import { UpdateTodoForm } from './update-todo-form'
import type { Id } from 'convex/_generated/dataModel'
import type { Todo } from '@/types/global'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TodoSheetProps {
  children: React.ReactNode
  todo: Todo
}

export function TodoSheet({ children, todo }: TodoSheetProps) {
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetAllSubtasks, {
      todoId: todo._id,
    }),
  )

  const [updateTodoDialogOpen, setUpdateTodoDialogOpen] = useState(false)
  const [deleteTodoDialogOpen, setDeleteTodoDialogOpen] = useState(false)

  function updateTodoDialogHandler(value: boolean) {
    setUpdateTodoDialogOpen(value)
  }

  function deleteTodoDialogHandler(value: boolean) {
    setDeleteTodoDialogOpen(value)
  }

  const updateSubtask = useConvexMutation(api.todos.mutations.updateSubTask)
  const deleteSubtask = useConvexMutation(api.todos.mutations.deleteSubTask)
  const deleteTodo = useConvexMutation(api.todos.mutations.deleteTodo)

  const handleToggle = (id: Id<'subTasks'>, checked: boolean) => {
    updateSubtask({ subTaskId: id, completed: checked })
  }

  const handleDelete = async (id: Id<'subTasks'>) => {
    const p = deleteSubtask({ subTaskId: id })
    await p
  }

  function handleTodoDelete() {
    const deleteTodoPromise = deleteTodo({
      todoId: todo._id,
    })
    toast.promise(deleteTodoPromise, {
      loading: 'Deleting todo please wait',
      success: () => {
        deleteTodoDialogHandler(false)
        return 'Twodo has been deleted succussfully'
      },
      error: 'Failed to delete the Twodo',
    })
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
          <UpdateDialog
            triggerTitle="Edit Twodo"
            isOpen={updateTodoDialogOpen}
            updateDialogTitle="Update Todo"
            setDialogIsOpen={updateTodoDialogHandler}
          >
            <UpdateTodoForm
              todo={todo}
              setUpdateDialogIsOpen={updateTodoDialogHandler}
            />
          </UpdateDialog>
          <DeleteDialog
            triggerTitle="Delete Twodo"
            handleDelete={handleTodoDelete}
            setIsOpen={deleteTodoDialogHandler}
            isOpen={deleteTodoDialogOpen}
            dialogTitle="Are you sure you want to delete the Twodo"
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
