import admin from "firebase-admin";
import { NotificationRepository } from "./notification.repository.js";

// ─── Firebase Admin Initialization ──────────────────────────────────────────
// Uses GOOGLE_APPLICATION_CREDENTIALS env var or service account JSON
if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

        if (serviceAccountPath) {
            // Production: Use service account file
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceAccount = await import(serviceAccountPath, {
                assert: { type: "json" },
            });
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount.default),
            });
            console.log("✅ Firebase Admin initialized with service account");
        } else {
            // Development: Use default credentials or emulator
            admin.initializeApp();
            console.log("✅ Firebase Admin initialized with default credentials");
        }
    } catch (err) {
        console.warn(
            "⚠️ Firebase Admin initialization skipped:",
            (err as Error).message
        );
    }
}

/**
 * Production-Grade Firebase Cloud Messaging Service
 *
 * Features:
 * - Multi-device token delivery
 * - Automatic token cleanup on invalid tokens
 * - Deep link support in notification payload
 * - Platform-specific configuration (Android/iOS/Web)
 * - Batch sending for efficiency
 */
export class FcmService {
    private repo: NotificationRepository;

    constructor(repo?: NotificationRepository) {
        this.repo = repo || new NotificationRepository();
    }

    /**
     * Send push notification to a single device token
     */
    async sendToDevice(
        token: string,
        title: string,
        body: string,
        data?: Record<string, string>
    ): Promise<boolean> {
        try {
            if (!admin.apps.length) {
                console.warn("FCM: Firebase not initialized, skipping push");
                return false;
            }

            const message: admin.messaging.Message = {
                token,
                notification: {
                    title,
                    body,
                },
                data: data || {},
                android: {
                    priority: "high",
                    notification: {
                        sound: "default",
                        clickAction: "FLUTTER_NOTIFICATION_CLICK",
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: "default",
                            badge: 1,
                        },
                    },
                },
                webpush: {
                    notification: {
                        icon: "/icon-192x192.png",
                        badge: "/badge-72x72.png",
                    },
                    fcmOptions: {
                        link: data?.actionUrl || "/notifications",
                    },
                },
            };

            const response = await admin.messaging().send(message);
            console.log("✅ FCM Notification sent:", response);
            return true;
        } catch (error: any) {
            console.error("❌ FCM delivery failed:", error.code, error.message);

            // Handle invalid/expired tokens
            if (
                error.code === "messaging/invalid-registration-token" ||
                error.code === "messaging/registration-token-not-registered"
            ) {
                console.log(`🗑️ Deactivating invalid FCM token: ${token.substring(0, 20)}...`);
                await this.repo.deactivateDeviceToken(token);
            }

            return false;
        }
    }

    /**
     * Send push notification to all active devices of a user
     * Returns number of successful deliveries
     */
    async sendToAllDevices(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, string>
    ): Promise<number> {
        const devices = await this.repo.getActiveDeviceTokens(userId);

        if (devices.length === 0) {
            return 0;
        }

        let successCount = 0;

        // For small numbers of devices, send individually
        // For large numbers (>500), use sendEachForMulticast
        if (devices.length <= 10) {
            for (const device of devices) {
                const success = await this.sendToDevice(
                    device.token,
                    title,
                    body,
                    data
                );
                if (success) successCount++;
            }
        } else {
            // Batch send via multicast
            try {
                if (!admin.apps.length) return 0;

                const message: admin.messaging.MulticastMessage = {
                    tokens: devices.map((d) => d.token),
                    notification: { title, body },
                    data: data || {},
                };

                const response = await admin.messaging().sendEachForMulticast(message);
                successCount = response.successCount;

                // Clean up failed tokens
                response.responses.forEach((resp, idx) => {
                    if (
                        !resp.success &&
                        resp.error?.code === "messaging/registration-token-not-registered" &&
                        devices[idx]
                    ) {
                        this.repo.deactivateDeviceToken(devices[idx].token);
                    }
                });
            } catch (err) {
                console.error("FCM multicast error:", err);
            }
        }

        return successCount;
    }

    /**
     * Send notification with deep link to a specific post/comment
     */
    async sendWithDeepLink(
        userId: string,
        title: string,
        body: string,
        deepLink: string
    ): Promise<number> {
        return this.sendToAllDevices(userId, title, body, {
            actionUrl: deepLink,
            type: "DEEP_LINK",
        });
    }
}
