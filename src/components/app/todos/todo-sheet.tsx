import React from 'react'
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { gutterInk, gutterTime } from '@/lib/todo-time'
import { cn } from '@/lib/utils'

interface TodoSheetProps {
  children: React.ReactNode
  todo: Todo
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  onEdit: () => void
  onDelete: () => void
}

const spineColor: Record<string, string> = {
  high: 'var(--destructive)',
  medium: 'var(--chart-4)',
  low: 'var(--chart-2)',
  none: 'var(--border)',
}

/** One line of the particulars block: label in the structural voice, value in ink. */
function Particular({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline gap-3 py-2">
      <dt className="label-meta w-20 shrink-0 text-muted-foreground/70">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-sm">{children}</dd>
    </div>
  )
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

  // The detail view is the entry enlarged: same margin, same gutter, only the
  // date is spelled out in full here because there is room for it.
  const due = gutterTime(todo.dueDate, todo.dueTime, todo.status)
  const done = data.subtasks.filter((s) => s.completed).length

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children}
      <SheetContent
        aria-describedby={undefined}
        style={
          {
            '--spine': spineColor[todo.priority] ?? spineColor.none,
          } as React.CSSProperties
        }
        className="spine"
      >
        {/* pr-10 keeps the gutter figure clear of the panel's close button. */}
        <SheetHeader className="gap-3 pr-10 pl-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <TodoCheckInput todo={todo} />
            </div>
            <SheetTitle
              className={cn(
                'min-w-0 flex-1 text-base leading-snug',
                todo.status === 'completed' &&
                  'text-muted-foreground line-through decoration-muted-foreground/50',
              )}
            >
              {todo.title}
            </SheetTitle>
            <span
              data-numeric
              className={cn(
                'shrink-0 font-mono text-sm font-semibold',
                gutterInk[due.tone],
              )}
            >
              {due.short}
            </span>
          </div>
          {todo.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {todo.description}
            </p>
          )}
        </SheetHeader>

        <dl className="mx-4 divide-y divide-hairline border-y border-hairline">
          <Particular label="Due">
            {todo.dueDate ? (
              <time dateTime={todo.dueDate}>{due.long}</time>
            ) : (
              <span className="text-muted-foreground">No due date</span>
            )}
          </Particular>
          <Particular label="Priority">
            {todo.priority === 'none' ? (
              <span className="text-muted-foreground">Unset</span>
            ) : (
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-3 w-[3px] rounded-full"
                  style={{ background: spineColor[todo.priority] }}
                />
                <span className="capitalize">{todo.priority}</span>
              </span>
            )}
          </Particular>
          <Particular label="Status">
            <span className="capitalize">{todo.status}</span>
          </Particular>
        </dl>

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2">
            <h2 className="label-meta text-muted-foreground">Subtasks</h2>
            <div className="flex items-center gap-3">
              {data.subtasks.length > 0 && (
                <span
                  data-numeric
                  className="font-mono text-[11px] font-semibold text-muted-foreground"
                >
                  {done}/{data.subtasks.length}
                </span>
              )}
              <CreateSubtaskDialog todoId={todo._id} />
            </div>
          </div>

          <StateHandler
            isFetching={isFetching}
            isError={isError}
            error={error}
            isEmpty={data.subtasks.length === 0}
            emptyState={
              <p className="py-6 text-center text-sm text-muted-foreground">
                No subtasks yet. Break this down if it helps.
              </p>
            }
          >
            <ScrollArea className="h-72 w-full">
              <div className="divide-y divide-hairline">
                {data.subtasks.map((subtask) => (
                  <SubtaskItem
                    key={subtask._id}
                    st={subtask}
                    onToggle={() => handleToggle(subtask._id, !subtask.completed)}
                    onDelete={() => handleDelete(subtask._id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </StateHandler>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 py-2"
            onClick={onEdit}
          >
            Edit twodo
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 py-2"
            onClick={onDelete}
          >
            Delete twodo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
