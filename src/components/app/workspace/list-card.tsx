import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { IndexRow } from '../index-row'
import { UpdateListDetailsForm } from './update-list-details-form'
import type { ListItem } from '@/types/global'
import { truncateText } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface ListCardProps {
  listTitle: string
  listItem: ListItem
}

export function ListCard({ listTitle, listItem }: ListCardProps) {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false)
  const isMobile = useIsMobile()

  const deleteList = useConvexMutation(api.workspace.mutations.deleteList)

  function handleDelete() {
    const deleteListPromise = deleteList({ listId: listItem._id })
    toast.promise(deleteListPromise, {
      loading: 'Deleting list…',
      success: () => {
        setIsOpenDeleteDialog(false)
        return `Deleted ${listTitle}`
      },
      error: 'Could not delete the list. Try again.',
    })
  }

  return (
    <IndexRow
      title={isMobile ? truncateText(listTitle) : listTitle}
      kind="List"
      createdAt={listItem._creationTime}
      linkProps={{
        to: '/dashboard/workspace/$workspaceId/lists/$listId/todos',
        params: { workspaceId: listItem.workspaceId, listId: listItem._id },
        search: { view: 'list' },
      }}
      onEdit={() => setIsUpdateDialogOpen(true)}
      onDelete={() => setIsOpenDeleteDialog(true)}
      editLabel={`Edit ${listTitle}`}
      deleteLabel={`Delete ${listTitle}`}
    >
      <UpdateDialog
        showTrigger={false}
        isOpen={isUpdateDialogOpen}
        setDialogIsOpen={setIsUpdateDialogOpen}
        updateDialogTitle="Update list details"
      >
        <UpdateListDetailsForm
          setUpdateListDialogIsOpen={setIsUpdateDialogOpen}
          listData={listItem}
        />
      </UpdateDialog>
      <DeleteDialog
        showTrigger={false}
        isOpen={isOpenDeleteDialog}
        setIsOpen={setIsOpenDeleteDialog}
        handleDelete={handleDelete}
        dialogTitle={`Delete the ${listTitle} list?`}
        description="Every todo and subtask inside it is deleted too. This can't be undone."
      />
    </IndexRow>
  )
}
