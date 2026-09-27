import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

/**
 * Every prefix of a valid `HHmm` (00:00–23:59), so impossible digits are
 * refused as they are typed rather than corrected afterwards.
 */
const TIME_PATTERN = '^(?:[01]\\d?|2[0-3]?)$|^(?:[01]\\d|2[0-3])[0-5]\\d?$'

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
      onChange={(next: string) => {
        setDraft(next)
        if (next.length === 4) onChange(`${next.slice(0, 2)}:${next.slice(2)}`)
      }}
      // Leaving half a time behind falls back to the last complete one.
      onBlur={() => draft.length < 4 && setDraft(digits)}
      // input-otp parks the cursor on the last box; start from the first.
      onFocus={(event) =>
        event.currentTarget.setSelectionRange(0, draft ? 1 : 0)
      }
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
