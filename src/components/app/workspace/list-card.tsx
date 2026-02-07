import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { UpdateListDetailsForm } from './update-list-details-form'
import type { ListItem } from '@/types/global'

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
    <div className="rounded-lg border-2 border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <a
        href="/dashboard/workspace/{workspaceList.member.workspaceId}/{workspaceList.list.id}"
        className="block"
      >
        <h2 className="mb-4 text-xl font-bold text-primary">{listTitle}</h2>
      </a>
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
    </div>
  )
}
