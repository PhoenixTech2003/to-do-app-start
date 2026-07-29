import { createFileRoute } from '@tanstack/react-router'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { AnimatePresence } from 'motion/react'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { format } from 'date-fns'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { useDebouncer } from '@tanstack/react-pacer'
import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { BackButton } from '@/components/app/back-button'
import { TodoCard } from '@/components/app/todos/todo-card'
import { TodosPageSkeleton } from '@/components/app/todos/todos-page-skeleton'
import { StateHandler } from '@/components/app/state-handler'
import {
  Docket,
  DocketEmpty,
  DocketRowsSkeleton,
} from '@/components/app/docket'
import { TodoSectionHeading } from '@/components/app/todos/section-heading'

import { SearchInput } from '@/components/app/search-box'
import { Button } from '@/components/ui/button'

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
    status,
  }),
  loader: async () => {
    // Data fetched via Convex useQuery for optimistic update support
  },
  pendingComponent: TodosPageSkeleton,
  component: TodayPage,
})

function TodayPage() {
  const deps = Route.useLoaderDeps()
  const { searchTerm, priority, status } = Route.useSearch()
  const navigate = Route.useNavigate()
  const data = useQuery(api.globals.queries.getTodosByDate, {
    date: deps.today,
    searchTerm: deps.searchTerm,
    priority: deps.priority === 'all' ? undefined : deps.priority,
  })

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

  const todos = data?.todos ?? []
  const pendingTodos = todos.filter((t: any) => t.status === 'pending')
  const completedTodos = todos.filter((t: any) => t.status === 'completed')
  const lateTodos = todos.filter((t: any) => t.status === 'overdue')

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
          navigate({
            search: (prev: any) => ({ ...prev, priority: val as any }),
            replace: true,
          })
        }}
        status={localStatus}
        onStatusChange={(val) => {
          setLocalStatus(val as any)
          navigate({
            search: (prev: any) => ({ ...prev, status: val as any }),
            replace: true,
          })
        }}
      />

      <header className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              Today
            </h2>
            {/* The day's standing, in one line. Terracotta only if something
                is already late — the same rule the whole app runs on. */}
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
              <time dateTime={deps.today}>
                {format(new Date(), 'EEEE d MMMM')}
              </time>
              {todos.length > 0 && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span data-numeric>
                    {completedTodos.length} of {todos.length} struck
                  </span>
                </>
              )}
              {lateTodos.length > 0 && (
                <>
                  <span className="text-muted-foreground/30">/</span>
                  <span data-numeric className="text-destructive">
                    {lateTodos.length} late
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="hidden h-8 gap-2 rounded-md px-3 text-xs sm:inline-flex"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatForDisplay('Mod+K')}
          </span>
        </Button>
      </header>

      <ScrollArea className="w-full flex-1">
        <div className="space-y-4 pb-8">
          {(!status || status === 'all' || status === 'pending') && (
            <Docket>
              <TodoSectionHeading
                tone="pending"
                title="Pending"
                count={pendingTodos.length}
              />
              <StateHandler
                isLoading={data === undefined}
                isError={false}
                error={null}
                isEmpty={pendingTodos.length === 0}
                loadingSkeleton={<DocketRowsSkeleton />}
                emptyState={
                  <DocketEmpty>Nothing left for today.</DocketEmpty>
                }
                errorTitle="Failed to load pending tasks"
                errorDescription="An error occurred. Please try again."
              >
                <AnimatePresence mode="popLayout">
                  {pendingTodos.map((todo: any) => (
                    <TodoCard key={todo._id} todo={todo} />
                  ))}
                </AnimatePresence>
              </StateHandler>
            </Docket>
          )}

          {(!status || status === 'all' || status === 'completed') && (
            <Docket>
              <TodoSectionHeading
                tone="completed"
                title="Completed"
                count={completedTodos.length}
              />
              <StateHandler
                isLoading={data === undefined}
                isError={false}
                error={null}
                isEmpty={completedTodos.length === 0}
                loadingSkeleton={<DocketRowsSkeleton rows={2} />}
                emptyState={
                  <DocketEmpty>Nothing struck off yet today.</DocketEmpty>
                }
                errorTitle="Failed to load completed tasks"
                errorDescription="An error occurred. Please try again."
              >
                <AnimatePresence mode="popLayout">
                  {completedTodos.map((todo: any) => (
                    <TodoCard key={todo._id} todo={todo} />
                  ))}
                </AnimatePresence>
              </StateHandler>
            </Docket>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
