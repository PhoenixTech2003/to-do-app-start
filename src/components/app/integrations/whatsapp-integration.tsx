import { api } from 'convex/_generated/api'
import { useMutation } from 'convex/react'
import { useForm } from '@tanstack/react-form'
import { toast } from 'sonner'
import { Phone, Save, Trash2 } from 'lucide-react'
import { IntegrationCard } from './integration-card'
import type { Doc } from 'convex/_generated/dataModel'
import { whatsappIntegrationSchema } from '@/validation/whatsapp-integration-schema'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface WhatsAppIntegrationProps {
  integration?: Doc<'integrations'>
}

export function WhatsAppIntegration({ integration }: WhatsAppIntegrationProps) {
  const upsertWhatsApp = useMutation(
    api.integrations.mutations.upsertWhatsAppIntegration,
  )
  const removeIntegrationMutation = useMutation(
    api.integrations.mutations.removeIntegration,
  )

  const isActive = !!integration

  const form = useForm({
    defaultValues: {
      phoneNumber: integration?.userIntegrationId ?? '',
    },
    validators: {
      onSubmit: whatsappIntegrationSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await upsertWhatsApp({ phoneNumber: value.phoneNumber })
        toast.success('WhatsApp integration updated successfully')
      } catch (error) {
        toast.error('Failed to update WhatsApp integration')
        console.error(error)
      }
    },
  })

  const handleRemove = async () => {
    if (!integration) return

    try {
      await removeIntegrationMutation({ id: integration._id })
      form.reset()
      toast.success('WhatsApp integration removed')
    } catch (error) {
      toast.error('Failed to remove WhatsApp integration')
      console.error(error)
    }
  }

  return (
    <IntegrationCard
      title="WhatsApp"
      description="Get task reminders and notifications directly on WhatsApp."
      isActive={isActive}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <form.Field
          name="phoneNumber"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !!field.state.meta.errors.length
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel
                  htmlFor={field.name}
                  className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  WhatsApp Number
                </FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="+1234567890"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="pl-10 h-11 bg-muted/50 focus-visible:bg-transparent transition-colors"
                    aria-invalid={isInvalid}
                  />
                </div>
                {isInvalid ? (
                  <FieldError errors={field.state.meta.errors} />
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">
                    Include country code (e.g., +1 for USA, +44 for UK).
                  </p>
                )}
              </Field>
            )
          }}
        />

        <form.Subscribe
          selector={(state) => [state.isSubmitting, state.values]}
          children={([isSubmitting, values]) => {
            const hasChanged =
              (values as { phoneNumber: string }).phoneNumber !==
              (integration?.userIntegrationId ?? '')

            return (
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={(isSubmitting as boolean) || !hasChanged}
                  className="flex-1 h-10 gap-2 font-semibold"
                >
                  <Save className="h-4 w-4" />
                  {isActive ? 'Update' : 'Activate'}
                </Button>

                {isActive && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemove}
                    disabled={isSubmitting as boolean}
                    className="px-3 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )
          }}
        />
      </form>
    </IntegrationCard>
  )
}
