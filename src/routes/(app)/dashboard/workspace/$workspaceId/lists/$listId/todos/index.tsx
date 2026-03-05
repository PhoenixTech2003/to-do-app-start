import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import type { Id } from 'convex/_generated/dataModel'
import { CreateTodoDialog } from '@/components/app/todos/create-todo-dialog'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { BackButton } from '@/components/app/back-button'
import { PendingTodosSection } from '@/components/app/todos/pending-todos-section'
import { OverdueTodosSection } from '@/components/app/todos/overdue-todos-section'
import { CompletedTodosSection } from '@/components/app/todos/completed-todos-section'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { KanbanBoard } from '@/components/app/kanban-board'
import { ViewModeTrigger } from '@/components/app/todos/view-mode'
import { useIsMobile } from '@/hooks/use-mobile'
import { SearchInput } from '@/components/app/search-box'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useDebouncer } from '@tanstack/react-pacer'
import { useEffect, useRef, useState } from 'react'

const viewModeSchema = z.object({
  view: z.enum(['list', 'kanban']).default('list'),
  searchTerm: z.string().optional(),
  priority: z.enum(['all', 'high', 'medium', 'low', 'none']).optional(),
  status: z.enum(['all', 'pending', 'overdue', 'completed']).optional(),
})

export const Route = createFileRoute(
  '/(app)/dashboard/workspace/$workspaceId/lists/$listId/todos/',
)({
  validateSearch: zodValidator(viewModeSchema),
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.todos.queries.GetListDetails, {
        listId: opts.params.listId as Id<'lists'>,
      }),
    )
  },
  pendingComponent: TodosPageSkeleton,
  component: RouteComponent,
})

function RouteComponent() {
  const { listId, workspaceId } = Route.useParams()
  const { view: searchView, searchTerm, priority, status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const isMobile = useIsMobile()
  const view = isMobile ? 'list' : searchView
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.todos.queries.GetListDetails, {
      listId: listId as Id<'lists'>,
    }),
  )

  const [localSearch, setLocalSearch] = useState(searchTerm ?? '')
  const [localPriority, setLocalPriority] = useState(priority ?? 'all')
  const [localStatus, setLocalStatus] = useState(status ?? 'all')
  const [searchOpen, setSearchOpen] = useState(false)
  const pendingSearchRef = useRef<string | null>(null)

  useEffect(() => {
    const urlValue = searchTerm ?? ''
    if (
      pendingSearchRef.current !== null &&
      urlValue !== pendingSearchRef.current
    ) {
      return
    }
    pendingSearchRef.current = null
    setLocalSearch(urlValue)
  }, [searchTerm])

  const handleSearch = (q: string) => {
    pendingSearchRef.current = q
    navigate({
      search: (prev: any) => ({ ...prev, searchTerm: q }),
      replace: true,
    })
  }
  const debouncer = useDebouncer(handleSearch, {
    wait: 200,
  })

  const onSearchChange = (q: string) => {
    setLocalSearch(q)
    debouncer.maybeExecute(q)
  }

  return (
    <div className="p-3 sm:p-6 flex flex-col min-w-0">
      <SearchInput
        searchTerm={localSearch}
        onSearch={onSearchChange}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        alwaysVisible={isMobile}
        showTodoFilters={true}
        priority={localPriority}
        onPriorityChange={(val) => {
          setLocalPriority(val as any)
          navigate({ search: (prev: any) => ({ ...prev, priority: val as any }), replace: true })
        }}
        status={localStatus}
        onStatusChange={(val) => {
          setLocalStatus(val as any)
          navigate({ search: (prev: any) => ({ ...prev, status: val as any }), replace: true })
        }}
      />
      <header className="mb-4 sm:mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold flex items-center gap-2 truncate">
              <span className="truncate">{data.title} List</span>
              {isFetching ? (
                <Spinner className="text-muted-foreground shrink-0" />
              ) : null}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing todos for this list.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex gap-1.5"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
            {formatForDisplay('Mod+K')}
          </Button>
          <ViewModeTrigger
            mode={view}
            listId={listId}
            workspaceId={workspaceId}
          />
          <CreateTodoDialog listId={listId as Id<'lists'>} />
        </div>
      </header>
      {isError ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Failed to load list</AlertTitle>
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred.'}
          </AlertDescription>
        </Alert>
      ) : null}
      <section className="min-w-0 overflow-hidden">
        {view === 'kanban' && <KanbanBoard listId={listId as Id<'lists'>} searchTerm={searchTerm} priority={priority} />}

        {view === 'list' && (
          <div className="space-y-2">
            {(!status || status === 'all' || status === 'pending') && (
              <PendingTodosSection listId={listId as Id<'lists'>} searchTerm={searchTerm} priority={priority} />
            )}
            {(!status || status === 'all' || status === 'overdue') && (
              <OverdueTodosSection listId={listId as Id<'lists'>} searchTerm={searchTerm} priority={priority} />
            )}
            {(!status || status === 'all' || status === 'completed') && (
              <CompletedTodosSection listId={listId as Id<'lists'>} searchTerm={searchTerm} priority={priority} />
            )}
          </div>
        )}
      </section>
    </div>
  )
}
