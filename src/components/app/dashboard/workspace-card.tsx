import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { motion } from 'motion/react'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { UpdateWorkspaceDetailsForm } from './update-workspace-form'
import type { WorkspaceItem } from '@/types/global'
import { Card, CardContent } from '@/components/ui/card'
import { truncateText } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface WorkspaceCardProps {
  workspaceData: WorkspaceItem
}

export function WorkspaceCard({ workspaceData }: WorkspaceCardProps) {
  const [isOpenUpdateDialog, setIsOpenUpdateDialog] = useState(false)
  const [isOpenDeletDialog, setIsOpenDeleteDialog] = useState(false)
  const isMobile = useIsMobile()

  const navigate = useNavigate()

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
    <motion.div whileHover={{ scale: 1.05 }}>
      <Card
        className="bg-card/50 rounded-lg hover:cursor-pointer"
        onClick={() =>
          navigate({
            to: '/dashboard/workspace/$workspaceId/lists',
            params: { workspaceId: workspaceData._id },
          })
        }
      >
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-primary truncate">
            {isMobile ? truncateText(workspaceData.title) : workspaceData.title}
          </h2>

          <div className="flex gap-2">
            <div
              onClick={(e) => e.stopPropagation()}
              className="hover:cursor-pointer"
            >
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
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DeleteDialog
                isOpen={isOpenDeletDialog}
                setIsOpen={setIsOpenDeleteDialogHandler}
                handleDelete={handleDelete}
                dialogTitle={`This action will permanently delete the ${workspaceData.title} workspace`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
