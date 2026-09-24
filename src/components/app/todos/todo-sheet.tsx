import React from 'react'
import { describeRecurrence } from 'convex/todos/recurrence'
import { toast } from 'sonner'
import { StateHandler } from '../state-handler'
import { CreateSubtaskDialog } from './add-subtask-dialog'
import { TodoCheckInput } from './todo-check-input'
import { SubtaskItem } from './subtask-item'
import { SubtaskMeter } from './subtask-meter'
import type { Id } from 'convex/_generated/dataModel'
import type { Todo } from '@/types/global'
import { useLocalMutation, useLocalQuery } from '@/state/hooks'
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
  const data = useLocalQuery('GetAllSubtasks', {
    todoId: todo._id,
  })

  const toggleSubtask = useLocalMutation('toggleSubTask')
  const status = todo.status
  const { subtasks, progress } = data
  const deleteSubtask = useLocalMutation('deleteSubTask')

  const handleToggle = (id: Id<'subTasks'>, checked: boolean) => {
    const finishesTodo = checked && progress.remaining === 1
    void toggleSubtask({ subTaskId: id, completed: checked })
    if (finishesTodo)
      toast.success('Every subtask is done — this twodo is complete.')
  }

  const handleDelete = async (id: Id<'subTasks'>) => {
    await deleteSubtask({ subTaskId: id })
  }

  // The detail view is the entry enlarged: same margin, same gutter, only the
  // date is spelled out in full here because there is room for it.
  const due = gutterTime(todo.dueDate, todo.dueTime, status)

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
                status === 'completed' &&
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
          <Particular label="Repeats">
            {todo.recurrence ? (
              describeRecurrence(todo.recurrence)
            ) : (
              <span className="text-muted-foreground">Never</span>
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
            <span className="capitalize">{status}</span>
          </Particular>
        </dl>

        <div className="flex min-h-0 flex-1 flex-col px-4">
          <div className="flex items-center justify-between gap-2 border-b border-hairline pb-2">
            <h2 className="label-meta text-muted-foreground">Subtasks</h2>
            <div className="flex items-center gap-3">
              {progress.total > 0 && (
                <span
                  data-numeric
                  className="font-mono text-[11px] font-semibold text-muted-foreground"
                >
                  {progress.done}/{progress.total}
                </span>
              )}
              <CreateSubtaskDialog todoId={todo._id} destination={todo.title} />
            </div>
          </div>

          {/* The tally, spelled out: this is the panel where you strike the
              marks, so it gets the full width of the sheet. */}
          {progress.total > 0 && (
            <SubtaskMeter
              variant="bar"
              total={progress.total}
              done={progress.done}
              className="border-b border-hairline py-2.5"
            />
          )}

          <StateHandler
            isFetching={false}
            isError={false}
            error={null}
            isEmpty={subtasks.length === 0}
            emptyState={
              <p className="py-6 text-center text-sm text-muted-foreground">
                No subtasks yet. Break this down if it helps.
              </p>
            }
          >
            <ScrollArea className="h-72 w-full">
              <div className="divide-y divide-hairline">
                {subtasks.map((subtask) => (
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
