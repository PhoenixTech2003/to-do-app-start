import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useConvexMutation } from '@convex-dev/react-query'
import { toast } from 'sonner'
import { api } from 'convex/_generated/api'
import { motion } from 'motion/react'
import { ArrowUpRight, Pencil, Trash2 } from 'lucide-react'
import { UpdateDialog } from '../update-dialog'
import { DeleteDialog } from '../delete-dialog'
import { UpdateWorkspaceDetailsForm } from './update-workspace-form'
import type { WorkspaceItem } from '@/types/global'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn, truncateText } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface WorkspaceCardProps {
  workspaceData: WorkspaceItem
}

export function WorkspaceCard({ workspaceData }: WorkspaceCardProps) {
  const [isOpenUpdateDialog, setIsOpenUpdateDialog] = useState(false)
  const [isOpenDeletDialog, setIsOpenDeleteDialog] = useState(false)
  const isMobile = useIsMobile()

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
      loading: 'Deleting workspace…',
      success: () => {
        setIsOpenDeleteDialogHandler(false)
        return `Deleted ${workspaceData.title}`
      },
      error: 'Could not delete the workspace. Try again.',
    })
  }
  return (
    <>
      {/* Dialogs render their own triggers by default; the card supplies its
          own so the actions can sit inside the card's footer rule. */}
      <UpdateDialog
        showTrigger={false}
        updateDialogTitle="Update workspace details"
        isOpen={isOpenUpdateDialog}
        setDialogIsOpen={setIsOpenUpdateDialogHandler}
      >
        <UpdateWorkspaceDetailsForm
          workspaceData={workspaceData}
          setUpdateWorkspaceDialogIsOpen={setIsOpenUpdateDialogHandler}
        />
      </UpdateDialog>
      <DeleteDialog
        showTrigger={false}
        isOpen={isOpenDeletDialog}
        setIsOpen={setIsOpenDeleteDialogHandler}
        handleDelete={handleDelete}
        dialogTitle={`Delete the ${workspaceData.title} workspace?`}
        description="Its lists and todos are deleted with it. This can't be undone."
      />

      <motion.div
        className="h-full"
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="group relative flex h-full flex-col gap-0 rounded-xl border-hairline py-0 transition-[box-shadow,border-color] duration-[var(--dur-2)] ease-[var(--ease-out)] hover:border-hairline-strong hover:shadow-[inset_0_1px_0_0_var(--edge-highlight),var(--elev-4)]">
          <CardContent className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            {/* One real link, stretched across the card. Keeps keyboard
                navigation, middle-click and open-in-new-tab working, and
                avoids nesting the action buttons inside a button. */}
            <h2 className="min-w-0 truncate text-lg sm:text-xl font-bold text-foreground transition-colors duration-[var(--dur-2)] group-hover:text-primary">
              <Link
                to="/dashboard/workspace/$workspaceId/lists"
                params={{ workspaceId: workspaceData._id }}
                className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none after:focus-visible:outline after:focus-visible:outline-2 after:focus-visible:outline-offset-2 after:focus-visible:outline-ring"
              >
                {isMobile
                  ? truncateText(workspaceData.title)
                  : workspaceData.title}
              </Link>
            </h2>
            <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-all duration-[var(--dur-2)] ease-[var(--ease-out)] group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </CardContent>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-hairline px-5 py-2.5 sm:px-6">
            <span className="label-meta text-muted-foreground/60">
              Workspace
            </span>
            {/* Actions sit above the stretched link, and stay out of the way
                until wanted; on touch there is no hover, so they always show. */}
            <div
              className={cn(
                'relative z-10 flex items-center gap-1 transition-opacity duration-[var(--dur-2)]',
                isMobile
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100',
              )}
            >
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Edit ${workspaceData.title}`}
                onClick={() => setIsOpenUpdateDialogHandler(true)}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${workspaceData.title}`}
                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setIsOpenDeleteDialogHandler(true)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  )
}
