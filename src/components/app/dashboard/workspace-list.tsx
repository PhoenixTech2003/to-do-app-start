import { WorkspaceCard } from './workspace-card'
import type { WorkspacesList } from '@/types/global'

interface WorkspaceListProps {
  workspaceListData: WorkspacesList
}

export function WorkspaceList({ workspaceListData }: WorkspaceListProps) {
  if (workspaceListData.length === 0) {
    return (
      <div>
        No workspace created at the moment click the button at the top right to
        add a workspace
      </div>
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workspaceListData.map((workspace) => (
        <WorkspaceCard key={workspace._id} workspaceData={workspace} />
      ))}
    </div>
  )
}
