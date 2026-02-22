import { initializeApp } from 'firebase/app'
import { getMessaging, getToken } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyANwWqk54dVoEzW-A4l8-CCJa9n0EwJRys',
  authDomain: 'twodo-3d89f.firebaseapp.com',
  projectId: 'twodo-3d89f',
  storageBucket: 'twodo-3d89f.firebasestorage.app',
  messagingSenderId: '877820099842',
  appId: '1:877820099842:web:07b8a992a7cf886dd8961b',
  measurementId: 'G-K370FTMKYT',
}

const app = initializeApp(firebaseConfig)

export function getMessagingToken() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Messaging requires a browser environment'))
  }
  const messaging = getMessaging(app)
  return getToken(messaging, {
    vapidKey:
      'BKQwD_z41mtZLv6yBn2z8fCeZ0750eAawubKlXSs8rtb3YwYc2kJuGxlesIL5lFCIV51DkhANmVEDnlbSzVK25o',
  })
}
