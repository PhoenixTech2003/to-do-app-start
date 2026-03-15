import { ConvexHttpClient } from 'convex/browser'

export const convex = new ConvexHttpClient(process.env.CONVEX_DEPLOYMENT_URL!)
