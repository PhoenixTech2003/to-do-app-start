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
  DialogTrigger,
} from '@/components/ui/dialog'

export function CreateWorkspaceDialog() {
  const [isOpen, setIsOpen] = useState(false)

  function setCreateDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setCreateDialogIsOpen}>
      <DialogTrigger>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Workspace
        </Button>
      </DialogTrigger>
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
