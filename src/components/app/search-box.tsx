import { useEffect, useRef, useState } from 'react'
import { Search, FilterX } from 'lucide-react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { motion, AnimatePresence } from 'motion/react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchInputProps {
  searchTerm: string | undefined
  onSearch: (searchTerm: string) => void
  placeholder?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When true, search bar is always visible (e.g. on mobile) */
  alwaysVisible?: boolean
  showTodoFilters?: boolean
  priority?: string
  onPriorityChange?: (priority: string) => void
  status?: string
  onStatusChange?: (status: string) => void
  allowedStatuses?: string[]
}

export function SearchInput({
  searchTerm,
  onSearch,
  placeholder = 'Search workspaces...',
  open: controlledOpen,
  onOpenChange,
  alwaysVisible = false,
  showTodoFilters = false,
  priority,
  onPriorityChange,
  status,
  onStatusChange,
  allowedStatuses = ['pending', 'overdue', 'completed']
}: SearchInputProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isControlled = controlledOpen !== undefined
  const visible = alwaysVisible || (isControlled ? controlledOpen : internalOpen)

  const toggleOpen = () => {
    if (isControlled && onOpenChange) {
      onOpenChange(!controlledOpen)
    } else {
      setInternalOpen((prev) => !prev)
    }
  }
  const closeOpen = () => {
    if (isControlled && onOpenChange) {
      onOpenChange(false)
    } else {
      setInternalOpen(false)
    }
  }

  useHotkey('Mod+K', toggleOpen)
  useHotkey('Escape', closeOpen)

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus()
    }
  }, [visible])

  const handleReset = () => {
    onSearch('')
    if (onPriorityChange) onPriorityChange('all')
    if (onStatusChange) onStatusChange('all')
  }

  const hasActiveFilters = Boolean(searchTerm) || (priority !== 'all' && priority !== undefined) || (status !== 'all' && status !== undefined)

  const searchBar = (
    <div className="flex w-full max-w-2xl flex-col items-center gap-3">
      <div className="relative w-full max-w-lg">
        <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-primary pointer-events-none z-10" />
        <Input
          ref={inputRef}
          value={searchTerm}
          type="search"
          placeholder={placeholder}
          className="h-12 sm:h-14 w-full pl-10 sm:pl-12 pr-4 sm:pr-5 text-base rounded-xl sm:rounded-2xl border-2 border-primary/30 bg-card/80 shadow-xl shadow-black/10 backdrop-blur-xl ring-2 ring-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] dark:bg-card/70 dark:border-primary/40 dark:shadow-black/20 min-h-[44px]"
          aria-label="Search"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {showTodoFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex w-full max-w-lg items-center justify-between gap-2 rounded-xl sm:rounded-2xl border border-primary/20 bg-card/60 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-card/40 dark:border-primary/30"
        >
          <div className="flex flex-1 items-center gap-2 min-w-0 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary/70 hidden sm:block mr-1">Filter</span>
            <Select value={priority} onValueChange={onPriorityChange}>
              <SelectTrigger className="h-9 sm:h-10 w-[120px] sm:w-[130px] rounded-lg border-primary/20 bg-background/50 hover:bg-background/80 transition-colors focus:ring-1">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="h-9 sm:h-10 w-[120px] sm:w-[130px] rounded-lg border-primary/20 bg-background/50 hover:bg-background/80 transition-colors focus:ring-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {allowedStatuses.includes('pending') && <SelectItem value="pending">Pending</SelectItem>}
                {allowedStatuses.includes('overdue') && <SelectItem value="overdue">Overdue</SelectItem>}
                {allowedStatuses.includes('completed') && <SelectItem value="completed">Completed</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-9 sm:h-10 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg group"
                >
                  <FilterX className="mr-1.5 h-4 w-4 transition-transform group-hover:scale-110" />
                  Clear
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )

  if (alwaysVisible) {
    return (
      <div className="w-full px-3 sm:px-4 py-3 sm:py-4 flex justify-center">
        {searchBar}
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center px-4 py-4 z-50">
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl"
        >
          {searchBar}
        </motion.div>
      )}
    </div>
  )
}
