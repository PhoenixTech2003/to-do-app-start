import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PaginationStatus =
  | 'LoadingFirstPage'
  | 'CanLoadMore'
  | 'LoadingMore'
  | 'Exhausted'

interface PaginationControllerProps {
  status: PaginationStatus
  loadMore: (n: number) => void
  resultsCount: number
  initialNumItems: number
  label?: string
}

/**
 * Simple Load More pagination for Convex usePaginatedQuery.
 * Only shows when there's more to load (CanLoadMore) or currently loading more (LoadingMore).
 * No Show Less - avoids refreshKey/reset complexity that can cause infinite loading.
 */
export function PaginationController({
  status,
  loadMore,
  resultsCount,
  initialNumItems,
  label = 'Items',
}: PaginationControllerProps) {
  const canLoadMore = status === 'CanLoadMore'
  const isLoadingMore = status === 'LoadingMore'

  // Only show when we can load more or are loading more
  if (!canLoadMore && !isLoadingMore) return null

  return (
    <div className="flex flex-col items-center gap-6 mt-16 mb-12">
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="h-px w-8 bg-border" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em]">
          {resultsCount} {label}
        </span>
        <div className="h-px w-8 bg-border" />
      </motion.div>

      <motion.div
        layout
        className="relative group p-1 rounded-full bg-secondary/50 border border-border/50 backdrop-blur-sm shadow-xl"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => canLoadMore && loadMore(initialNumItems)}
          disabled={isLoadingMore}
          className={cn(
            'relative z-10 rounded-full px-6 py-5 h-10 transition-all duration-500',
            'hover:bg-primary hover:text-primary-foreground group-hover:px-8',
          )}
        >
          <AnimatePresence mode="wait">
            {isLoadingMore ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-[10px] font-black tracking-widest uppercase font-mono">
                  Loading
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="load-more"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <ArrowDown className="h-4 w-4" />
                <span className="text-[10px] font-black tracking-widest uppercase font-mono">
                  Load More
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-primary/20 -z-10" />
      </motion.div>
    </div>
  )
}
