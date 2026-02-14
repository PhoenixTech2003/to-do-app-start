import { useState } from 'react'
import { Plus } from 'lucide-react'

import { CreateSubtaskForm } from './create-subtask-form'
import type { Id } from 'convex/_generated/dataModel'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface CreateSubtaskDialogProps {
  todoId: Id<'todos'>
}

export function CreateSubtaskDialog({ todoId }: CreateSubtaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  function setCreateDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setCreateDialogIsOpen}>
      <DialogTrigger>
        <Plus />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Subtask</DialogTitle>
          <DialogDescription>
            This will create a new subtask for your Twodo
          </DialogDescription>
        </DialogHeader>
        <CreateSubtaskForm
          todoId={todoId}
          setCreateDialogIsOpen={setCreateDialogIsOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
