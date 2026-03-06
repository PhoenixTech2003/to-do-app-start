import { Inbox } from 'lucide-react'
import { CreateWorkspaceDialog } from './create-workspace-dialog'

export function NoWorkspacesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed border-border bg-card/60 px-4 py-16 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Inbox className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2 text-center max-w-md">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground">
          No Workspaces Yet
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create your first workspace to get started organizing your tasks and
          collaborating with your team.
        </p>
      </div>

      <CreateWorkspaceDialog />
    </div>
  )
}
