import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ExternalLink,
  FolderInput,
  FolderOpen,
  Inbox,
  ListChecks,
  Pencil,
  Repeat,
  Trash2,
} from 'lucide-react'
import { describeRecurrence } from 'convex/todos/recurrence'
import { forwardRef, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { DeleteDialog } from '../delete-dialog'
import { TodoSheet } from './todo-sheet'
import { SubtaskMeter } from './subtask-meter'
import { TodoCheckInput } from './todo-check-input'
import { UpdateTodoForm } from './update-todo-form'
import { PRIORITY_SPINE } from './entry-fields'
import { EntrySlip } from './entry-slip'
import type { Id } from 'convex/_generated/dataModel'
import type { Todo, TodoLocation } from '@/types/global'
import { cn, truncateText } from '@/lib/utils'
import { GUTTER } from '@/components/app/docket'
import { gutterInk, gutterTime } from '@/lib/todo-time'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface TodoCardProps {
  todo: Todo & { location?: TodoLocation }
  /**
   * `entry` — a ruled line printed on a docket sheet. The default, and what
   * every list in the app uses.
   * `card` — a discrete object you can pick up. Only the kanban board, where
   *   things are dragged between lanes, earns this.
   */
  variant?: 'entry' | 'card'
}

const chipClasses =
  'flex items-center gap-1.5 min-w-0 max-w-full rounded-sm border border-hairline bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground'

function TodoLocationChip({ location }: { location: TodoLocation }) {
  if (!location.listId || !location.workspaceId) {
    return (
      <span className={chipClasses}>
        <Inbox className="size-3 shrink-0" />
        <span className="truncate">Inbox</span>
      </span>
    )
  }

  return (
    <Link
      to="/dashboard/workspace/$workspaceId/lists/$listId/todos"
      params={{ workspaceId: location.workspaceId, listId: location.listId }}
      search={{ view: 'list' }}
      onClick={(e) => e.stopPropagation()}
      title={`${location.workspaceTitle} / ${location.listTitle}`}
      className={cn(
        chipClasses,
        'transition-colors hover:bg-muted hover:text-foreground',
      )}
    >
      <FolderOpen className="size-3 shrink-0" />
      <span className="truncate">{location.workspaceTitle}</span>
      <span className="text-muted-foreground/40">/</span>
      <span className="truncate text-foreground/70">{location.listTitle}</span>
    </Link>
  )
}

export const TodoCard = forwardRef<HTMLDivElement, TodoCardProps>(
  ({ todo, variant = 'entry' }: TodoCardProps, ref) => {
    const [sheetIsOpen, setSheetIsOpen] = useState(false)
    const [updateTodoDialogOpen, setUpdateTodoDialogOpen] = useState(false)
    const [deleteTodoDialogOpen, setDeleteTodoDialogOpen] = useState(false)
    const [moveToListOpen, setMoveToListOpen] = useState(false)
    const isMobile = useIsMobile()
    const { data: availableLists = [] } = useQuery(
      convexQuery(api.workspace.queries.GetUserListsForMove, {
        searchTerm: undefined,
      }),
    )
    const deleteTodo = useConvexMutation(
      api.todos.mutations.deleteTodo,
    ).withOptimisticUpdate((localStore, mutationArgs) => {
      const { todoId: mutationTodoId } = mutationArgs

      const matchesQueryList = (queryArgs: Record<string, unknown>) => {
        if ('listId' in queryArgs) {
          return queryArgs.listId === todo.listId
        }

        return todo.listId === undefined
      }

      const removeTodoFromQueries = (queryRef: any, global = false) => {
        const queries = localStore.getAllQueries(queryRef)
        for (const { args: qArgs, value } of queries) {
          if (!global && !matchesQueryList(qArgs)) continue
          if (!value) continue

          const pageContainsTodo = value.page.some(
            (t: Todo) => t._id === mutationTodoId,
          )
          if (!pageContainsTodo) continue

          localStore.setQuery(queryRef, qArgs, {
            ...value,
            page: value.page.filter((t: Todo) => t._id !== mutationTodoId),
          })
        }
      }

      removeTodoFromQueries(api.todos.queries.GetPendingTodos)
      removeTodoFromQueries(api.todos.queries.GetCompletedTodos)
      removeTodoFromQueries(api.todos.queries.GetOverDueTodos)
      removeTodoFromQueries(api.todos.queries.GetInboxPendingTodos)
      removeTodoFromQueries(api.todos.queries.GetInboxCompletedTodos)
      removeTodoFromQueries(api.todos.queries.GetInboxOverdueTodos)
      removeTodoFromQueries(api.globals.queries.GetAllUpcomingTodos, true)
      removeTodoFromQueries(api.globals.queries.GetAllOverdueTodos, true)

      const byDateQueries = localStore.getAllQueries(
        api.globals.queries.getTodosByDate,
      )
      for (const { args: qArgs, value: byDateData } of byDateQueries) {
        if (!byDateData) continue

        const hasTodo = byDateData.todos.some(
          (t: Todo) => t._id === mutationTodoId,
        )
        if (!hasTodo) continue

        localStore.setQuery(api.globals.queries.getTodosByDate, qArgs, {
          todos: byDateData.todos.filter((t: Todo) => t._id !== mutationTodoId),
        })
      }
    })
    const moveTodoToList = useConvexMutation(api.todos.mutations.moveTodoToList)

    const title = isMobile ? truncateText(todo.title) : todo.title
    const description = isMobile
      ? truncateText(todo.description)
      : todo.description

    // The spine colour encodes priority. `none` falls back to a plain rule so
    // an unprioritised task still reads as part of the same system. Shared with
    // the create form, where you pick the stroke this row will print.
    const spineColor = PRIORITY_SPINE

    // The gutter. Distance, not a date — the absolute date rides along in the
    // row's title so nothing is actually lost.
    const due = gutterTime(todo.dueDate, todo.dueTime, todo.status)
    const repeats = todo.recurrence
      ? `, ${describeRecurrence(todo.recurrence).toLowerCase()}`
      : ''
    const rowTitle =
      todo.priority === 'none'
        ? `${todo.title} — ${due.long}${repeats}`
        : `${todo.title} — ${todo.priority} priority, ${due.long}${repeats}`
    const listsForMove = useMemo(
      () => availableLists.filter((list) => list._id !== todo.listId),
      [availableLists, todo.listId],
    )

    const groupedLists = useMemo(() => {
      const groups = new Map<string, typeof listsForMove>()
      for (const list of listsForMove) {
        const existing = groups.get(list.workspaceTitle) ?? []
        existing.push(list)
        groups.set(list.workspaceTitle, existing)
      }
      return Array.from(groups.entries())
    }, [listsForMove])

    function updateTodoDialogHandler(value: boolean) {
      setUpdateTodoDialogOpen(value)
    }

    function deleteTodoDialogHandler(value: boolean) {
      setDeleteTodoDialogOpen(value)
    }

    function handleTodoDelete() {
      const deleteTodoPromise = deleteTodo({
        todoId: todo._id,
      })
      toast.promise(deleteTodoPromise, {
        loading: 'Deleting todo please wait',
        success: () => {
          deleteTodoDialogHandler(false)
          setSheetIsOpen(false)
          return 'Twodo has been deleted successfully'
        },
        error: 'Failed to delete the Twodo',
      })
    }

    function handleMoveToList(listId?: Id<'lists'>) {
      const moveTodoPromise = moveTodoToList({
        todoId: todo._id,
        listId,
      })

      toast.promise(moveTodoPromise, {
        loading: listId ? 'Moving todo to list...' : 'Moving todo to inbox...',
        success: listId ? 'Todo moved successfully' : 'Todo moved to inbox',
        error: 'Failed to move todo',
      })
    }

    function handleContextMenuKeyDown(e: React.KeyboardEvent) {
      const key = e.key.toLowerCase()

      const actions: Record<string, (() => void) | undefined> = {
        o: () => setSheetIsOpen(true),
        e: () => setUpdateTodoDialogOpen(true),
        i: todo.listId ? () => handleMoveToList(undefined) : undefined,
        m: () => setMoveToListOpen(true),
        delete: () => setDeleteTodoDialogOpen(true),
      }

      const action = actions[key]
      if (action) {
        e.preventDefault()
        e.stopPropagation()
        action()
      }
    }

    return (
      <>
        <EntrySlip
          open={updateTodoDialogOpen}
          onOpenChange={updateTodoDialogHandler}
          label="Edit entry"
          destination={
            todo.recurrence ? describeRecurrence(todo.recurrence) : undefined
          }
          description="Change this twodo's title, note, due date, repetition or priority."
        >
          <UpdateTodoForm
            todo={todo}
            setUpdateDialogIsOpen={updateTodoDialogHandler}
          />
        </EntrySlip>
        <DeleteDialog
          showTrigger={false}
          handleDelete={handleTodoDelete}
          setIsOpen={deleteTodoDialogHandler}
          isOpen={deleteTodoDialogOpen}
          dialogTitle="Are you sure you want to delete the Twodo"
        />
        <CommandDialog
          open={moveToListOpen}
          onOpenChange={setMoveToListOpen}
          title="Move to list"
          description="Search and select a destination list"
          showCloseButton={false}
          className="max-w-sm"
        >
          <CommandInput placeholder="Find a list…" />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2.5 py-4">
                <div className="rounded-full bg-muted/60 p-3">
                  <FolderInput className="size-4 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground/60">
                  No matching lists
                </p>
              </div>
            </CommandEmpty>
            {groupedLists.map(([workspace, lists]) => (
              <CommandGroup
                key={workspace}
                heading={workspace}
                className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.15em]"
              >
                {lists.map((list) => (
                  <CommandItem
                    key={list._id}
                    value={`${list.title} ${list.workspaceTitle}`}
                    onSelect={() => {
                      handleMoveToList(list._id)
                      setMoveToListOpen(false)
                    }}
                    className="gap-2.5"
                  >
                    <span className="size-[6px] rounded-full bg-primary/40 shrink-0" />
                    {list.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </CommandDialog>
        <ContextMenu>
          <TodoSheet
            isOpen={sheetIsOpen}
            setIsOpen={setSheetIsOpen}
            todo={todo}
            onEdit={() => setUpdateTodoDialogOpen(true)}
            onDelete={() => setDeleteTodoDialogOpen(true)}
          >
            <ContextMenuTrigger asChild>
              <motion.div
                ref={ref}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setSheetIsOpen(true)}
                title={rowTitle}
                style={
                  {
                    '--spine': spineColor[todo.priority],
                  } as React.CSSProperties
                }
                className={cn(
                  'spine group relative flex cursor-pointer items-start gap-3 py-3 pr-3 pl-4',
                  variant === 'entry'
                    ? // A line printed on the sheet. It does not lift; the
                      // paper under it warms and the margin rule thickens.
                      'bg-card transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)] hover:bg-accent/45'
                    : // A discrete object, for lanes you drag between.
                      'rounded-md border border-hairline bg-card shadow-[inset_0_1px_0_0_var(--edge-highlight),var(--elev-1)] transition-[box-shadow,border-color] duration-[var(--dur-2)] ease-[var(--ease-out)] hover:border-hairline-strong hover:shadow-[inset_0_1px_0_0_var(--edge-highlight),var(--elev-3)]',
                  todo.status === 'completed' && 'spine-drained',
                )}
              >
                <div onClick={(e) => e.stopPropagation()} className="mt-px">
                  <TodoCheckInput todo={todo} />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3
                    className={cn(
                      'text-sm leading-snug font-medium',
                      todo.status === 'completed' &&
                        'text-muted-foreground line-through decoration-muted-foreground/50',
                    )}
                  >
                    {title}
                    {/* A series mark, not a badge: the row says it comes back. */}
                    {todo.recurrence && (
                      <Repeat
                        aria-hidden
                        className="ml-1.5 inline size-3 shrink-0 align-[-1px] text-muted-foreground/60"
                      />
                    )}
                  </h3>
                  {description && (
                    <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  )}
                  {/* What is left of this entry, without opening it. */}
                  {todo.subTasks.total > 0 && (
                    <SubtaskMeter
                      className="mt-0.5"
                      total={todo.subTasks.total}
                      done={todo.subTasks.done}
                    />
                  )}
                  {todo.location && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <TodoLocationChip location={todo.location} />
                    </div>
                  )}
                </div>

                {/* The gutter. Same column on every row of every sheet, so a
                    stack of entries reads as one stripe of urgency. */}
                <span
                  data-numeric
                  className={cn(
                    'mt-0.5 font-mono text-[11px] leading-5 font-semibold',
                    GUTTER,
                    todo.status === 'completed'
                      ? 'text-muted-foreground/40'
                      : gutterInk[due.tone],
                  )}
                >
                  {due.short}
                </span>
              </motion.div>
            </ContextMenuTrigger>
          </TodoSheet>
          <ContextMenuContent
            onKeyDown={handleContextMenuKeyDown}
            style={
              {
                '--spine':
                  todo.priority === 'none'
                    ? 'var(--primary)'
                    : spineColor[todo.priority],
              } as React.CSSProperties
            }
            className="spine w-64 p-0 pl-[3px]"
          >
            {/* ── Header ── */}
            <div className="px-3 pt-3 pb-2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-tight truncate flex-1">
                  {todo.title}
                </p>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.15em] rounded-full px-1.5 py-0.5',
                    todo.status === 'completed' && 'bg-chart-3/15 text-chart-3',
                    todo.status === 'pending' && 'bg-chart-4/15 text-chart-4',
                    todo.status === 'overdue' &&
                      'bg-destructive/15 text-destructive',
                  )}
                >
                  {todo.status}
                </span>
              </div>
              {todo.priority !== 'none' && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      todo.priority === 'high' && 'bg-destructive',
                      todo.priority === 'medium' && 'bg-chart-4',
                      todo.priority === 'low' && 'bg-chart-2',
                    )}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {todo.priority} priority
                  </span>
                </div>
              )}
              {todo.recurrence && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Repeat className="size-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {describeRecurrence(todo.recurrence)}
                  </span>
                </div>
              )}
              {todo.subTasks.total > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <ListChecks className="size-3 text-muted-foreground" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {todo.subTasks.done} of {todo.subTasks.total} subtasks done
                  </span>
                </div>
              )}
            </div>

            <ContextMenuSeparator />

            {/* ── Actions ── */}
            <div className="p-1.5">
              <ContextMenuLabel>Actions</ContextMenuLabel>
              <ContextMenuGroup>
                <ContextMenuItem onSelect={() => setSheetIsOpen(true)}>
                  <ExternalLink className="size-4" />
                  Open details
                  <ContextMenuShortcut>O</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={() => setUpdateTodoDialogOpen(true)}>
                  <Pencil className="size-4" />
                  Edit twodo
                  <ContextMenuShortcut>E</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
            </div>

            <ContextMenuSeparator />

            {/* ── Organize ── */}
            <div className="p-1.5">
              <ContextMenuLabel>Organize</ContextMenuLabel>
              <ContextMenuGroup>
                {todo.listId ? (
                  <ContextMenuItem onSelect={() => handleMoveToList(undefined)}>
                    <Inbox className="size-4" />
                    Move to inbox
                    <ContextMenuShortcut>I</ContextMenuShortcut>
                  </ContextMenuItem>
                ) : null}
                <ContextMenuItem onSelect={() => setMoveToListOpen(true)}>
                  <FolderInput className="size-4" />
                  Move to list
                  <ContextMenuShortcut>M</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuGroup>
            </div>

            <ContextMenuSeparator />

            {/* ── Danger Zone ── */}
            <div className="p-1.5 bg-destructive/[0.03] dark:bg-destructive/[0.06] rounded-b-lg">
              <ContextMenuItem
                variant="destructive"
                onSelect={() => setDeleteTodoDialogOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete twodo
                <ContextMenuShortcut>Del</ContextMenuShortcut>
              </ContextMenuItem>
            </div>
          </ContextMenuContent>
        </ContextMenu>
      </>
    )
  },
)
