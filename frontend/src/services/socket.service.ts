import { api } from "@/lib/api-client";
import { io, Socket } from "socket.io-client";

type SocketListener = (data: any) => void;

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<SocketListener>> = new Map();
    private baseUrl: string;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private deviceId: string;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        this.deviceId = this.getOrCreateDeviceId();
    }

    private getOrCreateDeviceId(): string {
        if (typeof window === 'undefined') return 'server';
        let id = localStorage.getItem('chat_device_id');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('chat_device_id', id);
        }
        return id;
    }

    public connect() {
        if (this.socket?.connected) return;

        const token = api.getToken();
        if (!token) {
            console.warn("SocketService: No access token available for connection.");
            return;
        }

        try {
            this.socket = io(this.baseUrl, {
                path: '/chat/socket.io',
                query: { token },
                extraHeaders: {
                    'x-device-id': this.deviceId
                },
                transports: ['websocket'],
                reconnectionAttempts: 5,
            });

            this.socket.on("connect", () => {
                console.log("SocketService: Connected (Socket.IO)");
                this.startHeartbeat();
                this.emit('open', {});
            });

            this.socket.on("disconnect", () => {
                console.log("SocketService: Disconnected");
                this.stopHeartbeat();
                this.emit('close', {});
            });

            this.socket.on("connect_error", (error) => {
                console.error("SocketService: Connection error", error);
                this.emit('error', error);
            });

            // Bridge Socket.IO 'event' wrapper to our listener system
            this.socket.on("event", (data) => {
                if (data.type) {
                    this.emit(data.type, data.payload);
                }
                this.emit('message', data);
            });

            // Special case for Socket.IO direct events
            this.socket.onAny((eventName, ...args) => {
                if (eventName !== 'event') {
                    this.emit(eventName, args[0]);
                }
            });

        } catch (err) {
            console.error("SocketService: Connection failed", err);
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.send("HEARTBEAT", { timestamp: Date.now() });
        }, 30000); // 30s heartbeat
    }

    private stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    public disconnect() {
        if (this.socket) {
            this.stopHeartbeat();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    public isConnected(): boolean {
        return !!this.socket?.connected;
    }

    public send(type: string, payload: any) {
        if (this.socket?.connected) {
            this.socket.emit(type, payload);
        } else {
            console.warn("SocketService: Cannot send message, socket not connected.");
        }
    }

    public on(event: string, callback: SocketListener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);
    }

    public off(event: string, callback: SocketListener) {
        this.listeners.get(event)?.delete(callback);
    }

    private emit(event: string, data: any) {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }
}

export const socketService = new SocketService();
