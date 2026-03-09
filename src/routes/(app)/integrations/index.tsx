import { PuzzleIcon } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { WhatsAppIntegration } from '@/components/app/integrations/whatsapp-integration'
import { StateHandler } from '@/components/app/state-handler'

export const Route = createFileRoute('/(app)/integrations/')({
  component: IntegrationsPage,
})

function IntegrationsPage() {
  const integrations = useQuery(api.integrations.queries.getIntegrations)

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const whatsappIntegration = integrations?.find((i) => i.type === 'whatsapp')

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StateHandler
          isLoading={integrations === undefined}
          isError={false}
          isEmpty={false} // We always want to show the available ones
        >
          <WhatsAppIntegration integration={whatsappIntegration} />

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
