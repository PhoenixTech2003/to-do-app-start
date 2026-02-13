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
  DialogTrigger,
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
      <DialogTrigger>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Todo
        </Button>
      </DialogTrigger>
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
