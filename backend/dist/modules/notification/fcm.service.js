import admin from "firebase-admin";
// Initialize Firebase Admin (Assuming credentials are in env or service account file)
if (!admin.apps.length) {
    // In production, use service account credentials
    // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    // For local/demo, you might use FIREBASE_CONFIG env var
    admin.initializeApp();
}
/**
 * Service to handle Firebase Cloud Messaging (FCM) delivery.
 */
export class FcmService {
    /**
     * Sends a push notification to a specific device.
     */
    async sendToDevice(token, title, body, data) {
        try {
            const message = {
                token,
                notification: {
                    title,
                    body,
                },
                data: data || {},
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default'
                        }
                    }
                }
            };
            const response = await admin.messaging().send(message);
            console.log("✅ FCM Notification sent:", response);
            return true;
        }
        catch (error) {
            console.error("❌ FCM delivery failed:", error);
            // If token is invalid or expired, we should ideally remove it from DB
            return false;
        }
    }
}
//# sourceMappingURL=fcm.service.js.map