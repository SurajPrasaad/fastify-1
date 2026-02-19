/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Service workers can't access process.env, so the config must be hardcoded here.
// These are public/client-side keys — safe to include in client bundles.
const firebaseConfig = {
    apiKey: "AIzaSyDLdx8eYx6JZ6a8MQ1qkA4zVhAjBGRI5DQ",
    authDomain: "tttftft-6d0cc.firebaseapp.com",
    projectId: "tttftft-6d0cc",
    storageBucket: "tttftft-6d0cc.firebasestorage.app",
    messagingSenderId: "745080424852",
    appId: "1:745080424852:web:08f70da56651446feee781",
    measurementId: "G-MNX3JBKYYK",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon-192x192.png',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
