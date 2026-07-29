import { Link } from '@tanstack/react-router'
import { ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { GUTTER } from './docket'
import type { ReactNode } from 'react'
import type { LinkProps } from '@tanstack/react-router'
import { openedAgo } from '@/lib/todo-time'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

/**
 * ── The index ──
 *
 * Workspaces and lists are containers, not work. A grid of large cards each
 * holding a single word said nothing; an index says the same thing in a line
 * and lets you read twenty of them at once.
 *
 * These rows deliberately carry no spine. The margin rule means priority, and
 * a container has none — leaving it blank is what tells you at a glance that
 * you are looking at places rather than tasks.
 */
export function IndexRow({
  title,
  kind,
  createdAt,
  linkProps,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
  children,
}: {
  title: string
  /** What this row is, set in the structural voice. */
  kind: string
  createdAt: number
  linkProps: LinkProps
  onEdit: () => void
  onDelete: () => void
  editLabel: string
  deleteLabel: string
  /** Dialogs the row owns, rendered outside the link's stretched hit area. */
  children?: ReactNode
}) {
  const isMobile = useIsMobile()
  const opened = openedAgo(createdAt)

  return (
    <div className="group relative flex items-center gap-3 py-3 pr-3 pl-4 transition-colors duration-[var(--dur-2)] ease-[var(--ease-standard)] hover:bg-accent/45">
      {children}

      <div className="flex min-w-0 flex-1 items-baseline gap-3">
        {/* One real link, stretched across the row, so middle-click and
            open-in-new-tab keep working and the actions stay outside it. */}
        <h2 className="min-w-0 truncate text-base font-semibold tracking-tight transition-colors duration-[var(--dur-2)] group-hover:text-primary sm:text-lg">
          <Link
            {...linkProps}
            className="after:absolute after:inset-0 focus-visible:outline-none after:focus-visible:outline after:focus-visible:outline-2 after:focus-visible:-outline-offset-2 after:focus-visible:outline-ring"
          >
            {title}
          </Link>
        </h2>
        <span className="label-meta hidden shrink-0 text-muted-foreground/40 sm:block">
          {kind}
        </span>
      </div>

      <div
        className={cn(
          'relative z-10 flex shrink-0 items-center gap-0.5 transition-opacity duration-[var(--dur-2)]',
          isMobile
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={editLabel}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={deleteLabel}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* The gutter holds time here too: when this place was opened. It gives
          way to the arrow on hover, so the row still says "go". */}
      <span
        title={opened.long}
        className={cn(
          GUTTER,
          'relative font-mono text-[11px] font-semibold text-muted-foreground/60',
        )}
      >
        <span
          data-numeric
          className="transition-opacity duration-[var(--dur-2)] group-hover:opacity-0"
        >
          {opened.short}
        </span>
        <ArrowUpRight
          aria-hidden
          className="absolute inset-y-0 right-0 my-auto size-3.5 text-primary opacity-0 transition-opacity duration-[var(--dur-2)] group-hover:opacity-100"
        />
      </span>
    </div>
  )
}
