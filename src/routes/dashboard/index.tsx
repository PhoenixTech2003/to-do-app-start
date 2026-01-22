import { createFileRoute } from '@tanstack/react-router'
import { CreateWorkspaceDialog } from '@/components/app/dashboard/create-workspace-dialog'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Workspaces</h1>
        <CreateWorkspaceDialog />
      </div>
      Hello
    </div>
  )
}
