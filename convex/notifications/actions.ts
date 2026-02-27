import { v } from 'convex/values'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { action } from '../_generated/server'

if (getApps().length === 0) {
  initializeApp({
    credential: cert(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT!)),
  })
}

export const sendPushNotification = action({
  args: {
    token: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    const { token, title, body } = args

    const result = await getMessaging().send({
      notification: { title, body },
      token,
    })

    return result
  },
})
