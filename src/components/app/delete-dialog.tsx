import { Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDialogProps {
  dialogTitle: string
  triggerTitle?: string
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  handleDelete: () => void
}

export function DeleteDialog({
  isOpen,
  setIsOpen,
  triggerTitle,
  dialogTitle,
  handleDelete,
}: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="grid">
        <Button variant="destructive" size="sm" className="flex-1">
          <Trash2 className="h-4 w-4" />
          {triggerTitle}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} variant={'outline'}>
            Cancel
          </Button>
          <Button variant={'destructive'} onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
