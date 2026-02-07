import { Outlet, createFileRoute } from '@tanstack/react-router'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app/dashboard/app-sidebar'
import { authClient } from '@/lib/auth-client'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

export function DashboardLayout() {
  const { isPending, isRefetching, data } = authClient.useSession()
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col min-h-screen">
        <SidebarInset className="flex flex-col flex-1">
          <header className="flex items-center gap-4 border-b px-4 py-2">
            <SidebarTrigger />
            <div className="flex-1">
              {isPending || isRefetching ? (
                <p>loading...</p>
              ) : (
                <p className="text-lg">Welcome back, {data?.user.name}</p>
              )}
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
            <Outlet />
          </div>
        </SidebarInset>
      </main>
    </SidebarProvider>
  )
}
