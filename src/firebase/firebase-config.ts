import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'
import type { Messaging } from 'firebase/messaging'
import { env } from '@/env'

const firebaseConfig = {
  apiKey: env.VITE_APP_API_KEY,
  authDomain: env.VITE_APP_AUTH_DOMAIN,
  projectId: env.VITE_APP_PROJECT_ID,
  storageBucket: env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: env.VITE_APP_MESSAGING_SENDER_ID,
  appId: env.VITE_APP_APP_ID,
  measurementId: env.VITE_APP_MEASUREMENT_ID,
}

const app = initializeApp(firebaseConfig)

let _messaging: Messaging | null = null

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (!_messaging) {
    _messaging = getMessaging(app)
  }
  return _messaging
}
