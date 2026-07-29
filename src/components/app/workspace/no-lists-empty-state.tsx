import { CreateListDialog } from './create-list-dialog'
import type { Id } from 'convex/_generated/dataModel'
import { DocketBlank } from '@/components/app/docket'

interface NoListsEmptyStateProps {
  workspaceName?: string
  workspaceId?: Id<'workspace'>
}

export function NoListsEmptyState({
  workspaceName = 'this workspace',
  workspaceId,
}: NoListsEmptyStateProps) {
  return (
    <DocketBlank
      label="Lists"
      message={
        <>
          Lists hold the actual work.{' '}
          <span className="font-medium text-foreground">{workspaceName}</span>{' '}
          has none yet — add one and start capturing tasks against it.
        </>
      }
      action={
        workspaceId ? <CreateListDialog workspaceId={workspaceId} /> : null
      }
    />
  )
}
