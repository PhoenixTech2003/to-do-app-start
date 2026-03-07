/**
 * WhatsApp Business API webhook payload types
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
 */

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account'
  entry: Array<WhatsAppWebhookEntry>
}

export interface WhatsAppWebhookEntry {
  id: string
  changes: Array<WhatsAppWebhookChange>
}

export interface WhatsAppWebhookChange {
  field: string
  value: WhatsAppWebhookValue
}

export interface WhatsAppWebhookValue {
  messaging_product: 'whatsapp'
  metadata: WhatsAppMetadata
  contacts?: Array<WhatsAppContact>
  messages?: Array<WhatsAppMessage>
  statuses?: Array<WhatsAppStatus>
  errors?: Array<WhatsAppError>
}

export interface WhatsAppMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface WhatsAppContact {
  profile: {
    name: string
  }
  wa_id: string
}

export type WhatsAppMessage =
  | WhatsAppTextMessage
  | WhatsAppImageMessage
  | WhatsAppAudioMessage
  | WhatsAppVideoMessage
  | WhatsAppDocumentMessage
  | WhatsAppLocationMessage
  | WhatsAppReactionMessage
  | WhatsAppInteractiveMessage

export interface WhatsAppTextMessage {
  from: string
  id: string
  timestamp: string
  type: 'text'
  text: {
    body: string
  }
}

export interface WhatsAppImageMessage {
  from: string
  id: string
  timestamp: string
  type: 'image'
  image: {
    id?: string
    mime_type?: string
    sha256?: string
    caption?: string
  }
}

export interface WhatsAppAudioMessage {
  from: string
  id: string
  timestamp: string
  type: 'audio'
  audio: {
    id?: string
    mime_type?: string
    sha256?: string
  }
}

export interface WhatsAppVideoMessage {
  from: string
  id: string
  timestamp: string
  type: 'video'
  video: {
    id?: string
    mime_type?: string
    sha256?: string
    caption?: string
  }
}

export interface WhatsAppDocumentMessage {
  from: string
  id: string
  timestamp: string
  type: 'document'
  document: {
    id?: string
    mime_type?: string
    sha256?: string
    filename?: string
    caption?: string
  }
}

export interface WhatsAppLocationMessage {
  from: string
  id: string
  timestamp: string
  type: 'location'
  location: {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
}

export interface WhatsAppReactionMessage {
  from: string
  id: string
  timestamp: string
  type: 'reaction'
  reaction: {
    message_id: string
    emoji?: string
  }
}

export interface WhatsAppInteractiveMessage {
  from: string
  id: string
  timestamp: string
  type: 'interactive'
  interactive: {
    type: 'button_reply' | 'list_reply'
    button_reply?: { id: string; title: string }
    list_reply?: { id: string; title: string; description?: string }
  }
}

export interface WhatsAppStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
}

export interface WhatsAppError {
  code: number
  title: string
  message?: string
  error_data?: Record<string, unknown>
}
