import { cn } from '@/lib/utils'

type BetaBadgeVariant = 'inline' | 'pill'

export function BetaBadge({
  variant = 'inline',
  className,
}: {
  variant?: BetaBadgeVariant
  className?: string
}) {
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-4 py-1.5',
          'font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary',
          'shadow-[0_0_12px_var(--primary)/0.08] backdrop-blur-sm',
          className,
        )}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
        Beta
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-primary/25 bg-primary/[0.07] px-1.5 py-px',
        'font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-primary/80',
        'leading-none select-none',
        className,
      )}
    >
      <span className="relative flex h-1 w-1">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
        <span className="relative inline-flex h-1 w-1 rounded-full bg-primary/70" />
      </span>
      Beta
    </span>
  )
}
