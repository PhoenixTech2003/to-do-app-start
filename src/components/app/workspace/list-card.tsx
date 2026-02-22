import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { UpdateListDetailsForm } from './update-list-details-form'
import type { ListItem } from '@/types/global'
import { Card, CardContent } from '@/components/ui/card'

interface ListCardProps {
  listTitle: string
  listItem: ListItem
}
export function ListCard({ listTitle, listItem }: ListCardProps) {
  const [isUpdatDialogOpen, setIsUpdateDialogIsOpen] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)

  const navigate = useNavigate()

  function setIsUpdateDialogIsOpenHandler(value: boolean) {
    setIsUpdateDialogIsOpen(value)
  }

  function setIsOpenDeleteDialogHandler(value: boolean) {
    setIsOpenDeleteDialog(value)
  }

  const deleteList = useConvexMutation(api.workspace.mutations.deleteList)

  function handleDelete() {
    const deleteListPromise = deleteList({
      listId: listItem._id,
    })
    toast.promise(deleteListPromise, {
      loading: 'Please wait while we delete your list',
      success: () => {
        setIsOpenDeleteDialogHandler(false)
        return 'List deleted successfully'
      },
      error: 'Failed to delete the list',
    })
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }}>
      <Card
        className="bg-card/50 rounded-lg hover:cursor-pointer"
        onClick={() =>
          navigate({
            to: '/dashboard/workspace/$workspaceId/lists/$listId/todos',
            params: { workspaceId: listItem.workspaceId, listId: listItem._id },
          })
        }
      >
        <CardContent className="p-4 sm:p-6">
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-primary truncate">{listTitle}</h2>

          <div className="flex gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <UpdateDialog
                isOpen={isUpdatDialogOpen}
                setDialogIsOpen={setIsUpdateDialogIsOpenHandler}
                updateDialogTitle="Update your twodo list"
              >
                <UpdateListDetailsForm
                  setUpdateListDialogIsOpen={setIsUpdateDialogIsOpenHandler}
                  listData={listItem}
                />
              </UpdateDialog>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <DeleteDialog
                isOpen={isOpenDeleteDialog}
                setIsOpen={setIsOpenDeleteDialogHandler}
                handleDelete={handleDelete}
                dialogTitle={`This action will permanently delete the ${listTitle} list`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
