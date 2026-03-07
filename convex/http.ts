import { httpRouter } from 'convex/server'
import { authComponent, createAuth } from './auth'
import { verifyWhatsappWebhookAction } from './webhooks/whatsapp/actions'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth)

http.route({
  path: '/webhooks/whatsapp/verify',
  method: 'GET',
  handler: verifyWhatsappWebhookAction,
})

export default http
