import { UpdateWorkspaceDialog } from './update-workspace-dialog'

interface WorkspaceCardProps {
  workspaceName: string
}

export function WorkspaceCard({ workspaceName }: WorkspaceCardProps) {
  return (
    <div className="rounded-lg border-2 border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <a href="dashboard/workspace/{userWorkSpace.id}" className="block">
        <h2 className="mb-4 text-xl font-bold text-primary">{workspaceName}</h2>
      </a>
      <div className="flex gap-2">
        <UpdateWorkspaceDialog workspaceTitle={workspaceName} />
      </div>
    </div>
  )
}
