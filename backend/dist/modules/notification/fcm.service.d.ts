/**
 * Service to handle Firebase Cloud Messaging (FCM) delivery.
 */
export declare class FcmService {
    /**
     * Sends a push notification to a specific device.
     */
    sendToDevice(token: string, title: string, body: string, data?: any): Promise<boolean>;
}
//# sourceMappingURL=fcm.service.d.ts.map