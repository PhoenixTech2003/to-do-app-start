import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  CalendarIcon,
  ClockIcon,
  ExternalLink,
  FolderInput,
  Inbox,
  Pencil,
  Trash2,
} from 'lucide-react'
import { forwardRef, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { TodoSheet } from './todo-sheet'
import { TodoCheckInput } from './todo-check-input'
import { DeleteDialog } from '../delete-dialog'
import { UpdateDialog } from '../update-dialog'
import { UpdateTodoForm } from './update-todo-form'
import type { Todo } from '@/types/global'
import { cn, truncateText } from '@/lib/utils'
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
  todo: Todo
}

export const TodoCard = forwardRef<HTMLDivElement, TodoCardProps>(
  ({ todo }: TodoCardProps, ref) => {
    const [sheetIsOpen, setSheetIsOpen] = useState(false)
    const [updateTodoDialogOpen, setUpdateTodoDialogOpen] = useState(false)
    const [deleteTodoDialogOpen, setDeleteTodoDialogOpen] = useState(false)
    const [moveToListOpen, setMoveToListOpen] = useState(false)
    const [contextMenuOpen, setContextMenuOpen] = useState(false)
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

      const removeTodoFromQueries = (queryRef: any) => {
        const queries = localStore.getAllQueries(queryRef)
        for (const { args: qArgs, value } of queries) {
          if (!matchesQueryList(qArgs)) continue
          if (!value) continue

          const pageContainsTodo = value.page.some((t: Todo) => t._id === mutationTodoId)
          if (!pageContainsTodo) continue

          localStore.setQuery(queryRef, qArgs, {
            ...value,
            page: value.page.filter((t: Todo) => t._id !== mutationTodoId),
            isDone: false,
            continueCursor: 'optimistic',
          })
        }
      }

      removeTodoFromQueries(api.todos.queries.GetPendingTodos)
      removeTodoFromQueries(api.todos.queries.GetCompletedTodos)
      removeTodoFromQueries(api.todos.queries.GetOverDueTodos)
      removeTodoFromQueries(api.todos.queries.GetInboxPendingTodos)
      removeTodoFromQueries(api.todos.queries.GetInboxCompletedTodos)
      removeTodoFromQueries(api.todos.queries.GetInboxOverdueTodos)

      const byDateQueries = localStore.getAllQueries(api.globals.queries.getTodosByDate)
      for (const { args: qArgs, value: byDateData } of byDateQueries) {
        if (!byDateData) continue

        const hasTodo = byDateData.todos.some((t: Todo) => t._id === mutationTodoId)
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

    const priorityBorder: Record<string, string> = {
      high: 'border-l-destructive',
      medium: 'border-l-chart-4',
      low: 'border-l-chart-2',
      none: 'border-l-border',
    }
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
          return 'Twodo has been deleted succussfully'
        },
        error: 'Failed to delete the Twodo',
      })
    }

    function handleMoveToList(listId?: string) {
      const moveTodoPromise = moveTodoToList({
        todoId: todo._id,
        listId: listId as any,
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
        setContextMenuOpen(false)
        action()
      }
    }

    return (
      <>
        <UpdateDialog
          showTrigger={false}
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
        <ContextMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
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
                transition={{ duration: 0.2 }}
                onClick={() => setSheetIsOpen(true)}
                className={cn(
                  'group relative flex flex-col gap-2 p-4 bg-card border border-border rounded-md cursor-pointer transition-colors duration-200 hover:bg-accent border-l-[3px]',
                  priorityBorder[todo.priority] || priorityBorder.none,
                  todo.status === 'completed' && 'opacity-50',
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                      <TodoCheckInput todo={todo} />
                    </div>
                    <div className="flex flex-col min-w-0 gap-1">
                      <h3
                        className={cn(
                          'text-sm font-medium leading-tight',
                          todo.status === 'completed' &&
                            'line-through text-muted-foreground',
                        )}
                      >
                        {title}
                      </h3>
                      {description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                    {todo.priority !== 'none' ? todo.priority : ''}
                  </span>
                </div>

                {(todo.dueDate || todo.dueTime) && (
                  <div className="flex items-center gap-3 pl-8">
                    <div
                      className={cn(
                        'flex items-center gap-3 font-mono text-[11px]',
                        todo.status === 'overdue'
                          ? 'text-destructive'
                          : 'text-muted-foreground',
                      )}
                    >
                      {todo.dueDate && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {format(todo.dueDate, 'dd MMM yyyy')}
                        </span>
                      )}
                      {todo.dueTime && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {todo.dueTime}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </ContextMenuTrigger>
          </TodoSheet>
          <ContextMenuContent
            onKeyDown={handleContextMenuKeyDown}
            className={cn(
              'w-64 border-l-[3px] p-0',
              todo.priority === 'high' && 'border-l-destructive',
              todo.priority === 'medium' && 'border-l-chart-4',
              todo.priority === 'low' && 'border-l-chart-2',
              todo.priority === 'none' && 'border-l-primary/40',
            )}
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
                    todo.status === 'completed' &&
                      'bg-chart-3/15 text-chart-3',
                    todo.status === 'pending' &&
                      'bg-chart-4/15 text-chart-4',
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
