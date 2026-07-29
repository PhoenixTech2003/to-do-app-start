import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useDebouncer } from '@tanstack/react-pacer'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useEffect, useRef, useState } from 'react'
import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Inbox, Search } from 'lucide-react'
import { format } from 'date-fns'
import { motion } from 'motion/react'
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
  Docket,
  DocketHeader,
  DocketRowsSkeleton,
} from '@/components/app/docket'
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
  loader: async () => {},
  pendingComponent: InboxRoutePending,
  component: InboxPage,
})

function InboxLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {['Unsorted', 'Upcoming'].map((label) => (
        <Docket key={label}>
          <DocketHeader label={label} />
          <DocketRowsSkeleton />
        </Docket>
      ))}
    </div>
  )
}

function InboxRoutePending() {
  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-3 w-44 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Skeleton className="hidden h-8 w-24 rounded-md sm:block" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
      <div className="flex-1 w-full">
        <InboxLoadingSkeleton />
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
          {searchActive
            ? 'No matches for your search'
            : 'Your inbox is clear'}
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

/**
 * One sheet of the inbox. Sections arrive in the order they ask to be dealt
 * with — what's late, what's coming, what hasn't been filed, what's done.
 */
function InboxSheet({
  label,
  count,
  urgent,
  delay,
  children,
}: {
  label: string
  count: number
  urgent?: boolean
  delay: number
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <Docket>
        <DocketHeader label={label} count={count} urgent={urgent} />
        {children}
      </Docket>
    </motion.section>
  )
}

function InboxPage() {
  const { searchTerm } = Route.useSearch()
  const navigate = Route.useNavigate()
  const isMobile = useIsMobile()
  const [searchOpen, setSearchOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchTerm ?? '')
  const pendingSearchRef = useRef<string | null>(null)
  const today = format(new Date(), 'yyyy-LL-dd')

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
    results: upcomingTodos,
    status: upcomingStatus,
    loadMore: loadMoreUpcoming,
  } = usePaginatedQuery(
    api.globals.queries.GetAllUpcomingTodos,
    {
      today,
      searchTerm: searchTerm || undefined,
    },
    { initialNumItems: 6 },
  )

  const {
    results: allOverdueTodos,
    status: allOverdueStatus,
    loadMore: loadMoreAllOverdue,
  } = usePaginatedQuery(
    api.globals.queries.GetAllOverdueTodos,
    {
      searchTerm: searchTerm || undefined,
    },
    { initialNumItems: 6 },
  )

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
    upcomingStatus === 'LoadingFirstPage' ||
    allOverdueStatus === 'LoadingFirstPage' ||
    pendingStatus === 'LoadingFirstPage' ||
    completedStatus === 'LoadingFirstPage'
  const isEmpty =
    upcomingTodos.length === 0 &&
    allOverdueTodos.length === 0 &&
    pendingTodos.length === 0 &&
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

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Inbox
            </h2>
            {/* The standing, in one line rather than a row of stat boxes. */}
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
              {isEmpty ? (
                'Capture now, file later'
              ) : (
                <>
                  {allOverdueTodos.length > 0 && (
                    <>
                      <span data-numeric className="text-destructive">
                        {allOverdueTodos.length} late
                      </span>
                      <span className="text-muted-foreground/30">/</span>
                    </>
                  )}
                  <span data-numeric>{upcomingTodos.length} upcoming</span>
                  <span className="text-muted-foreground/30">/</span>
                  <span data-numeric>{pendingTodos.length} unfiled</span>
                </>
              )}
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
          <div className="space-y-4 pb-8">
            {allOverdueTodos.length > 0 && (
              <InboxSheet
                label="Late — every list"
                count={allOverdueTodos.length}
                urgent
                delay={0}
              >
                {allOverdueTodos.map((todo) => (
                  <TodoCard key={todo._id} todo={todo} />
                ))}
                <PaginationController
                  status={allOverdueStatus}
                  loadMore={loadMoreAllOverdue}
                  resultsCount={allOverdueTodos.length}
                  label="Late"
                  initialNumItems={6}
                />
              </InboxSheet>
            )}

            {pendingTodos.length > 0 && (
              <InboxSheet
                label="Unfiled"
                count={pendingTodos.length}
                delay={0.06}
              >
                {pendingTodos.map((todo) => (
                  <TodoCard key={todo._id} todo={todo} />
                ))}
                <PaginationController
                  status={pendingStatus}
                  loadMore={loadMorePending}
                  resultsCount={pendingTodos.length}
                  label="Unfiled"
                  initialNumItems={6}
                />
              </InboxSheet>
            )}

            {upcomingTodos.length > 0 && (
              <InboxSheet
                label="Upcoming — every list"
                count={upcomingTodos.length}
                delay={0.12}
              >
                {upcomingTodos.map((todo) => (
                  <TodoCard key={todo._id} todo={todo} />
                ))}
                <PaginationController
                  status={upcomingStatus}
                  loadMore={loadMoreUpcoming}
                  resultsCount={upcomingTodos.length}
                  label="Upcoming"
                  initialNumItems={6}
                />
              </InboxSheet>
            )}

            {completedTodos.length > 0 && (
              <InboxSheet
                label="Completed"
                count={completedTodos.length}
                delay={0.18}
              >
                {completedTodos.map((todo) => (
                  <TodoCard key={todo._id} todo={todo} />
                ))}
                <PaginationController
                  status={completedStatus}
                  loadMore={loadMoreCompleted}
                  resultsCount={completedTodos.length}
                  label="Completed"
                  initialNumItems={6}
                />
              </InboxSheet>
            )}
          </div>
        </StateHandler>
      </div>
    </div>
  )
}
