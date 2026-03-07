import { httpAction } from '../../_generated/server'
import { internal } from '../../_generated/api'
import type { WhatsAppWebhookPayload } from '../../../src/types/whatsapp'

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
  const body = (await request.json()) as WhatsAppWebhookPayload

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

  // Only process incoming message events (ignore status updates, etc.)
  const entry = body.entry[0]
  const change = entry.changes[0]
  if (change.field !== 'messages' || !change.value.messages?.length) {
    return new Response(null, { status: 200 })
  }

  const value = change.value
  const userName = value.contacts?.[0]?.profile?.name
  const userPhoneNumber =
    value.contacts?.[0]?.wa_id ?? value.messages?.[0]?.from
  const message = value.messages?.[0]
  const messageBody = message?.type === 'text' ? message.text.body : ''

  if (!userPhoneNumber) {
    console.error('could not determine recipient phone number')
    return new Response(null, { status: 200 })
  }

  const aiResponse = await ctx.runAction(internal.agents.actions.T, {
    messageBody,
    usersName: userName,
  })

  const response = await fetch(
    `${process.env.FACEBOOK_BASE_API!}/${process.env.WHATSAPP_PHONE_ID}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: userPhoneNumber,
        type: 'text',
        text: {
          body: aiResponse,
        },
      }),
    },
  )

  if (!response.ok) {
    console.error('failed to send message', await response.text())
    console.error(response.statusText)
    return new Response(null, {
      status: 500,
    })
  }

  console.log(JSON.stringify(body, null, 2))
  return new Response(null, {
    status: 200,
  })
})
