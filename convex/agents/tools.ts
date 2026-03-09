import {  tool } from 'ai'
import { z } from 'zod'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../_generated/api'
import type {ToolSet} from 'ai';

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
        data:null,
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev',
      }
    }
    return {
      success: true,
      data:null,
      message: null,
    }
  },
})

const getUsersWorkspaces = tool({
  description: `Returns a list of all workspaces the user has access to. use this when asked to list the users' workspaces`,
  inputSchema: z.object({userIntegrationId:z.string()}),
  execute: async ({userIntegrationId}) => {
    const accessToken = process.env.ACCESS_TOKEN!
        const integration = await convex.query(
      api.integrations.queries.getIntegration,
      { userIntegrationId, accessToken },
    )
    if(!integration){
      return {
        success: false,
        data:[],
        message:
          'Integration not found please activate in the dashboard at https://twodo.skilldiggers.dev/integrations',
      }
    }

    const workspaces = await convex.query(api.agents.workspaces.queries.getUserWorkspaces,{
      accessToken,
      userId:integration.userId,
    })

    return{
      success:true,
      data:workspaces,
      message:null,
    }
  
  }})

  
export const tools: ToolSet = {
  verifyIntegration,
  getUsersWorkspaces
}


