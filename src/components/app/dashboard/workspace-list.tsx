import { WorkspaceCard } from './workspace-card'
import type { ReactNode } from 'react'
import type { WorkspacesList } from '@/types/global'
import { Docket, DocketEmpty } from '@/components/app/docket'

interface WorkspaceListProps {
  workspaceListData: WorkspacesList
  /** The sheet's closing rule — pagination lives inside the sheet, not under it. */
  children?: ReactNode
}

export function WorkspaceList({
  workspaceListData,
  children,
}: WorkspaceListProps) {
  return (
    <Docket>
      {workspaceListData.length === 0 ? (
        <DocketEmpty>
          No workspaces yet. Create one to start grouping your lists.
        </DocketEmpty>
      ) : (
        workspaceListData.map((workspace) => (
          <WorkspaceCard key={workspace._id} workspaceData={workspace} />
        ))
      )}
      {children}
    </Docket>
  )
}
