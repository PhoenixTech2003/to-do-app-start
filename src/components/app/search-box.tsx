import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useHotkey } from '@tanstack/react-hotkeys'
import { motion } from 'motion/react'
import { Input } from '../ui/input'

interface SearchInputProps {
  searchTerm: string | undefined
  onSearch: (searchTerm: string) => void
  placeholder?: string
}

export function SearchInput({
  searchTerm,
  onSearch,
  placeholder = 'Search workspaces...',
}: SearchInputProps) {
  const [visible, setVisible] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useHotkey('Mod+K', () => setVisible((prev) => !prev))
  useHotkey('Escape', () => setVisible(false))

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus()
    }
  }, [visible])

  return (
    <div className="fixed top-0 left-0 right-0 flex justify-center px-4 py-4">
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg"
        >
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary pointer-events-none z-10" />
          <Input
            ref={inputRef}
            value={searchTerm}
            type="search"
            placeholder={placeholder}
            className="h-14 w-full pl-12 pr-5 text-base rounded-2xl border-2 border-primary/30 bg-card/80 shadow-xl shadow-black/10 backdrop-blur-xl ring-2 ring-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.15)] dark:bg-card/70 dark:border-primary/40 dark:shadow-black/20"
            aria-label="Search"
            onChange={(e) => onSearch(e.target.value)}
          />
        </motion.div>
      )}
    </div>
  )
}
