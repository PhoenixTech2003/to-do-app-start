import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

/**
 * Every prefix of a valid `HHmm` (00:00–23:59), so impossible digits are
 * refused as they are typed rather than corrected afterwards. A lone 3–9 is
 * let through too and padded to `03`–`09`, since no hour starts with it.
 */
const TIME_PATTERN =
  '^[3-9]$|^(?:[01]\\d?|2[0-3]?)$|^(?:[01]\\d|2[0-3])[0-5]\\d?$'

/**
 * Pasted `9:30`, `09.30` or `0930` become `0930`; anything else is left for
 * the pattern to refuse.
 */
function pastedDigits(text: string) {
  const match = /^\s*(\d{1,2})\D?(\d{2})\s*$/.exec(text)
  return match ? match[1].padStart(2, '0') + match[2] : text
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

  return (
    <InputOTP
      maxLength={4}
      pattern={TIME_PATTERN}
      value={draft}
      pasteTransformer={pastedDigits}
      onChange={(typed: string) => {
        let next = /^[3-9]$/.test(typed) ? `0${typed}` : typed
        // Deleting a middle digit would slide the later ones left (12:30 →
        // 13:0_); clear from the deleted box onwards instead.
        if (next.length < draft.length && !draft.startsWith(next)) {
          let same = 0
          while (next[same] === draft[same]) same++
          next = draft.slice(0, same)
        }
        setDraft(next)
        if (next.length === 4) onChange(`${next.slice(0, 2)}:${next.slice(2)}`)
      }}
      // Leaving half a time behind falls back to the last complete one.
      onBlur={() => draft.length < 4 && setDraft(digits)}
      // input-otp parks the cursor on the last box; start from the first.
      onFocus={(event) =>
        event.currentTarget.setSelectionRange(0, draft ? 1 : 0)
      }
      // One hidden input spans every box, so find the clicked box by position.
      // Boxes past the typed digits can't hold a caret yet; clamp to the next one.
      onMouseUp={(event) => {
        const input = event.currentTarget
        const slots = input.parentElement?.querySelectorAll(
          '[data-slot="input-otp-slot"]',
        )
        if (!slots) return
        const clicked = [...slots].findIndex(
          (slot) => event.clientX < slot.getBoundingClientRect().right,
        )
        const index = Math.min(clicked < 0 ? 3 : clicked, draft.length)
        input.setSelectionRange(index, Math.min(index + 1, draft.length))
      }}
      aria-label="Time"
      autoComplete="off"
      containerClassName={cn('gap-1', className)}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} className={SLOT} />
        <InputOTPSlot index={1} className={SLOT} />
      </InputOTPGroup>
      <span className="font-mono text-xs text-muted-foreground">:</span>
      <InputOTPGroup>
        <InputOTPSlot index={2} className={SLOT} />
        <InputOTPSlot index={3} className={SLOT} />
      </InputOTPGroup>
    </InputOTP>
  )
}
