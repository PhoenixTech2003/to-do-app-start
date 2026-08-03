import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * The slip: one line of the docket lifted off the page. Same sheet, same ruled
 * bands — writing an entry and editing one happen on the same piece of paper.
 */
export function EntrySlip({
  open,
  onOpenChange,
  label,
  destination,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  /** The band's left-hand eyebrow: what you are doing. */
  label: string
  /** The band's right-hand mark: where the entry lands. */
  destination?: string
  /** Read to screen readers; the band itself stays quiet. */
  description: string
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-hairline bg-surface-sunken px-4 py-2.5 text-left">
          <DialogTitle className="label-meta text-muted-foreground">
            {label}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {description}
          </DialogDescription>
          {destination && (
            <span
              title={destination}
              className="min-w-0 truncate font-mono text-[10px] text-muted-foreground/70"
            >
              {destination}
            </span>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
