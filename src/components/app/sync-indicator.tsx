import { Link } from '@tanstack/react-router'
import { CloudAlert, CloudCheck, CloudOff, CloudSync } from 'lucide-react'
import type { SyncStatus } from '@/state/provider'
import { useSyncStatus } from '@/state/provider'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const config: Record<
  SyncStatus,
  { icon: typeof CloudCheck; label: string; detail: string; alert?: boolean }
> = {
  synced: {
    icon: CloudCheck,
    label: 'Synced',
    detail: 'Everything is saved to the cloud',
  },
  syncing: {
    icon: CloudSync,
    label: 'Syncing',
    detail: 'Sending your latest changes',
  },
  loading: {
    icon: CloudSync,
    label: 'Loading',
    detail: 'Fetching your data from the cloud',
  },
  offline: {
    icon: CloudOff,
    label: 'Offline',
    detail: "Changes are saved on this device and will sync when you're back",
    alert: true,
  },
  'signed-out': {
    icon: CloudAlert,
    label: 'Sign in',
    detail: 'Changes are saved on this device. Sign in to resume sync',
    alert: true,
  },
}

/** Quiet when all is well, louder only when changes aren't reaching the cloud. */
export function SyncIndicator() {
  const status = useSyncStatus()
  const { icon: Icon, label, detail, alert } = config[status]
  const busy = status === 'syncing' || status === 'loading'
  const className = cn(
    'flex items-center gap-2 h-8 px-2 sm:px-3 rounded-md border transition-colors',
    alert
      ? 'border-chart-4/35 bg-chart-4/10 text-chart-4'
      : 'border-transparent text-muted-foreground',
  )
  const content = (
    <>
      <Icon className={cn('h-3.5 w-3.5', busy && 'animate-pulse')} />
      <span
        className={cn(
          'font-mono text-[10px] font-semibold uppercase tracking-wider',
          !alert && 'hidden sm:inline',
        )}
      >
        {label}
      </span>
    </>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {status === 'signed-out' ? (
          <Link
            to="/signup"
            search={{ redirectUrl: window.location.pathname }}
            className={cn(className, 'hover:opacity-80')}
            aria-label={detail}
          >
            {content}
          </Link>
        ) : (
          <div
            role="status"
            aria-live="polite"
            aria-label={detail}
            className={className}
          >
            {content}
          </div>
        )}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {detail}
      </TooltipContent>
    </Tooltip>
  )
}
