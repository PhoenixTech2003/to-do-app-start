import { v } from 'convex/values'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from '../_generated/server'
import { internal } from '../_generated/api'

/**
 * Pushes go through the Expo push service to the mobile app only; the web
 * client never registers an Expo token, so it never receives them.
 *
 * The channel, sound and categories must match src/notifications in the app.
 */
const CHANNEL_ID = 'alerts'
const SOUND = 'todo_alert.wav'

export const tokensFor = internalQuery({
  args: { owner: v.string() },
  handler: async (ctx, { owner }) =>
    (
      await ctx.db
        .query('expoPushTokens')
        .withIndex('by_createdBy', (q) => q.eq('createdBy', owner))
        .collect()
    ).map((row) => row.token),
})

export const forgetTokens = internalMutation({
  args: { tokens: v.array(v.string()) },
  handler: async (ctx, { tokens }) => {
    for (const token of tokens) {
      const row = await ctx.db
        .query('expoPushTokens')
        .withIndex('by_token', (q) => q.eq('token', token))
        .unique()
      if (row) await ctx.db.delete(row._id)
    }
  },
})

type Ticket = { status: 'ok' | 'error'; details?: { error?: string } }

export const send = internalAction({
  args: {
    owner: v.string(),
    title: v.string(),
    body: v.string(),
    /** Decides what the notification's "Mark done" action completes. */
    categoryId: v.union(
      v.literal('todo'),
      v.literal('subtask'),
      v.literal('habit'),
    ),
    /** Local IDs the app acts on: `todoId`, `subTaskId` or `habitId`. */
    data: v.record(v.string(), v.string()),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.runQuery(internal.notifications.push.tokensFor, {
      owner: args.owner,
    })
    if (!tokens.length) return
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title: args.title,
          body: args.body,
          sound: SOUND,
          channelId: CHANNEL_ID,
          categoryId: args.categoryId,
          priority: 'high',
          data: args.data,
        })),
      ),
    })
    if (!response.ok) {
      console.error('Expo push failed', response.status, await response.text())
      return
    }
    const { data } = (await response.json()) as { data: Array<Ticket> }
    const gone = tokens.filter(
      (_, i) => data[i]?.details?.error === 'DeviceNotRegistered',
    )
    if (gone.length)
      await ctx.runMutation(internal.notifications.push.forgetTokens, {
        tokens: gone,
      })
  },
})
