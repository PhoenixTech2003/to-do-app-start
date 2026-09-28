import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/**
 * Every prefix of a valid `HHmm` (00:00–23:59), so impossible digits (a 3 in
 * the first box, 29, 12:60) are refused as they are typed rather than
 * corrected afterwards.
 */
const TIME_PATTERN = /^(?:[01]\d?|2[0-3]?)$|^(?:[01]\d|2[0-3])[0-5]\d?$/

/**
 * Pasted `9:30`, `09.30` or `0930` become `0930`; anything else is left for
 * the pattern to refuse.
 */
function pastedDigits(text: string) {
  const match = /^\s*(\d{1,2})\D?(\d{2})\s*$/.exec(text)
  return match ? match[1].padStart(2, '0') + match[2] : text
}

/** Why the digit typed into `box` was refused, in words the user can act on. */
function refusalReason(typed: string, draft: string, box: number) {
  if (typed.length > draft.length + 1) return 'Paste a time like 9:30 or 21:45'
  if (!/^\d$/.test(typed[box] ?? '')) return 'Times use numbers only'
  // Includes 2 typed over the 0 of 09:00, which would make 29.
  if (box < 2 && typed[0] === '2') return 'After 2 the hour only goes up to 23'
  if (box === 0) return 'Hours start with 0, 1 or 2 — type 09 for 9am'
  return 'Minutes only go up to 59'
}

const SLOT = 'h-7 w-7 font-mono text-xs tabular-nums'

/**
 * Four one-digit boxes, `H H : M M`, typed like a verification code: each digit
 * moves to the next box and backspace steps back. `value` is `HH:mm`.
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
  const [draft, setDraft] = useState(digits)
  const [synced, setSynced] = useState(digits)
  if (synced !== digits) {
    setSynced(digits)
    setDraft(digits)
  }
  // The box whose digit was just refused, flagged red and explained for a moment.
  const [refused, setRefused] = useState<{
    box: number
    reason: string
  } | null>(null)
  const refusedTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  return (
    <Tooltip open={refused !== null}>
      <TooltipTrigger asChild>
        <div className={cn('inline-flex', className)}>
          <InputOTP
            maxLength={4}
            value={draft}
            pasteTransformer={pastedDigits}
            // Validated here rather than through input-otp's `pattern`, which drops
            // a refused digit without telling us.
            onChange={(typed: string) => {
              let changed = 0
              while (changed < 4 && typed[changed] === draft[changed]) changed++
              if (typed && !TIME_PATTERN.test(typed)) {
                setRefused({
                  box: changed,
                  reason: refusalReason(typed, draft, changed),
                })
                clearTimeout(refusedTimer.current)
                refusedTimer.current = setTimeout(() => setRefused(null), 2500)
                return
              }
              // Deleting a middle digit would slide the later ones left (12:30 →
              // 13:0_); clear from the deleted box onwards instead.
              const next =
                typed.length < draft.length && !draft.startsWith(typed)
                  ? draft.slice(0, changed)
                  : typed
              setRefused(null)
              setDraft(next)
              if (next.length === 4)
                onChange(`${next.slice(0, 2)}:${next.slice(2)}`)
            }}
            // Leaving half a time behind falls back to the last complete one.
            onBlur={() => {
              setRefused(null)
              if (draft.length < 4) setDraft(digits)
            }}
            // input-otp parks the cursor on the last box; start from the first.
            onFocus={(event) =>
              event.currentTarget.setSelectionRange(0, draft ? 1 : 0)
            }
            // One hidden input spans every box, so find the clicked box by position.
            // Boxes past the typed digits can't hold a caret yet; clamp to the next one.
            onMouseUp={(event) => {
              const input = event.currentTarget
              const slots = input
                .closest('[data-input-otp-container]')
                ?.querySelectorAll('[data-slot="input-otp-slot"]')
              if (!slots?.length) return
              const clicked = [...slots].findIndex(
                (slot) => event.clientX < slot.getBoundingClientRect().right,
              )
              const index = Math.min(clicked < 0 ? 3 : clicked, draft.length)
              input.setSelectionRange(index, Math.min(index + 1, draft.length))
            }}
            aria-label="Time"
            autoComplete="off"
            containerClassName="gap-1"
          >
            <InputOTPGroup>
              <InputOTPSlot
                index={0}
                aria-invalid={refused?.box === 0}
                className={SLOT}
              />
              <InputOTPSlot
                index={1}
                aria-invalid={refused?.box === 1}
                className={SLOT}
              />
            </InputOTPGroup>
            <span className="font-mono text-xs text-muted-foreground">:</span>
            <InputOTPGroup>
              <InputOTPSlot
                index={2}
                aria-invalid={refused?.box === 2}
                className={SLOT}
              />
              <InputOTPSlot
                index={3}
                aria-invalid={refused?.box === 3}
                className={SLOT}
              />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{refused?.reason}</TooltipContent>
    </Tooltip>
  )
}
