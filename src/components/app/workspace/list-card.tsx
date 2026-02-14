import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { Link } from '@tanstack/react-router'
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
    <Card className="bg-card/50 rounded-lg">
      <CardContent className="p-6">
        <Link
          to="/dashboard/workspace/$workspaceId/lists/$listId/todos"
          params={{ listId: listItem._id, workspaceId: listItem.workspaceId }}
          className="block"
        >
          <h2 className="mb-4 text-xl font-bold text-primary">{listTitle}</h2>
        </Link>
        <div className="flex gap-2">
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
          <DeleteDialog
            isOpen={isOpenDeleteDialog}
            setIsOpen={setIsOpenDeleteDialogHandler}
            handleDelete={handleDelete}
            dialogTitle={`This action will permanently delete the ${listTitle} list`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
