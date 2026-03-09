import { z } from 'zod'

export const whatsappIntegrationSchema = z.object({
  phoneNumber: z
    .string()
    .min(5, 'Phone number must be at least 5 characters')
    .max(20, 'Phone number cannot exceed 20 characters')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format. Include country code (e.g., +1234567890)'),
})

export type WhatsAppIntegrationValues = z.infer<typeof whatsappIntegrationSchema>
