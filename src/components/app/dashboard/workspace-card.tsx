import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { UpdateWorkspaceDetailsForm } from './update-workspace-form'
import type { WorkspaceItem } from '@/types/global'

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
    <div className="rounded-lg border-2 border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <Link
        to="/dashboard/workspace/$workspaceId"
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
    </div>
  )
}
