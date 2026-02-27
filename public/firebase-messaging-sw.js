importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyANwWqk54dVoEzW-A4l8-CCJa9n0EwJRys',
  authDomain: 'twodo-3d89f.firebaseapp.com',
  projectId: 'twodo-3d89f',
  storageBucket: 'twodo-3d89f.firebasestorage.app',
  messagingSenderId: '877820099842',
  appId: '1:877820099842:web:07b8a992a7cf886dd8961b',
  measurementId: 'G-K370FTMKYT',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'New Notification';
  const options = {
    body: payload.data?.body || '',
    icon: payload.data?.icon || '/favicon.png',
  };
  self.registration.showNotification(title, options);
});
