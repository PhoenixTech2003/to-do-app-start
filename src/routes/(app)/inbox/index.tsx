import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'
import { useDebouncer } from '@tanstack/react-pacer'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useEffect, useRef, useState } from 'react'
import { usePaginatedQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  AlertTriangle,
  CalendarClock,
  Inbox,
  PackageOpen,
  Search,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
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
    <div className="space-y-8">
      <div className="grid grid-cols-3 rounded-md border bg-card divide-x divide-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 sm:p-4 space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-10 rounded" />
            <Skeleton className="h-2.5 w-20 rounded" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_s, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-32 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_r, j) => (
              <Skeleton key={j} className="h-20 w-full rounded-md" />
            ))}
          </div>
        </div>
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

function InboxStatCell({
  label,
  value,
  icon: Icon,
  accentClass,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  accentClass: string
}) {
  return (
    <div className="p-3 sm:p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn('size-3', accentClass)} />
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </span>
      </div>
      <p className="text-lg font-bold tabular-nums font-mono">{value}</p>
    </div>
  )
}

function SectionHeader({
  label,
  count,
  dotClass,
  delay = 0,
}: {
  label: string
  count: number
  dotClass: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-center justify-between pb-2 border-b border-border"
    >
      <div className="flex items-center gap-2">
        <div className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
        <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </h2>
      </div>
      <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
        {count}
      </span>
    </motion.div>
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

      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Inbox
            </h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {allOverdueTodos.length > 0
                ? `${allOverdueTodos.length} overdue — needs attention`
                : 'Capture now, organize later'}
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
          <div className="space-y-10">
            {/* Stats Strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 rounded-md border bg-card divide-x divide-border"
            >
              <InboxStatCell
                label="Overdue"
                value={allOverdueTodos.length}
                icon={AlertTriangle}
                accentClass="text-destructive"
              />
              <InboxStatCell
                label="Upcoming"
                value={upcomingTodos.length}
                icon={CalendarClock}
                accentClass="text-chart-4"
              />
              <InboxStatCell
                label="Unsorted"
                value={pendingTodos.length}
                icon={PackageOpen}
                accentClass="text-chart-2"
              />
            </motion.div>

            {/* Overdue — All Lists */}
            {allOverdueTodos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.06 }}
                className="flex flex-col gap-3"
              >
                <SectionHeader
                  label="Overdue — All Lists"
                  count={allOverdueTodos.length}
                  dotClass="bg-destructive"
                  delay={0.06}
                />
                <div className="space-y-2">
                  {allOverdueTodos.map((todo) => (
                    <TodoCard key={todo._id} todo={todo} />
                  ))}
                </div>
                <PaginationController
                  status={allOverdueStatus}
                  loadMore={loadMoreAllOverdue}
                  resultsCount={allOverdueTodos.length}
                  label="Overdue Todos"
                  initialNumItems={6}
                />
              </motion.section>
            )}

            {/* Upcoming — All Lists */}
            {upcomingTodos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.12 }}
                className="flex flex-col gap-3"
              >
                <SectionHeader
                  label="Upcoming — All Lists"
                  count={upcomingTodos.length}
                  dotClass="bg-chart-4"
                  delay={0.12}
                />
                <div className="space-y-2">
                  {upcomingTodos.map((todo) => (
                    <TodoCard key={todo._id} todo={todo} />
                  ))}
                </div>
                <PaginationController
                  status={upcomingStatus}
                  loadMore={loadMoreUpcoming}
                  resultsCount={upcomingTodos.length}
                  label="Upcoming Todos"
                  initialNumItems={6}
                />
              </motion.section>
            )}

            {/* Unsorted — Inbox Only */}
            {pendingTodos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.18 }}
                className="flex flex-col gap-3"
              >
                <SectionHeader
                  label="Unsorted"
                  count={pendingTodos.length}
                  dotClass="bg-chart-2"
                  delay={0.18}
                />
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
              </motion.section>
            )}

            {/* Completed — Inbox Only */}
            {completedTodos.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.24 }}
                className="flex flex-col gap-3"
              >
                <SectionHeader
                  label="Completed"
                  count={completedTodos.length}
                  dotClass="bg-chart-3"
                  delay={0.24}
                />
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
              </motion.section>
            )}
          </div>
        </StateHandler>
      </div>
    </div>
  )
}
