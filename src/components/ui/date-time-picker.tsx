import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { TimePicker } from './time-picker'
import type { Updater } from '@tanstack/react-form'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field } from '@/components/ui/field'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateTimeProps {
  value?: Date | undefined
  setValue: (updater: Updater<Date | undefined>) => void
}

export function DateTimePicker({ value, setValue }: DateTimeProps) {
  const [date, setDate] = useState<Date | undefined>(value)

  // Sync internal state with form value
  useEffect(() => {
    setDate(value)
  }, [value])

  const handleDateSelect = (dateValue: Date | undefined) => {
    if (dateValue) {
      // If there's an existing date with time, preserve the time
      if (date) {
        const newDate = new Date(dateValue)
        newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds())
        setDate(newDate)
        setValue(newDate)
      } else {
        // New date selection - set to current time or keep midnight
        const newDate = new Date(dateValue)
        setDate(newDate)
        setValue(newDate)
      }
    } else {
      setDate(undefined)
      setValue(undefined)
    }
  }

  const handleTimeChange = (dateValue: Date | undefined) => {
    if (dateValue) {
      setDate(dateValue)
      setValue(dateValue)
    }
  }

  return (
    <Field className="mx-auto w-44">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-simple"
            className="justify-start font-normal"
          >
            {date ? (
              format(date, 'EEEE, dd MMMM, yyyy  HH:mm:ss')
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            defaultMonth={date}
          />
          <div className="flex justify-center py-4">
            <TimePicker date={date} setDate={handleTimeChange} />
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
