import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useDebouncer } from '@tanstack/react-pacer'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useEffect, useRef, useState } from 'react'
import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Inbox, Search } from 'lucide-react'
import { z } from 'zod'
import { BackButton } from '@/components/app/back-button'
import { PaginationController } from '@/components/app/pagination-controller'
import { SearchInput } from '@/components/app/search-box'
import { StateHandler } from '@/components/app/state-handler'
import { CreateTodoDialog } from '@/components/app/todos/create-todo-dialog'
import { TodoCard } from '@/components/app/todos/todo-card'
import { useIsMobile } from '@/hooks/use-mobile'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

const inboxSearchSchema = z.object({
  searchTerm: z.string().optional(),
})

export const Route = createFileRoute('/(app)/inbox/')({
  validateSearch: zodValidator(inboxSearchSchema),
  component: InboxPage,
})

function InboxLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-5 w-32 rounded" />
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}

function InboxEmptyState({ searchActive }: { searchActive: boolean }) {
  return (
    <Empty className="py-20">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>
          {searchActive ? 'No matches for your search' : 'Your inbox is clear'}
        </EmptyTitle>
        <EmptyDescription>
          {searchActive
            ? 'Try a different search term to find the todo you are looking for.'
            : "Todos that haven't been assigned to a list will show up here. Capture quick thoughts now, organize them later."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

function InboxPage() {
  const { searchTerm } = Route.useSearch()
  const navigate = Route.useNavigate()
  const isMobile = useIsMobile()
  const [searchOpen, setSearchOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchTerm ?? '')
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
      search: { searchTerm: q },
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

  const {
    results: pendingTodos,
    status: pendingStatus,
    loadMore: loadMorePending,
  } = usePaginatedQuery(
    api.todos.queries.GetInboxPendingTodos,
    {
      searchTerm: searchTerm || undefined,
    },
    { initialNumItems: 6 },
  )
  const {
    results: overdueTodos,
    status: overdueStatus,
    loadMore: loadMoreOverdue,
  } = usePaginatedQuery(
    api.todos.queries.GetInboxOverdueTodos,
    {
      searchTerm: searchTerm || undefined,
    },
    { initialNumItems: 6 },
  )
  const {
    results: completedTodos,
    status: completedStatus,
    loadMore: loadMoreCompleted,
  } = usePaginatedQuery(
    api.todos.queries.GetInboxCompletedTodos,
    {
      searchTerm: searchTerm || undefined,
    },
    { initialNumItems: 6 },
  )

  const isLoading =
    pendingStatus === 'LoadingFirstPage' ||
    overdueStatus === 'LoadingFirstPage' ||
    completedStatus === 'LoadingFirstPage'
  const isEmpty =
    pendingTodos.length === 0 &&
    overdueTodos.length === 0 &&
    completedTodos.length === 0
  const searchActive = Boolean(searchTerm?.trim())

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <SearchInput
        searchTerm={localSearch}
        onSearch={onSearchChange}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        alwaysVisible={isMobile}
        showTodoFilters={false}
      />

      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Inbox
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Capture now, organize later
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex gap-2 h-8 px-3 rounded-md text-xs"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="font-mono text-[10px] text-muted-foreground">
              {formatForDisplay('Mod+K')}
            </span>
          </Button>
          <CreateTodoDialog
            title="Capture Inbox Todo"
            description="Add a todo to your inbox now and assign it to a list later."
            buttonLabel="Capture Todo"
          />
        </div>
      </header>

      <div className="flex-1 w-full">
        <StateHandler
          isLoading={isLoading}
          isError={false}
          error={null}
          isEmpty={isEmpty}
          loadingSkeleton={<InboxLoadingSkeleton />}
          emptyState={<InboxEmptyState searchActive={searchActive} />}
        >
          <div className="space-y-8">
            {pendingTodos.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-4" />
                    <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Unsorted
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                    {pendingTodos.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {pendingTodos.map((todo) => (
                    <TodoCard key={todo._id} todo={todo} />
                  ))}
                </div>
                <PaginationController
                  status={pendingStatus}
                  loadMore={loadMorePending}
                  resultsCount={pendingTodos.length}
                  label="Inbox Todos"
                  initialNumItems={6}
                />
              </div>
            )}

            {overdueTodos.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Overdue
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                    {overdueTodos.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {overdueTodos.map((todo) => (
                    <TodoCard key={todo._id} todo={todo} />
                  ))}
                </div>
                <PaginationController
                  status={overdueStatus}
                  loadMore={loadMoreOverdue}
                  resultsCount={overdueTodos.length}
                  label="Overdue Inbox Todos"
                  initialNumItems={6}
                />
              </div>
            )}

            {completedTodos.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                    <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Completed
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
                    {completedTodos.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {completedTodos.map((todo) => (
                    <TodoCard key={todo._id} todo={todo} />
                  ))}
                </div>
                <PaginationController
                  status={completedStatus}
                  loadMore={loadMoreCompleted}
                  resultsCount={completedTodos.length}
                  label="Completed Inbox Todos"
                  initialNumItems={6}
                />
              </div>
            )}
          </div>
        </StateHandler>
      </div>
    </div>
  )
}
