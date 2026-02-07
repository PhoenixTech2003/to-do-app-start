import { Pencil } from 'lucide-react'
import { useState } from 'react'
import { UpdateWorkspaceDetailsForm } from './update-workspace-form'
import type { WorkspaceItem } from '@/types/global'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UpdateWorkspaceDialogProps {
  workspaceData: WorkspaceItem
}

export function UpdateWorkspaceDialog({
  workspaceData,
}: UpdateWorkspaceDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  function setDialogIsOpen(value: boolean) {
    setIsOpen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="flex-1">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Workspace Details</DialogTitle>
        </DialogHeader>
        <UpdateWorkspaceDetailsForm
          workspaceData={workspaceData}
          setUpdateWorkspaceDialogIsOpen={setDialogIsOpen}
        />
      </DialogContent>
    </Dialog>
  )
}
