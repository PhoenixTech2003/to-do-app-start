import { Inbox } from 'lucide-react'
import { CreateWorkspaceDialog } from './create-workspace-dialog'

export function NoWorkspacesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border border-hairline bg-surface-sunken px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-hairline bg-primary/10 text-primary">
        <Inbox className="h-7 w-7" />
      </div>

      <div className="space-y-2 text-center max-w-md">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground">
          No workspaces yet
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Workspaces group your lists. Create your first one to start organizing
          your tasks.
        </p>
      </div>

      <CreateWorkspaceDialog />
    </div>
  )
}
