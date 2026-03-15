import { api } from 'convex/_generated/api'
import { useMutation, useQuery } from 'convex/react'
import { Link2, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { IntegrationCard } from './integration-card'
import type { Doc } from 'convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'

const TELEGRAM_BOT_URL = 'https://t.me/Twodo265_bot'

interface TelegramIntegrationProps {
  integration?: Doc<'integrations'>
}

export function TelegramIntegration({ integration }: TelegramIntegrationProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const hasSeenTokenRef = useRef(false)
  const telegramLinkToken = useQuery(
    api.integrations.queries.getTelegramLinkToken,
  )
  const createTokenMutation = useMutation(
    api.integrations.mutations.createTelegramLinkToken,
  )
  const removeIntegrationMutation = useMutation(
    api.integrations.mutations.removeIntegration,
  )

  const isActive = !!integration
  const linkToken = telegramLinkToken?.token ?? null
  const isLoading = telegramLinkToken === undefined
  const hasExpired =
    isDialogOpen && telegramLinkToken === null && hasSeenTokenRef.current

  useEffect(() => {
    if (linkToken) hasSeenTokenRef.current = true
    if (!isDialogOpen) hasSeenTokenRef.current = false
  }, [linkToken, isDialogOpen])

  const handleLinkClick = async () => {
    try {
      await createTokenMutation({})
      setIsDialogOpen(true)
    } catch (error) {
      toast.error('Failed to generate link token')
      console.error(error)
    }
  }

  const handleRemove = async () => {
    if (!integration) return

    try {
      await removeIntegrationMutation({ id: integration._id })
      toast.success('Telegram integration removed')
    } catch (error) {
      toast.error('Failed to remove Telegram integration')
      console.error(error)
    }
  }

  const handleCopyToken = () => {
    if (!linkToken) return
    navigator.clipboard.writeText(linkToken)
    toast.success('Token copied to clipboard')
  }

  return (
    <IntegrationCard
      title="Telegram"
      description="Link your Telegram account to manage tasks and get notifications."
      isActive={isActive}
    >
      <div className="flex flex-1 flex-col">
        <div className="mt-auto flex gap-2">
          <Button
            type="button"
            onClick={handleLinkClick}
            className="flex-1 h-10 gap-2 font-semibold"
          >
            <Link2 className="h-4 w-4" />
            Link Telegram
          </Button>

          {isActive && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
              className="px-3 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Telegram to Twodo</DialogTitle>
            <DialogDescription>
              Follow these steps to connect your Telegram account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-amber-600 dark:text-amber-500 font-medium">
              This token will expire in 15 minutes.
            </p>

            {hasExpired ? (
              <p className="text-sm text-muted-foreground">
                Token expired. Click &quot;Link Telegram&quot; to generate a new
                one.
              </p>
            ) : isLoading ? (
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                  Auth Token
                </label>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ) : (
              linkToken && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                    Auth Token
                  </label>
                  <div className="flex gap-2">
                    <code className="flex-1 rounded-lg border bg-muted/50 px-3 py-2.5 font-mono text-sm break-all">
                      {linkToken}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyToken}
                      className="shrink-0"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )
            )}

            {!hasExpired && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Instructions</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>
                    Open the Telegram bot at{' '}
                    <a
                      href={TELEGRAM_BOT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:no-underline"
                    >
                      t.me/Twodo265_bot
                    </a>
                  </li>
                  <li>
                    Type the command: /link {'<'}auth token{'>'}
                  </li>
                  <li>
                    Replace {'<'}auth token{'>'} with the token above
                  </li>
                  <li>Example: /link {linkToken ?? 'your-token-here'}</li>
                </ol>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </IntegrationCard>
  )
}
