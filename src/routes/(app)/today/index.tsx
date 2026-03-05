import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { motion } from 'motion/react'
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
    <div className="p-3 sm:p-6 flex flex-col h-full">
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
      <header className="mb-4 sm:mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-semibold truncate">Todos for today</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Showing todos for today.
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
        </div>
      </header>
      <ScrollArea className="w-full h-75">
        <div className="space-y-6">
          {(!status || status === 'all' || status === 'pending') && (
            <StateHandler
              isFetching={isFetching}
              isError={isError}
              error={error}
              isEmpty={pendingTodos.length === 0}
              loadingSkeleton={
                <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
                  <h2 className="font-bold text-lg sm:text-xl">Pending Tasks</h2>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                </div>
              }
              emptyState={
                <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
                  <h2 className="font-bold text-lg sm:text-xl">Pending Tasks</h2>
                  <Empty>No pending tasks for today</Empty>
                </div>
              }
              errorTitle="Failed to load today's pending tasks"
              errorDescription="An error occurred while loading pending tasks. Please try again."
            >
              <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
                <h2 className="font-bold text-lg sm:text-xl">Pending Tasks</h2>
                {pendingTodos.map((todo: any) => (
                  <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
                    <TodoCard todo={todo} />
                  </motion.div>
                ))}
              </div>
            </StateHandler>
          )}

          {(!status || status === 'all' || status === 'completed') && (
            <StateHandler
              isFetching={isFetching}
              isError={isError}
              error={error}
              isEmpty={completedTodos.length === 0}
              loadingSkeleton={
                <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
                  <h2 className="font-bold text-lg sm:text-xl">Completed Tasks</h2>
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                </div>
              }
              emptyState={
                <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
                  <h2 className="font-bold text-lg sm:text-xl">Completed Tasks</h2>
                  <Empty>No completed tasks for today</Empty>
                </div>
              }
              errorTitle="Failed to load today's completed tasks"
              errorDescription="An error occurred while loading completed tasks. Please try again."
            >
              <div className="space-y-4 sm:space-y-6 p-2 sm:p-6">
                <h2 className="font-bold text-lg sm:text-xl">Completed Tasks</h2>
                {completedTodos.map((todo: any) => (
                  <motion.div key={todo._id} whileHover={{ scale: 1.03 }}>
                    <TodoCard todo={todo} />
                  </motion.div>
                ))}
              </div>
            </StateHandler>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
