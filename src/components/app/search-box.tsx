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
  placeholder = 'Search…',
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
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          value={searchTerm}
          type="search"
          placeholder={placeholder}
          className="h-10 w-full pl-10 pr-4 text-sm rounded-md border-border bg-card focus-visible:ring-primary/30"
          aria-label="Search"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {showTodoFilters && (
        <div className="flex items-center gap-2">
          <Select value={priority} onValueChange={onPriorityChange}>
            <SelectTrigger className="h-8 w-[120px] rounded-md border-border text-xs">
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
            <SelectTrigger className="h-8 w-[120px] rounded-md border-border text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {allowedStatuses.includes('pending') && <SelectItem value="pending">Pending</SelectItem>}
              {allowedStatuses.includes('overdue') && <SelectItem value="overdue">Overdue</SelectItem>}
              {allowedStatuses.includes('completed') && <SelectItem value="completed">Completed</SelectItem>}
            </SelectContent>
          </Select>

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-8 px-2 text-destructive hover:bg-destructive/10 rounded-md text-xs"
                >
                  <FilterX className="h-3.5 w-3.5 mr-1" />
                  Reset
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  if (alwaysVisible) {
    return (
      <div className="w-full py-4 flex justify-center">
        {searchBar}
      </div>
    )
  }

  return (
    <div className="fixed top-4 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none">
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="w-full max-w-xl pointer-events-auto bg-card border border-border rounded-lg p-4 shadow-lg"
        >
          {searchBar}
        </motion.div>
      )}
    </div>
  )
}
