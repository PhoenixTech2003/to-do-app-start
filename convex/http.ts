import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'
import {
  handleWhatsappWebhookAction,
  verifyWhatsappWebhookAction,
} from './webhooks/whatsapp/actions'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

http.route({
  path: '/webhooks/whatsapp',
  method: 'GET',
  handler: verifyWhatsappWebhookAction,
})

http.route({
  path: '/webhooks/whatsapp',
  method: 'POST',
  handler: handleWhatsappWebhookAction,
})
export default http
