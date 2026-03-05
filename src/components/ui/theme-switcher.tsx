import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-8 w-8 sm:w-24 rounded-md border border-border" />
  }

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'] as const
    const current = order.indexOf(theme as (typeof order)[number])
    setTheme(order[(current + 1) % order.length])
  }

  const config: Record<string, { icon: typeof Sun; label: string }> = {
    light: { icon: Sun, label: 'Light' },
    dark: { icon: Moon, label: 'Dark' },
    system: { icon: Monitor, label: 'Auto' },
  }

  const current = config[theme as string] || config.system

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 h-8 px-2 sm:px-3 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={`Theme: ${current.label}`}
    >
      <current.icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline font-mono text-[10px] font-semibold uppercase tracking-wider">
        {current.label}
      </span>
    </button>
  )
}
