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
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  handleDelete: () => void
}

export function DeleteDialog({
  isOpen,
  setIsOpen,
  dialogTitle,
  handleDelete,
}: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>Delete</DialogTrigger>
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
