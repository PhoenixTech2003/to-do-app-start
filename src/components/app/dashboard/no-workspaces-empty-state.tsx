import { Inbox } from 'lucide-react'
import { CreateWorkspaceDialog } from './create-workspace-dialog'

export function NoWorkspacesEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 rounded-lg border-2 border-dashed border-slate-200 bg-linear-to-br from-slate-50 to-slate-100 px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Inbox className="h-8 w-8 text-blue-600" />
      </div>

      <div className="space-y-2 text-center">
        <h3 className="text-2xl font-bold text-slate-900">No Workspaces Yet</h3>
        <p className="text-base text-slate-500">
          Create your first workspace to get started organizing your tasks and
          collaborating with your team.
        </p>
      </div>

      <CreateWorkspaceDialog />
    </div>
  )
}
