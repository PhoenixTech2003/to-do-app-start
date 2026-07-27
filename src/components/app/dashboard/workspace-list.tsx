import { WorkspaceCard } from './workspace-card'
import type { WorkspacesList } from '@/types/global'

interface WorkspaceListProps {
  workspaceListData: WorkspacesList
}

export function WorkspaceList({ workspaceListData }: WorkspaceListProps) {
  if (workspaceListData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No workspaces yet. Create one to start grouping your lists.
      </p>
    )
  }
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
      {workspaceListData.map((workspace) => (
        <WorkspaceCard key={workspace._id} workspaceData={workspace} />
      ))}
    </div>
  )
}
