import { ListTodo } from 'lucide-react'
import { CreateListDialog } from './create-list-dialog'
import type { Id } from 'convex/_generated/dataModel'

interface NoListsEmptyStateProps {
  workspaceName?: string
  workspaceId?: Id<'workspace'>
}

export function NoListsEmptyState({
  workspaceName = 'Workspace',
  workspaceId,
}: NoListsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed border-border bg-card/60 px-4 py-16 sm:px-6 lg:px-8 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-chart-2/10">
        <ListTodo className="h-8 w-8 text-chart-2" />
      </div>

      <div className="space-y-2 text-center max-w-md">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground">
          No Lists Yet
        </h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create your first list in{' '}
          <span className="font-semibold text-foreground">
            {workspaceName}
          </span>{' '}
          to start managing your tasks.
        </p>
      </div>

      {workspaceId && <CreateListDialog workspaceId={workspaceId} />}
    </div>
  )
}
