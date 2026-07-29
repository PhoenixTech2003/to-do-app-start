import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { IndexRow } from '../index-row'
import { UpdateWorkspaceDetailsForm } from './update-workspace-form'
import type { WorkspaceItem } from '@/types/global'
import { truncateText } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface WorkspaceCardProps {
  workspaceData: WorkspaceItem
}

export function WorkspaceCard({ workspaceData }: WorkspaceCardProps) {
  const [isOpenUpdateDialog, setIsOpenUpdateDialog] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)
  const isMobile = useIsMobile()

  const deleteWorkspace = useConvexMutation(
    api.dashboard.mutations.deleteWorkspace,
  )

  function handleDelete() {
    const deleteWorkspacePromise = deleteWorkspace({
      workspaceId: workspaceData._id,
    })
    toast.promise(deleteWorkspacePromise, {
      loading: 'Deleting workspace…',
      success: () => {
        setIsOpenDeleteDialog(false)
        return `Deleted ${workspaceData.title}`
      },
      error: 'Could not delete the workspace. Try again.',
    })
  }

  return (
    <IndexRow
      title={
        isMobile ? truncateText(workspaceData.title) : workspaceData.title
      }
      kind="Workspace"
      createdAt={workspaceData._creationTime}
      linkProps={{
        to: '/dashboard/workspace/$workspaceId/lists',
        params: { workspaceId: workspaceData._id },
      }}
      onEdit={() => setIsOpenUpdateDialog(true)}
      onDelete={() => setIsOpenDeleteDialog(true)}
      editLabel={`Edit ${workspaceData.title}`}
      deleteLabel={`Delete ${workspaceData.title}`}
    >
      {/* The dialogs supply no trigger of their own; the row's actions open
          them, so the row keeps one stretched link and nothing nested in it. */}
      <UpdateDialog
        showTrigger={false}
        updateDialogTitle="Update workspace details"
        isOpen={isOpenUpdateDialog}
        setDialogIsOpen={setIsOpenUpdateDialog}
      >
        <UpdateWorkspaceDetailsForm
          workspaceData={workspaceData}
          setUpdateWorkspaceDialogIsOpen={setIsOpenUpdateDialog}
        />
      </UpdateDialog>
      <DeleteDialog
        showTrigger={false}
        isOpen={isOpenDeleteDialog}
        setIsOpen={setIsOpenDeleteDialog}
        handleDelete={handleDelete}
        dialogTitle={`Delete the ${workspaceData.title} workspace?`}
        description="Its lists and todos are deleted with it. This can't be undone."
      />
    </IndexRow>
  )
}
