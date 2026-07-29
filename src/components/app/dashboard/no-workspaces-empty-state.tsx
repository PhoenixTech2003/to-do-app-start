import { CreateWorkspaceDialog } from './create-workspace-dialog'
import { DocketBlank } from '@/components/app/docket'

export function NoWorkspacesEmptyState() {
  return (
    <DocketBlank
      label="Workspaces"
      message="Workspaces group your lists — one per project, client, or part of your life. Create the first one to start filing work into it."
      action={<CreateWorkspaceDialog />}
    />
  )
}
