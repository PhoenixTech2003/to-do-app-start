import { Pencil } from 'lucide-react'
import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UpdateDialogProps {
  isOpen: boolean
  triggerTitle?: string
  setDialogIsOpen: (value: boolean) => void
  children: React.ReactNode
  updateDialogTitle: string
  showTrigger?: boolean
}

export function UpdateDialog({
  isOpen,
  triggerTitle,
  setDialogIsOpen,
  children,
  updateDialogTitle,
  showTrigger = true,
}: UpdateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setDialogIsOpen}>
      {showTrigger && (
        <Button
          variant="outline"
          onClick={() => setDialogIsOpen(true)}
          size="sm"
          className="flex-1 py-2"
        >
          <Pencil className="h-4 w-4" />
          {triggerTitle}
        </Button>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{updateDialogTitle}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
