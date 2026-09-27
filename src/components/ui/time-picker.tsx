import { useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
)

function Column({
  label,
  values,
  selected,
  onSelect,
}: {
  label: string
  values: Array<string>
  selected: string
  onSelect: (value: string) => void
}) {
  return (
    <ScrollArea className="h-56 w-16">
      <div
        role="listbox"
        aria-label={label}
        className="flex flex-col gap-1 p-1"
      >
        {values.map((value) => (
          <Button
            key={value}
            type="button"
            role="option"
            aria-selected={value === selected}
            variant={value === selected ? 'default' : 'ghost'}
            size="sm"
            className="font-mono tabular-nums"
            ref={(el) => {
              if (el && value === selected)
                el.scrollIntoView({ block: 'center' })
            }}
            onClick={() => onSelect(value)}
          >
            {value}
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}

/** Hour and minute columns in a popover. `value` and `onChange` use `HH:mm`. */
export function TimePicker({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (time: string) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [hour, minute] = value.split(':')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label="Choose exact time"
          className={cn('gap-1.5 font-mono tabular-nums', className)}
        >
          <Clock className="size-3.5 text-muted-foreground" />
          {value}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto divide-x p-0" align="end">
        <Column
          label="Hour"
          values={HOURS}
          selected={hour}
          onSelect={(h) => onChange(`${h}:${minute}`)}
        />
        <Column
          label="Minute"
          values={MINUTES}
          selected={minute}
          onSelect={(m) => {
            onChange(`${hour}:${m}`)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
