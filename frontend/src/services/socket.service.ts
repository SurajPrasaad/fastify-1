import { api } from "@/lib/api-client";
import { io, Socket } from "socket.io-client";

type SocketListener = (data: any) => void;

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<SocketListener>> = new Map();
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
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
                transports: ['websocket'],
                reconnectionAttempts: 5,
            });

            this.socket.on("connect", () => {
                console.log("SocketService: Connected (Socket.IO)");
                this.emit('open', {});
            });

            this.socket.on("disconnect", () => {
                console.log("SocketService: Disconnected");
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

            // Special case for Socket.IO direct events if they match our internal event names
            this.socket.onAny((eventName, ...args) => {
                if (eventName !== 'event') {
                    this.emit(eventName, args[0]);
                }
            });

        } catch (err) {
            console.error("SocketService: Connection failed", err);
        }
    }

    public disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
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
