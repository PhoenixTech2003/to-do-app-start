import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateListForm } from './create-list-form'
import type { Id } from 'convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CreateListDialogProps {
  workspaceId: Id<'workspace'>
}

export function CreateListDialog({ workspaceId }: CreateListDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  function setCreateDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setCreateDialogIsOpen}>
      <Button onClick={() => setIsOpen(true)} size="icon" className="sm:size-auto sm:px-4 sm:py-2">
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Create List</span>
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create List</DialogTitle>
          <DialogDescription>
            This will create a new list for your Twodos
          </DialogDescription>
        </DialogHeader>
        <CreateListForm
          setCreateDialogIsOpen={setCreateDialogIsOpen}
          workspaceId={workspaceId}
        />
      </DialogContent>
    </Dialog>
  )
}
