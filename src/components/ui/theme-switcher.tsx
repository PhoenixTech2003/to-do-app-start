import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-9 w-9 sm:w-30 rounded-md border border-input bg-background" />
    )
  }

  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'light':
        return <Sun className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const
    const current = order.indexOf(theme as (typeof order)[number])
    setTheme(order[(current + 1) % order.length])
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={cycleTheme}
        aria-label="Toggle theme"
      >
        {getIcon()}
      </Button>
      <div className="hidden sm:block">
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-32.5">
            <div className="flex items-center gap-2">
              {getIcon()}
              <SelectValue>
                {theme === 'system'
                  ? 'System'
                  : theme === 'dark'
                    ? 'Dark'
                    : 'Light'}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <span>System</span>
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <span>Dark</span>
              </div>
            </SelectItem>
            <SelectItem value="light">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <span>Light</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )
}
