import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateWorkspaceForm } from './create-workspace-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function CreateWorkspaceDialog() {
  const [isOpen, setIsOpen] = useState(false)

  function setCreateDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setCreateDialogIsOpen}>
      <Button onClick={() => setIsOpen(true)} size="icon" className="sm:size-auto sm:px-4 sm:py-2">
        <Plus className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Create Workspace</span>
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            This will create a new workspace for your twodo lists
          </DialogDescription>
        </DialogHeader>
        <CreateWorkspaceForm setCreateDialogIsOpen={setCreateDialogIsOpen} />
      </DialogContent>
    </Dialog>
  )
}
