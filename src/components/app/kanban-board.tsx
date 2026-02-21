import { DragDropProvider } from '@dnd-kit/react'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { isAfter, parse } from 'date-fns'
import { useSuspenseQuery } from '@tanstack/react-query'
import { KanbanLane } from './kanban-lane'
import type { Todo } from '@/types/global'
import type { Id } from 'convex/_generated/dataModel'

interface KanbanBoardProps {
  listId: Id<'lists'>
}

export function KanbanBoard({ listId }: KanbanBoardProps) {
  const { data: pendingTodos } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetPendingTodos, {
      listId,
    }),
  )
  const { data: completedTodos } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetCompletedTodos, {
      listId,
    }),
  )
  const { data: overdueTodos } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetOverDueTodos, {
      listId,
    }),
  )
  const updateTodoStatus = useConvexMutation(
    api.todos.mutations.toggleTodoStatus,
  )
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
  return (
    <DragDropProvider
      onDragEnd={(e) => {
        const todo = e.operation.source?.data as Todo
        const formattedDate = parse(
          `${todo.dueDate} ${todo.dueTime}`,
          'yyyy-MM-dd HH:mm',
          new Date(),
        )
        const containerStatus = e.operation.target?.id.toString().toLowerCase()
        if (containerStatus === todo.status) {
          return
        }

        const status = getTodoStatus({
          status: todo.status,
          dueDate: formattedDate,
        })
        const todoPromise = updateTodoStatus({
          todoId: todo._id,
          status,
        })

        toast.promise(todoPromise, {
          loading: 'Updating Todo....',
          success: 'Todo updated successfully',
          error: 'Failed to updated todo',
        })
      }}
    >
      <div className="grid grid-cols-3 gap-4">
        <KanbanLane title="Pending" todos={pendingTodos.todos} />
        <KanbanLane title="Completed" todos={completedTodos.todos} />
        <KanbanLane title="Overdue" todos={overdueTodos.todos} />
      </div>
    </DragDropProvider>
  )
}
