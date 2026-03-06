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

  const [refreshKey, setRefreshKey] = useState(0)
  const {
    results: data,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.dashboard.queries.getUserWorkspaces,
    {
      searchTerm: searchTerm,
      refreshKey,
    },
    { initialNumItems: 6 },
  )

  const isLoading = paginationStatus === 'LoadingFirstPage'
  const isFetching = paginationStatus === 'LoadingMore'
  const isError = false // handled by convex if needed, but usePaginatedQuery doesn't return isError directly in the same way as useQuery
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
        <div className="space-y-4 pb-24">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-3xl font-bold truncate min-w-0">
              Your Workspaces
            </h1>
            <div className="flex items-center gap-2 sm:gap-4">
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
          <WorkspaceList workspaceListData={data} />
          <PaginationController
            status={paginationStatus}
            loadMore={loadMore}
            isFetching={isFetching}
            resultsCount={data.length}
            label="Workspaces"
            onToggleShowFewer={() => setRefreshKey((prev) => prev + 1)}
            initialNumItems={6}
          />
        </div>
      </StateHandler>
    </>
  )
}
