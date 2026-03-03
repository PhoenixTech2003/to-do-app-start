import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { motion } from 'motion/react'
import { Input } from '../ui/input'

interface SearchInputProps {
  searchTerm: string | undefined
  onSearch: (searchTerm: string) => void
  placeholder?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When true, search bar is always visible (e.g. on mobile) */
  alwaysVisible?: boolean
}

export function SearchInput({
  searchTerm,
  onSearch,
  placeholder = 'Search workspaces...',
  open: controlledOpen,
  onOpenChange,
  alwaysVisible = false,
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

  const searchBar = (
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
          className="w-full max-w-lg"
        >
          {searchBar}
        </motion.div>
      )}
    </div>
  )
}
