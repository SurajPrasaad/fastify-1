import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyDLdx8eYx6JZ6a8MQ1qkA4zVhAjBGRI5DQ",
    authDomain: "tttftft-6d0cc.firebaseapp.com",
    projectId: "tttftft-6d0cc",
    storageBucket: "tttftft-6d0cc.firebasestorage.app",
    messagingSenderId: "745080424852",
    appId: "1:745080424852:web:08f70da56651446feee781",
    measurementId: "G-MNX3JBKYYK",
};

// VAPID Key — generate this in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
export const VAPID_KEY = "BMfwUfVPAsecm1R_OwTbYi_GZwJlkI9_QroNpYtp1nomCx2wQeI04mm9tjHHL8FRJzq9VNK8r8Zu_koumpdFV1M";

let app: ReturnType<typeof initializeApp> | undefined;
let messaging: ReturnType<typeof getMessaging> | undefined;

if (typeof window !== "undefined") {
    try {
        app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    } catch (error) {
        console.error("Firebase initialization error", error);
    }
}

export const getFcmToken = async (): Promise<string | null> => {
    try {
        if (typeof window === "undefined" || !(await isSupported())) {
            return null;
        }

        if (!app) {
            console.error("Firebase app not initialized");
            return null;
        }

        if (!messaging) {
            messaging = getMessaging(app);
        }

        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const currentToken = await getToken(messaging, {
                vapidKey: VAPID_KEY,
            });
            if (currentToken) {
                return currentToken;
            }
            console.log("No registration token available. Request permission to generate one.");
        }

        return null;
    } catch (error) {
        console.error("An error occurred while retrieving token.", error);
        return null;
    }
};
