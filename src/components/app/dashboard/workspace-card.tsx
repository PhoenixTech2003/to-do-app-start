import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { UpdateWorkspaceDetailsForm } from './update-workspace-form'
import type { WorkspaceItem } from '@/types/global'
import { Card, CardContent } from '@/components/ui/card'

interface WorkspaceCardProps {
  workspaceData: WorkspaceItem
}

export function WorkspaceCard({ workspaceData }: WorkspaceCardProps) {
  const [isOpenUpdateDialog, setIsOpenUpdateDialog] = useState(false)
  const [isOpenDeletDialog, setIsOpenDeleteDialog] = useState(false)

  function setIsOpenUpdateDialogHandler(value: boolean) {
    setIsOpenUpdateDialog(value)
  }

  function setIsOpenDeleteDialogHandler(value: boolean) {
    setIsOpenDeleteDialog(value)
  }

  const deleteWorkspace = useConvexMutation(
    api.dashboard.mutations.deleteWorkspace,
  )
  function handleDelete() {
    const deleteworkspacePromise = deleteWorkspace({
      workspaceId: workspaceData._id,
    })
    toast.promise(deleteworkspacePromise, {
      loading: 'Please wait while we delete your workspace',
      success: () => {
        setIsOpenDeleteDialogHandler(false)
        return 'workpspace delete successfully'
      },
      error: 'Failed to delete the workspace',
    })
  }
  return (
    <Card className="bg-card/50 rounded-lg">
      <CardContent className="p-6">
        <Link
          to="/dashboard/workspace/$workspaceId/lists"
          params={{ workspaceId: workspaceData._id }}
          className="block"
        >
          <h2 className="mb-4 text-xl font-bold text-primary">
            {workspaceData.title}
          </h2>
        </Link>
        <div className="flex gap-2">
          <UpdateDialog
            updateDialogTitle="Update Workspace Details"
            isOpen={isOpenUpdateDialog}
            setDialogIsOpen={setIsOpenUpdateDialogHandler}
          >
            <UpdateWorkspaceDetailsForm
              workspaceData={workspaceData}
              setUpdateWorkspaceDialogIsOpen={setIsOpenUpdateDialogHandler}
            />
          </UpdateDialog>
          <DeleteDialog
            isOpen={isOpenDeletDialog}
            setIsOpen={setIsOpenDeleteDialogHandler}
            handleDelete={handleDelete}
            dialogTitle={`This action will permanently delete the ${workspaceData.title} workspace`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
