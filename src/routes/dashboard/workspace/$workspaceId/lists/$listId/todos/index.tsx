import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/dashboard/workspace/$workspaceId/lists/$listId/todos/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>Hello "/dashboard/workspace/$workspaceId/lists/$listId/todos/"!</div>
  )
}
