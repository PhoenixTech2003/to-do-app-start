import { useState } from 'react'
import { UpdateDialog } from '../update-dialog'
import { UpdateListDetailsForm } from './update-list-details-form'
import type { ListItem } from '@/types/global'

interface ListCardProps {
  listTitle: string
  listItem: ListItem
}
export function ListCard({ listTitle, listItem }: ListCardProps) {
  const [isUpdatDialogOpen, setIsUpdateDialogIsOpen] = useState(false)

  function setIsUpdateDialogIsOpenHandler(value: boolean) {
    setIsUpdateDialogIsOpen(value)
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
        {/* <DeleteListDialog
							listTitle={workspaceList.list.title}
							listID={workspaceList.list.id}
							{data}
						/> */}
      </div>
    </div>
  )
}
