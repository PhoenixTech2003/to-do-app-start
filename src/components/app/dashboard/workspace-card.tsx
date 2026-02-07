import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { UpdateDialog } from '../update-dialog'
import { DeleteWorkspaceDialog } from './delete-workspace-dialog'
import { UpdateWorkspaceDetailsForm } from './update-workspace-form'
import type { WorkspaceItem } from '@/types/global'

interface WorkspaceCardProps {
  workspaceData: WorkspaceItem
}

export function WorkspaceCard({ workspaceData }: WorkspaceCardProps) {
  const [isOpenUpdateDialog, setIsOpenUpdateDialog] = useState(false)
  function setIsOpenUpdateDialogHandler(value: boolean) {
    setIsOpenUpdateDialog(value)
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
          isOpen={isOpenUpdateDialog}
          setDialogIsOpen={setIsOpenUpdateDialogHandler}
        >
          <UpdateWorkspaceDetailsForm
            workspaceData={workspaceData}
            setUpdateWorkspaceDialogIsOpen={setIsOpenUpdateDialogHandler}
          />
        </UpdateDialog>
        <DeleteWorkspaceDialog
          workspaceId={workspaceData._id}
          workspaceName={workspaceData.title}
        />
      </div>
    </div>
  )
}
