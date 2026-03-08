import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { v } from 'convex/values'
import { internalAction } from '../_generated/server'
import { testPrompt } from './prompts'

export const T = internalAction({
  args: {
    messageBody: v.string(),
    usersName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { text } = await generateText({
      model: google('gemma-3n-e4b-it'),
      prompt: testPrompt(args.messageBody, args.usersName),
    })
    return text
  },
})
