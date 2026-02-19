import type { WebSocket } from "@fastify/websocket";
import type { NotificationEvent } from "./notification.dto.js";
export declare class NotificationGateway {
    private connections;
    private subscriber;
    constructor();
    private initRedis;
    private handleRedisMessage;
    handleConnection(socket: WebSocket, req: any): void;
    sendToUser(userId: string, event: NotificationEvent): void;
}
//# sourceMappingURL=notification.gateway.d.ts.map