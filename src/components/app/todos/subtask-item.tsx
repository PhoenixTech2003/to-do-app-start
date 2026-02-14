import { useState } from 'react'
import { toast } from 'sonner'
import { DeleteDialog } from '../delete-dialog'
import { UpdateDialog } from '../update-dialog'
import { UpdateSubtaskForm } from './update-subtask-form'
import type { SubTask } from '@/types/global'

export function SubtaskItem({
  st,
  onToggle,
  onDelete,
}: {
  st: SubTask
  onToggle: (id: string, checked: boolean) => void
  onDelete: (id: string) => Promise<void>
}) {
  const [isOpenUpdate, setIsOpenUpdate] = useState(false)
  const [isOpenDelete, setIsOpenDelete] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={!!st.completed}
          onChange={(e) => onToggle(st._id, e.target.checked)}
          className="h-4 w-4"
        />
        <div className="text-sm">{st.title}</div>
      </div>

      <div className="flex gap-2 items-center">
        <UpdateDialog
          isOpen={isOpenUpdate}
          setDialogIsOpen={setIsOpenUpdate}
          updateDialogTitle="Update Subtask"
        >
          <UpdateSubtaskForm
            subtaskId={st._id}
            title={st.title}
            setUpdateDialogIsOpen={setIsOpenUpdate}
          />
        </UpdateDialog>

        <DeleteDialog
          isOpen={isOpenDelete}
          setIsOpen={setIsOpenDelete}
          dialogTitle={`This action will permanently delete the ${st.title} subtask`}
          handleDelete={() => {
            const deletePromise = onDelete(st._id)
            toast.promise(deletePromise, {
              loading: 'deleting subtask',
              success: () => {
                setIsOpenDelete(false)
                return 'Subtask deleted successfully'
              },
              error: 'Failed to delete subtask',
            })
          }}
        />
      </div>
    </div>
  )
}
