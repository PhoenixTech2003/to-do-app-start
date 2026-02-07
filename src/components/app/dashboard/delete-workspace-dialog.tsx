import { useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { toast } from 'sonner'
import { useState } from 'react'
import type { Id } from 'convex/_generated/dataModel'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteWorkspaceDialogProps {
  workspaceName: string
  workspaceId: string
}

export function DeleteWorkspaceDialog({
  workspaceName,
  workspaceId,
}: DeleteWorkspaceDialogProps) {
  const [isOpen, setIsopen] = useState(false)
  const deleteWorkspace = useConvexMutation(
    api.dashboard.mutations.deleteWorkspace,
  )
  function handleDelete() {
    const deleteworkspacePromise = deleteWorkspace({
      workspaceId: workspaceId as Id<'workspace'>,
    })
    toast.promise(deleteworkspacePromise, {
      loading: 'Please wait while we delete your workspace',
      success: () => {
        setIsOpenDeleteDialog(false)
        return 'workpspace delete successfully'
      },
      error: 'Failed to delete the workspace',
    })
  }

  function setIsOpenDeleteDialog(value: boolean) {
    setIsopen(value)
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpenDeleteDialog}>
      <DialogTrigger>Delete</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Are you sure you want to delete the "{workspaceName}" workspace
          </DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button
            onClick={() => setIsOpenDeleteDialog(false)}
            variant={'outline'}
          >
            Cancel
          </Button>
          <Button variant={'destructive'} onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
