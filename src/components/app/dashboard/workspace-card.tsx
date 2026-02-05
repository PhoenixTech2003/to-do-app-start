import { Link } from '@tanstack/react-router'
import { DeleteWorkspaceDialog } from './delete-workspace-dialog'
import { UpdateWorkspaceDialog } from './update-workspace-dialog'
import type { WorkspaceItem } from '@/types/global'

interface WorkspaceCardProps {
  workspaceData: WorkspaceItem
}

export function WorkspaceCard({ workspaceData }: WorkspaceCardProps) {
  return (
    <div className="rounded-lg border-2 border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
      <Link
        to="/dashboard/workspace/$workspaceId"
        params={{ workspaceId: workspaceData._id }}
        className="block"
      >
        <h2 className="mb-4 text-xl font-bold text-primary">
          {workspaceData.title}
        </h2>
      </Link>
      <div className="flex gap-2">
        <UpdateWorkspaceDialog workspaceData={workspaceData} />
        <DeleteWorkspaceDialog
          workspaceId={workspaceData._id}
          workspaceName={workspaceData.title}
        />
      </div>
    </div>
  )
}
