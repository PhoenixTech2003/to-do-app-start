import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTodoForm } from './create-todo-form'
import { EntrySlip } from './entry-slip'
import type { Id } from 'convex/_generated/dataModel'
import { Button } from '@/components/ui/button'

interface CreateTodoDialogProps {
  listId?: Id<'lists'>
  /** Where the entry lands. Printed in the slip's header band. */
  destination?: string
  title?: string
  description?: string
  buttonLabel?: string
}

export function CreateTodoDialog({
  listId,
  destination = 'Inbox',
  title = 'New entry',
  description = 'Write a twodo, choose when it is due and how it repeats.',
  buttonLabel = 'Create Todo',
}: CreateTodoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  function setCreateDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        aria-label={buttonLabel}
        className="sm:size-auto sm:px-4 sm:py-2"
      >
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </Button>

      <EntrySlip
        open={isOpen}
        onOpenChange={setCreateDialogIsOpen}
        label={title}
        destination={destination}
        description={description}
      >
        <CreateTodoForm
          setCreateDialogIsOpen={setCreateDialogIsOpen}
          listId={listId}
        />
      </EntrySlip>
    </>
  )
}
