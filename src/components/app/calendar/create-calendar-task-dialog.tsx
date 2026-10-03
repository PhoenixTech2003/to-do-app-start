import { format } from 'date-fns'
import { CreateTodoForm } from '@/components/app/todos/create-todo-form'
import { EntrySlip } from '@/components/app/todos/entry-slip'

interface CreateCalendarTaskDialogProps {
  date: Date
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** The same slip as everywhere else, opened on a day and free to file anywhere. */
export function CreateCalendarTaskDialog({
  date,
  open,
  onOpenChange,
}: CreateCalendarTaskDialogProps) {
  return (
    <EntrySlip
      open={open}
      onOpenChange={onOpenChange}
      label="New entry"
      destination={format(date, 'EEE d MMM')}
      description={`Write a todo for ${format(date, 'EEEE, d MMMM yyyy')} and choose where it is filed.`}
    >
      <CreateTodoForm
        defaultDue={date}
        chooseList
        setCreateDialogIsOpen={onOpenChange}
      />
    </EntrySlip>
  )
}
