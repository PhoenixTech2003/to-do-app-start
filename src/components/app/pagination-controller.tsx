import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationControllerProps {
  status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted'
  loadMore: (n: number) => void
  isFetching: boolean
  showFewer?: boolean
  onToggleShowFewer?: () => void
  resultsCount: number
  initialNumItems?: number
  label?: string
}

export function PaginationController({
  status,
  loadMore,
  isFetching,
  showFewer,
  onToggleShowFewer,
  resultsCount,
  initialNumItems = 9,
  label = 'Items',
}: PaginationControllerProps) {
  const isExhausted = status === 'Exhausted'
  const canLoadMore = status === 'CanLoadMore'

  // Show the button if:
  // 1. We can load more
  // 2. We are currently loading more
  // 3. We've loaded items and have a way to reset/show fewer (even if exhausted)
  const shouldShowButton =
    canLoadMore ||
    status === 'LoadingMore' ||
    (resultsCount > 0 && onToggleShowFewer)

  if (!shouldShowButton) return null

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
          onClick={() => {
            if (isExhausted || showFewer) {
              onToggleShowFewer?.()
            } else if (canLoadMore) {
              loadMore(initialNumItems)
            }
          }}
          disabled={status === 'LoadingMore'}
          className={cn(
            'relative z-10 rounded-full px-6 py-5 h-10 transition-all duration-500',
            'hover:bg-primary hover:text-primary-foreground group-hover:px-8',
            isExhausted &&
              !showFewer &&
              'hover:bg-destructive hover:text-destructive-foreground',
          )}
        >
          <AnimatePresence mode="wait">
            {isFetching ? (
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
            ) : isExhausted && !showFewer ? (
              <motion.div
                key="exhausted"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <ChevronUp className="h-4 w-4" />
                <span className="text-[10px] font-black tracking-widest uppercase font-mono">
                  Show Less
                </span>
              </motion.div>
            ) : showFewer ? (
              <motion.div
                key="show-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2"
              >
                <ChevronDown className="h-4 w-4" />
                <span className="text-[10px] font-black tracking-widest uppercase font-mono">
                  Show All
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

        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl bg-primary/20 -z-10" />
      </motion.div>
    </div>
  )
}
