import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/workspace/$workspaceId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { workspaceId } = Route.useParams()
  return <div>Hello "/dashboard/workspace/{workspaceId}"!</div>
}
