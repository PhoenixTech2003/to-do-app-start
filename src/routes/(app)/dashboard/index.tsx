import { Search } from 'lucide-react'
import { api } from 'convex/_generated/api'
import { usePaginatedQuery } from 'convex/react'
import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDebouncer } from '@tanstack/react-pacer'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { zodValidator } from '@tanstack/zod-adapter'
import { z } from 'zod'
import { CreateWorkspaceDialog } from '@/components/app/dashboard/create-workspace-dialog'
import { DashboardLoadingSkeleton } from '@/components/app/dashboard/dashboard-loading-skeleton'
import { DashboardPageSkeleton } from '@/components/app/dashboard/dashboard-page-skeleton'
import { NoWorkspacesEmptyState } from '@/components/app/dashboard/no-workspaces-empty-state'
import { PaginationController } from '@/components/app/pagination-controller'
import { SearchInput } from '@/components/app/search-box'
import { StateHandler } from '@/components/app/state-handler'
import { WorkspaceList } from '@/components/app/dashboard/workspace-list'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

const searchSchema = z.object({
  searchTerm: z.string().optional(),
})

export const Route = createFileRoute('/(app)/dashboard/')({
  validateSearch: zodValidator(searchSchema),
  pendingComponent: DashboardPageSkeleton,
  component: DashboardPage,
})

function DashboardPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { searchTerm } = Route.useSearch()
  const [localSearch, setLocalSearch] = useState(searchTerm ?? '')
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

  const {
    results: data,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.dashboard.queries.getUserWorkspaces,
    { searchTerm: searchTerm },
    { initialNumItems: 6 },
  )

  const isLoading = paginationStatus === 'LoadingFirstPage'
  const isFetching = paginationStatus === 'LoadingMore'
  const isError = false
  const error = null

  const handleSearch = (q: string) => {
    pendingSearchRef.current = q
    navigate({
      to: '/dashboard',
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

  return (
    <>
      <SearchInput
        searchTerm={localSearch}
        onSearch={onSearchChange}
        open={searchOpen}
        onOpenChange={setSearchOpen}
        alwaysVisible={isMobile}
      />
      {/* The header stays outside the state handler: an empty account still
          needs its title, its search and its way to create the first one. */}
      <div className="space-y-6 pb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
              Workspaces
            </h1>
            <p
              data-numeric
              className="mt-1 font-mono text-[11px] text-muted-foreground"
            >
              {isLoading
                ? 'Loading'
                : data.length === 1
                  ? '1 workspace'
                  : `${data.length} workspaces`}
              {searchTerm ? ` matching “${searchTerm}”` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
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
            <CreateWorkspaceDialog />
          </div>
        </div>

        <StateHandler
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
          isEmpty={data.length === 0}
          loadingSkeleton={<DashboardLoadingSkeleton />}
          emptyState={<NoWorkspacesEmptyState />}
          errorTitle="Failed to load workspaces"
          errorDescription="An error occurred while loading your workspaces. Please try again."
        >
          <WorkspaceList workspaceListData={data}>
            <PaginationController
              status={paginationStatus}
              loadMore={loadMore}
              resultsCount={data.length}
              label="Workspaces"
              initialNumItems={6}
            />
          </WorkspaceList>
        </StateHandler>
      </div>
    </>
  )
}
