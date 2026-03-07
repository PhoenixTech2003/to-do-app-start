'use node'

import { createHmac } from 'node:crypto'
import { v } from 'convex/values'
import { internalAction } from '../../_generated/server'

export const verifyHmacSignature = internalAction({
  args: {
    body: v.string(),
    requestHmacSignature: v.string(),
  },
  handler: (ctx, args) => {
    const hmac = createHmac('sha256', process.env.WHATSAPP_WEBHOOK_TOKEN!)
      .update(JSON.stringify(args.body))
      .digest('hex')
    if (args.requestHmacSignature !== hmac) {
      false
    }
    return true
  },
})
