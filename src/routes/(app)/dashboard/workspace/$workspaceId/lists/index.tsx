import { convexQuery } from '@convex-dev/react-query'
import { usePaginatedQuery } from 'convex/react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useDebouncer } from '@tanstack/react-pacer'
import { formatForDisplay } from '@tanstack/react-hotkeys'
import { Search } from 'lucide-react'
import { api } from 'convex/_generated/api'
import { z } from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'
import { AnimatePresence, motion } from 'motion/react'
import type { Id } from 'convex/_generated/dataModel'
import { ListCard } from '@/components/app/workspace/list-card'
import { StateHandler } from '@/components/app/state-handler'
import { WorkspaceLoadingSkeleton } from '@/components/app/workspace/workspace-loading-skeleton'
import { NoListsEmptyState } from '@/components/app/workspace/no-lists-empty-state'
import { CreateListDialog } from '@/components/app/workspace/create-list-dialog'
import { ListsPageSkeleton } from '@/components/app/workspace/lists-page-skeleton'
import { BackButton } from '@/components/app/back-button'
import { SearchInput } from '@/components/app/search-box'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { PaginationController } from '@/components/app/pagination-controller'

const searchSchema = z.object({
  searchTerm: z.string().optional(),
})

export const Route = createFileRoute(
  '/(app)/dashboard/workspace/$workspaceId/lists/',
)({
  validateSearch: zodValidator(searchSchema),
  pendingComponent: ListsPageSkeleton,
  component: WorkspaceListsPage,
})

function WorkspaceListsPage() {
  const navigate = useNavigate()
  const { workspaceId } = Route.useParams()
  const isMobile = useIsMobile()
  const { searchTerm } = Route.useSearch()
  const [localSearch, setLocalSearch] = useState(searchTerm ?? '')
  const [searchOpen, setSearchOpen] = useState(false)
  const [showFewer, _setShowFewer] = useState(false)
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
    data: workspaceDetails,
    isLoading: isLoadingWorkspace,
    isError: isErrorWorkspace,
    error: errorWorkspace,
  } = useQuery(
    convexQuery(api.workspace.queries.GetWorkspaceDetails, {
      workspaceId: workspaceId as Id<'workspace'>,
    }),
  )

  const [refreshKey, setRefreshKey] = useState(0)
  const {
    results: lists,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.workspace.queries.GetWorkspaceLists,
    {
      workspaceId: workspaceId as Id<'workspace'>,
      searchTerm: searchTerm,
      refreshKey,
    },
    { initialNumItems: 6 },
  )

  const isLoading =
    isLoadingWorkspace || paginationStatus === 'LoadingFirstPage'
  const isError = isErrorWorkspace
  const error = errorWorkspace
  const isFetching = paginationStatus === 'LoadingMore'
  const displayedLists = lists

  const handleSearch = (q: string) => {
    pendingSearchRef.current = q
    navigate({
      to: '/dashboard/workspace/$workspaceId/lists',
      params: { workspaceId },
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
        placeholder="Search lists..."
      />
      <StateHandler
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
        isEmpty={lists.length === 0}
        loadingSkeleton={<WorkspaceLoadingSkeleton />}
        emptyState={
          <NoListsEmptyState
            workspaceName={workspaceDetails?.title}
            workspaceId={workspaceId as Id<'workspace'>}
          />
        }
        errorTitle="Failed to load lists"
        errorDescription="An error occurred while loading your workspace lists. Please try again."
      >
        <div className="space-y-4 pb-24">
          <div className="flex items-center justify-between gap-2">
            <BackButton />
            <h1 className="text-xl sm:text-3xl font-bold truncate min-w-0">
              {workspaceDetails?.title}
            </h1>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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
              {workspaceDetails?._id && (
                <CreateListDialog workspaceId={workspaceDetails._id} />
              )}
            </div>
          </div>
          <motion.div
            layout
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <AnimatePresence mode="popLayout">
              {displayedLists.map(
                (listDetails: { _id: string; title: string }, index) => (
                  <motion.div
                    key={listDetails._id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 0.95,
                      transition: { duration: 0.1 },
                    }}
                    transition={{
                      duration: 0.4,
                      delay: showFewer ? 0 : index * 0.05,
                      ease: [0.21, 1.11, 0.81, 0.99],
                    }}
                  >
                    <ListCard
                      listTitle={listDetails.title}
                      listItem={listDetails}
                    />
                  </motion.div>
                ),
              )}
            </AnimatePresence>
          </motion.div>
          <PaginationController
            status={paginationStatus}
            loadMore={loadMore}
            isFetching={isFetching}
            resultsCount={lists.length}
            label="Lists"
            onToggleShowFewer={() => setRefreshKey((prev) => prev + 1)}
            initialNumItems={9}
          />
        </div>
      </StateHandler>
    </>
  )
}
