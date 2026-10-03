import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
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

/**
 * The line being written: the margin carries the spine, the gutter the mark
 * the entry will print with. Every slip opens on this row.
 */
export function EntryLine({
  spine,
  mark,
  children,
}: {
  /** A CSS colour for the margin rule. */
  spine?: string
  mark?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className="spine flex items-start gap-3 py-3.5 pr-3 pl-4"
      style={spine ? ({ '--spine': spine } as React.CSSProperties) : undefined}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
      {mark}
    </div>
  )
}

/** The plain title line, for entries that don't read dates out of the title. */
export function TitleInput(props: ComponentProps<'input'>) {
  return (
    <input
      {...props}
      className="w-full bg-transparent text-[15px] leading-snug font-medium text-foreground caret-foreground selection:bg-primary/20 placeholder:text-muted-foreground/50 focus-visible:outline-none"
    />
  )
}

/** The note under the title line. */
export function NoteInput(props: ComponentProps<'textarea'>) {
  return (
    <textarea
      rows={2}
      placeholder="Add a note"
      aria-label="Note"
      {...props}
      className="w-full resize-none bg-transparent text-xs leading-relaxed text-muted-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none"
    />
  )
}

/** A title-line error, set in the same mono as the gutter. */
export function LineError({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] text-destructive">{children}</p>
}

/** The foot of every slip: the shortcut, then Cancel and the one action. */
export function SlipActions({
  submitLabel,
  hint,
  onCancel,
  disabled,
}: {
  submitLabel: string
  /** What Enter does, e.g. "to add". */
  hint: string
  onCancel: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline bg-surface-sunken px-4 py-3">
      <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
        <Kbd>⏎</Kbd> {hint}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" type="submit" disabled={disabled}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

/** Files the slip on ⌘⏎ / Ctrl⏎ from any field, including the note. */
export function submitOnModEnter(submit: () => void) {
  return (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }
}
