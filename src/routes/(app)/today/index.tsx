import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { AnimatePresence } from 'motion/react'
import { convexQuery } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { BackButton } from '@/components/app/back-button'
import { TodoCard } from '@/components/app/todos/todo-card'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { StateHandler } from '@/components/app/state-handler'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'

import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useDebouncer } from '@tanstack/react-pacer'
import { useEffect, useRef, useState } from 'react'
import { SearchInput } from '@/components/app/search-box'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'

const todaySearchSchema = z.object({
  searchTerm: z.string().optional(),
  priority: z.enum(['all', 'high', 'medium', 'low', 'none']).optional(),
  status: z.enum(['all', 'pending', 'completed']).optional(),
})
export const Route = createFileRoute('/(app)/today/')({
  validateSearch: zodValidator(todaySearchSchema),
  loaderDeps: ({ search: { searchTerm, priority, status } }) => ({
    today: format(new Date(), 'yyyy-LL-dd'),
    searchTerm,
    priority,
    status
  }),
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.globals.queries.getTodosByDate, {
        date: opts.deps.today,
        searchTerm: opts.deps.searchTerm,
        priority: opts.deps.priority === 'all' ? undefined : opts.deps.priority,
      }),
    )
  },
  pendingComponent: TodosPageSkeleton,
  component: TodayPage,
})

function TodayPage() {
  const deps = Route.useLoaderDeps()
  const { searchTerm, priority, status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data, isFetching, isError, error } = useSuspenseQuery(
    convexQuery(api.globals.queries.getTodosByDate, {
      date: deps.today,
      searchTerm: deps.searchTerm,
      priority: deps.priority === 'all' ? undefined : deps.priority,
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

  const pendingTodos = data.todos.filter((t: any) => t.status === 'pending')
  const completedTodos = data.todos.filter((t: any) => t.status === 'completed')

  return (
    <div className="p-4 sm:p-6 flex flex-col h-full">
      <SearchInput
        searchTerm={localSearch}
        onSearch={onSearchChange}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        alwaysVisible={false}
        showTodoFilters={true}
        allowedStatuses={['pending', 'completed']}
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

      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Today</h2>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              {format(new Date(), 'EEEE, MMMM do')}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex gap-2 h-8 px-3 rounded-md text-xs"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="font-mono text-[10px] text-muted-foreground">{formatForDisplay('Mod+K')}</span>
        </Button>
      </header>

      <ScrollArea className="flex-1 w-full">
        <div className="space-y-8">
          {(!status || status === 'all' || status === 'pending') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-chart-4" />
                  <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">Pending</h2>
                </div>
                <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">{pendingTodos.length}</span>
              </div>

              <StateHandler
                isFetching={isFetching}
                isError={isError}
                error={error}
                isEmpty={pendingTodos.length === 0}
                loadingSkeleton={
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-md" />
                    ))}
                  </div>
                }
                emptyState={<Empty>No pending tasks for today</Empty>}
                errorTitle="Failed to load pending tasks"
                errorDescription="An error occurred. Please try again."
              >
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {pendingTodos.map((todo: any) => (
                      <TodoCard key={todo._id} todo={todo} />
                    ))}
                  </AnimatePresence>
                </div>
              </StateHandler>
            </div>
          )}

          {(!status || status === 'all' || status === 'completed') && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                  <h2 className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-muted-foreground">Completed</h2>
                </div>
                <span className="font-mono text-[10px] font-bold text-muted-foreground tabular-nums">{completedTodos.length}</span>
              </div>

              <StateHandler
                isFetching={isFetching}
                isError={isError}
                error={error}
                isEmpty={completedTodos.length === 0}
                loadingSkeleton={
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-md" />
                    ))}
                  </div>
                }
                emptyState={<Empty>No completed tasks for today</Empty>}
                errorTitle="Failed to load completed tasks"
                errorDescription="An error occurred. Please try again."
              >
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {completedTodos.map((todo: any) => (
                      <TodoCard key={todo._id} todo={todo} />
                    ))}
                  </AnimatePresence>
                </div>
              </StateHandler>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
