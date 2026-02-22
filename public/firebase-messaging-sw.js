importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

import firebase from "firebase"

firebase.initializeApp({
  messagingSenderId: '877820099842',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('Message received:', payload)
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/favicon.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
})