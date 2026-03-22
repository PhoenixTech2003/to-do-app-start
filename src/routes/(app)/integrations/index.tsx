import {
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { motion } from 'motion/react'
import { WhatsAppIntegration } from '@/components/app/integrations/whatsapp-integration'
import { TelegramIntegration } from '@/components/app/integrations/telegram-integration'
import { StateHandler } from '@/components/app/state-handler'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function IntegrationCardSkeleton() {
  return (
    <Card className="relative overflow-hidden flex h-full min-h-[280px] flex-col rounded-2xl border-border/60">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 px-5 pt-5 pb-3">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full" />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-2">
        <div className="flex flex-1 flex-col gap-3">
          <Skeleton className="h-11 w-full rounded-lg" />
          <div className="mt-auto pt-2">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function IntegrationsGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <IntegrationCardSkeleton />
      <IntegrationCardSkeleton />
    </div>
  )
}

function ComingSoonBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-dashed border-border/40"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02]" />
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 0.5px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />

      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="absolute -left-6 -bottom-6 size-32 rounded-full bg-primary/[0.03] blur-2xl" />

      <div className="relative flex flex-col items-center gap-5 px-6 py-12 sm:py-14">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex size-12 items-center justify-center rounded-2xl border border-border/40 bg-card shadow-sm"
        >
          <Sparkles className="size-5 text-primary/70" />
        </motion.div>

        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold tracking-tight text-foreground/80">
            More integrations on the way
          </h3>
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground/70">
            We're building connections to the tools you use every day.
            Email, calendars, project management, and more — stay tuned.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.3,
                delay: 0.5 + i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="size-1.5 rounded-full bg-primary/30"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof MessageSquare
  title: string
  count?: number
}) {
  return (
    <div className="flex items-center gap-2.5 pb-1">
      <Icon className="size-4 text-muted-foreground" />
      <h2 className="text-sm font-bold tracking-tight text-foreground">
        {title}
      </h2>
      {count !== undefined && (
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
          {count}
        </span>
      )}
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

  const activeCount = integrations
    ? integrations.length
    : undefined

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60 px-6 py-6 sm:px-8 sm:py-8"
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="size-4 text-primary" />
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Integrations
              </h1>
            </div>
            <p className="max-w-lg text-[14px] leading-relaxed text-muted-foreground">
              Connect your favorite tools to supercharge your workflow.
              Receive notifications, sync tasks, and automate your
              productivity pipeline.
            </p>
          </div>

          {activeCount !== undefined && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Connected
                </p>
                <p className="text-xl font-bold tracking-tight text-foreground">
                  {activeCount}
                  <span className="text-sm font-normal text-muted-foreground">
                    {' '}/ 2
                  </span>
                </p>
              </div>
              <div className="h-8 w-px bg-border/60" />
              <div className="flex gap-1">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'size-2 rounded-full transition-colors',
                      i < activeCount
                        ? 'bg-primary'
                        : 'bg-muted',
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <StateHandler
        isLoading={integrations === undefined}
        isError={false}
        isEmpty={false}
        loadingSkeleton={<IntegrationsGridSkeleton />}
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <SectionHeader
              icon={MessageSquare}
              title="Messaging"
              count={2}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <WhatsAppIntegration integration={whatsappIntegration} />
              <TelegramIntegration integration={telegramIntegration} />
            </div>
          </section>

          <ComingSoonBanner />
        </div>
      </StateHandler>
    </div>
  )
}
