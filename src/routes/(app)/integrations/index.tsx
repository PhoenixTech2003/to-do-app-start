import { PuzzleIcon } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { WhatsAppIntegration } from '@/components/app/integrations/whatsapp-integration'
import { TelegramIntegration } from '@/components/app/integrations/telegram-integration'
import { StateHandler } from '@/components/app/state-handler'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function IntegrationCardSkeleton() {
  return (
    <Card className="relative overflow-hidden flex h-full min-h-[300px] flex-col">
      <div className="absolute left-0 top-0 h-full w-1 bg-muted" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 px-6 pb-2">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-6 pt-4">
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-11 w-full rounded-md" />
          <div className="mt-auto pt-2">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IntegrationsGridSkeleton() {
  return (
    <div className="grid auto-rows-[minmax(280px,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
      <IntegrationCardSkeleton />
      <IntegrationCardSkeleton />
      <IntegrationCardSkeleton />
    </div>
  )
}

export const Route = createFileRoute('/(app)/integrations/')({
  component: IntegrationsPage,
})

function IntegrationsPage() {
  const integrations = useQuery(api.integrations.queries.getIntegrations)

  const whatsappIntegration = integrations?.find((i) => i.type === 'whatsapp')
  const telegramIntegration = integrations?.find((i) => i.type === 'telegram')

  return (
    <div className="space-y-8 pb-20">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <PuzzleIcon className="h-5 w-5" />
          <span className="font-mono text-xs font-bold uppercase tracking-widest">
            Extensions
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Integrations
        </h1>
        <p className="max-w-[600px] text-muted-foreground">
          Connect your favorite tools to supercharge your productivity. Get
          notifications, sync tasks, and more.
        </p>
      </div>

      <div className="grid auto-rows-[minmax(280px,1fr)] gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StateHandler
          isLoading={integrations === undefined}
          isError={false}
          isEmpty={false}
          loadingSkeleton={<IntegrationsGridSkeleton />}
        >
          <WhatsAppIntegration integration={whatsappIntegration} />
          <TelegramIntegration integration={telegramIntegration} />

          {/* Future integrations can be added here */}
          <div className="group relative overflow-hidden rounded-xl border border-dashed border-muted-foreground/25 bg-muted/5 p-6 transition-colors hover:bg-muted/10">
            <div className="flex flex-col items-center justify-center space-y-3 text-center opacity-50 transition-opacity group-hover:opacity-70">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <PuzzleIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold">More coming soon</h3>
                <p className="text-xs text-muted-foreground">
                  Email, and Calendar sync are in the works.
                </p>
              </div>
            </div>
          </div>
        </StateHandler>
      </div>
    </div>
  )
}
