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
    <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
        <ListTodo className="h-8 w-8 text-purple-600 dark:text-purple-400" />
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          No Lists Yet
        </h3>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Create your first list in{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {workspaceName}
          </span>{' '}
          to start managing your tasks.
        </p>
      </div>

      {workspaceId && <CreateListDialog workspaceId={workspaceId} />}
    </div>
  )
}
