import webpush from 'web-push';
import { db } from '../../config/drizzle.js';
import { pushSubscriptions } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

// Initialize web-push
webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

export class WebPushService {
    /**
     * Send push notification to all active web push subscriptions of a user
     * Returns number of successful deliveries
     */
    async sendToAllDevices(
        userId: string,
        title: string,
        body: string,
        data?: Record<string, string>
    ): Promise<number> {
        try {
            // Get all subscriptions for this user
            const subs = await db
                .select()
                .from(pushSubscriptions)
                .where(eq(pushSubscriptions.userId, userId));

            if (subs.length === 0) return 0;

            let successCount = 0;
            const payload = JSON.stringify({
                title,
                body,
                data: {
                    url: data?.actionUrl || '/',
                    ...data
                }
            });

            for (const sub of subs) {
                const subscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth
                    }
                };

                try {
                    await webpush.sendNotification(subscription, payload);
                    successCount++;
                } catch (error: any) {
                    console.error("WebPush send error:", error);
                    // If subscription is invalid/expired (status 410 or 404)
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        try {
                            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
                            console.log(`🗑️ Removed expired web push subscription for user ${userId}`);
                        } catch(delErr) {
                            console.error("Failed to delete expired push subscription:", delErr);
                        }
                    }
                }
            }
            return successCount;
        } catch (error) {
            console.error("WebPush failed to send to user:", error);
            return 0;
        }
    }
}
