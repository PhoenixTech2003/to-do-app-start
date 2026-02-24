import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_CONVEX_URL: z.url(),
    VITE_APP_API_KEY: z.string(),
    VITE_APP_AUTH_DOMAIN: z.string(),
    VITE_APP_PROJECT_ID: z.string(),
    VITE_APP_STORAGE_BUCKET: z.string(),
    VITE_APP_MESSAGING_SENDER_ID: z.string(),
    VITE_APP_APP_ID: z.string(),
    VITE_APP_MEASUREMENT_ID: z.string(),
    VITE_APP_VAPID_KEY: z.string(),
  },

  runtimeEnv: import.meta.env,
})
