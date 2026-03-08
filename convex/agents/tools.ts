import { tool } from 'ai'
import { z } from 'zod'
import { ConvexHttpClient } from 'convex/browser'
import { api, internal } from '../_generated/api'

const convex = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT_URL!)

const verifyIntegration = tool({
  description: `Verifies whether the interface or platform the user is currently 
operating on has been connected and configured to support T's actions. Use this tool before 
carrying out any operation that depends on an external integration to confirm access is 
available before proceeding, extract the userIntegrationId from the input.`,
  inputSchema: z.object({ userIntegrationId: z.string() }),
  execute: async ({ userIntegrationId }) => {
    const accessToken = process.env.ACCESS_TOKEN!
    const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if (!integration) {
      return {
        success: false,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev',
      }
    }
    return {
      success: true,
      message: null,
    }
  },
})

export const tools = {
  verifyIntegration,
}
