import { httpAction } from '../../_generated/server'
import { internal } from '../../_generated/api'

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

export const handleWhatsappWebhookAction = httpAction(async (ctx, request) => {
  const body = await request.json()

  const requestSignature = request.headers.get('X-Hub-Signature-256')
  if (!requestSignature) {
    console.error('could not find the request signature')
    return new Response(null, {
      status: 400,
    })
  }
  const requestSha256Signature = requestSignature.split('=')[1]
  const bodyString = JSON.stringify(body)

  const isValidHmac = await ctx.runAction(
    internal.webhooks.whatsapp.node_actions.verifyHmacSignature,
    {
      body: bodyString,
      requestHmacSignature: requestSha256Signature,
    },
  )

  if (!isValidHmac) {
    console.error('invalid hmac provided')
    return new Response(null, {
      status: 400,
    })
  }

  return new Response(null, {
    status: 200,
  })
})
