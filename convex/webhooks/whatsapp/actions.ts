import { httpAction } from '../../_generated/server'

export const verifyWhatsappWebhookAction = httpAction(async (ctx, request) => {
  const url = new URL(request.url)
  const requestVerifyToken = url.searchParams.get('hub.verify_token')
  const requestChallengeCode = url.searchParams.get('hub.challenge')
  if (requestVerifyToken != process.env.WHATSAPP_WEBHOOK_TOKEN) {
    return new Response(null, {
      status: 400,
    })
  }
  return new Response(requestChallengeCode, {
    status: 200,
  })
})
