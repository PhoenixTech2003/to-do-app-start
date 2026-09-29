import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Pasted `9:30`, `09.30` or `0930` become `0930`; anything else is refused.
 */
function pastedDigits(text: string) {
  const match = /^\s*(\d{1,2})\D?(\d{2})\s*$/.exec(text)
  return match ? match[1].padStart(2, '0') + match[2] : null
}

/** Why `digit` can't go in `box` given the other boxes, or null if it can. */
function refusalReason(digit: string, box: number, cells: Array<string>) {
  if (!/^\d$/.test(digit)) return 'Times use numbers only'
  if (box === 0 && digit > '2')
    return 'Hours start with 0, 1 or 2 — type 09 for 9am'
  // Includes 2 typed over the 0 of 09:00, which would make 29.
  if (
    (box === 0 && digit === '2' && cells[1] > '3') ||
    (box === 1 && cells[0] === '2' && digit > '3')
  )
    return 'After 2 the hour only goes up to 23'
  if (box === 2 && digit > '5') return 'Minutes only go up to 59'
  return null
}

/** `0930` → `['0','9','3','0']`, padded with empty boxes. */
const toCells = (digits: string) =>
  Array.from({ length: 4 }, (_, i) => digits[i] ?? '')

const BOX =
  'h-7 w-7 border-y border-r border-input bg-transparent text-center font-mono text-xs tabular-nums caret-foreground outline-none transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:bg-input/30 focus:z-10 focus:border-ring focus:ring-[3px] focus:ring-ring/50 aria-invalid:z-10 aria-invalid:border-chart-4 aria-invalid:ring-[3px] aria-invalid:ring-chart-4/40'

/**
 * Four one-digit boxes, `H H : M M`. Typing fills only the box you're in;
 * move between boxes yourself by clicking, Tab or the arrow keys. `value` is
 * `HH:mm`.
 */
export function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (time: string) => void
  className?: string
}) {
  const digits = value.replace(':', '')
  const [cells, setCells] = useState(() => toCells(digits))
  const [synced, setSynced] = useState(digits)
  if (synced !== digits) {
    setSynced(digits)
    setCells(toCells(digits))
  }
  // The box whose digit was just refused, flagged amber and explained for a moment.
  const [refused, setRefused] = useState<{
    box: number
    reason: string
  } | null>(null)
  const refusedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const inputs = useRef<Array<HTMLInputElement | null>>([])

  const refuse = (box: number, reason: string) => {
    setRefused({ box, reason })
    clearTimeout(refusedTimer.current)
    refusedTimer.current = setTimeout(() => setRefused(null), 2500)
  }

  const commit = (next: Array<string>) => {
    setRefused(null)
    setCells(next)
    if (next.every((cell) => cell !== ''))
      onChange(`${next[0]}${next[1]}:${next[2]}${next[3]}`)
  }

  const box = (index: number) => (
    <input
      ref={(el) => {
        inputs.current[index] = el
      }}
      value={cells[index] ?? ''}
      inputMode="numeric"
      aria-label={
        ['Hour tens', 'Hour ones', 'Minute tens', 'Minute ones'][index]
      }
      aria-invalid={refused?.box === index}
      className={BOX}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => {
        // The newest character wins, so typing over a filled box replaces it.
        const digit = event.target.value.slice(-1)
        const next = [...cells]
        next[index] = digit
        if (digit) {
          const reason = refusalReason(digit, index, cells)
          if (reason) return refuse(index, reason)
        }
        commit(next)
        event.target.select()
      }}
      onKeyDown={(event) => {
        const step =
          event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : 0
        if (!step) return
        event.preventDefault()
        inputs.current[index + step]?.focus()
      }}
      onPaste={(event) => {
        event.preventDefault()
        const pasted = pastedDigits(event.clipboardData.getData('text'))
        if (!pasted) return refuse(index, 'Paste a time like 9:30 or 21:45')
        const next = pasted.split('')
        const reason = next
          .map((digit, i) => refusalReason(digit, i, next))
          .find(Boolean)
        if (reason) return refuse(index, reason)
        commit(next)
      }}
    />
  )

  return (
    <Tooltip open={refused !== null}>
      <TooltipTrigger asChild>
        <div
          role="group"
          aria-label="Time"
          className={cn('inline-flex items-center gap-1', className)}
          // Leaving half a time behind falls back to the last complete one.
          onBlur={(event) => {
            if (event.currentTarget.contains(event.relatedTarget)) return
            setRefused(null)
            if (cells.some((cell) => !cell)) setCells(toCells(digits))
          }}
        >
          <div className="flex">
            {box(0)}
            {box(1)}
          </div>
          <span className="font-mono text-xs text-muted-foreground">:</span>
          <div className="flex">
            {box(2)}
            {box(3)}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{refused?.reason}</TooltipContent>
    </Tooltip>
  )
}
