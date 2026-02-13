import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/workspace/todos/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/workspace/todos/"!</div>
}
