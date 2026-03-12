"use client"

import { useEffect } from "react"
import { useAuth } from "@/features/auth/components/AuthProvider"
import { api } from "@/lib/api-client"

export function WebPushListener() {
    const { user } = useAuth()

    useEffect(() => {
        if (!user) return;

        /**
         * Helper to convert Base64 URL to Uint8Array for VAPID key
         */
        function urlBase64ToUint8Array(base64String: string) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');

            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);

            for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        async function registerPush() {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                return;
            }

            try {
                // Register service worker if not already running
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                // Wait until service worker is active
                if (registration.installing) {
                   await new Promise(resolve => {
                       registration.installing?.addEventListener('statechange', (e: any) => {
                           if (e.target.state === 'activated') resolve(true);
                       })
                   })
                }

                // Check or request permission
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    console.log("Push notification permission not granted");
                    return;
                }

                // Subscribe to push
                const existingSub = await registration.pushManager.getSubscription();
                if (existingSub) {
                    await api.post('/notifications/webpush/subscribe', existingSub.toJSON());
                    return;
                }

                const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!publicVapidKey) {
                    console.error("VAPID public key not found in env");
                    return;
                }

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
                });

                // Send to backend
                await api.post('/notifications/webpush/subscribe', subscription.toJSON());
                console.log("Web Push Subscription sent to server");

            } catch (error) {
                console.error("Error setting up web push:", error);
            }
        }

        registerPush();

    }, [user]);

    return null;
}
