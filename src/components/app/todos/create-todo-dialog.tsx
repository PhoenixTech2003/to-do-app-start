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
  listId: Id<'lists'>
}

export function CreateTodoDialog({ listId }: CreateTodoDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  function setCreateDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setCreateDialogIsOpen}>
      <Button onClick={() => setIsOpen(true)} size="icon" className="sm:size-auto sm:px-4 sm:py-2">
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Create Todo</span>
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Todo</DialogTitle>
          <DialogDescription>
            Add a new todo to your list to stay organized
          </DialogDescription>
        </DialogHeader>
        <CreateTodoForm
          setCreateDialogIsOpen={setCreateDialogIsOpen}
          listId={listId}
        />
      </DialogContent>
    </Dialog>
  )
}
