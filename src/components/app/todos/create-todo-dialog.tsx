import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTodoForm } from './create-todo-form'
import type { Id } from 'convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateTodoDialogProps {
  listId?: Id<'lists'>
  title?: string
  description?: string
  buttonLabel?: string
}

export function CreateTodoDialog({
  listId,
  title = 'Create Todo',
  description = 'Add a new todo to your list to stay organized',
  buttonLabel = 'Create Todo',
}: CreateTodoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  function setCreateDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setCreateDialogIsOpen}>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        aria-label={buttonLabel}
        className="sm:size-auto sm:px-4 sm:py-2"
      >
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CreateTodoForm
          setCreateDialogIsOpen={setCreateDialogIsOpen}
          listId={listId}
        />
      </DialogContent>
    </Dialog>
  )
}
