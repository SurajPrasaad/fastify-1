
import { ChatEvent } from "../types/chat.types";

type Listener = (event: ChatEvent) => void;

class WebSocketManager {
    private socket: WebSocket | null = null;
    private listeners: Set<Listener> = new Set();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 3000;
    private url: string = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

    constructor() {
        // Singleton pattern if needed, but normally instantiated once in a hook or provider
    }

    connect(token: string) {
        if (this.socket?.readyState === WebSocket.OPEN) return;

        this.socket = new WebSocket(`${this.url}?token=${token}`);

        this.socket.onopen = () => {
            console.log('Chat WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as ChatEvent;
                this.notifyListeners(data);
            } catch (err) {
                console.error('Failed to parse WebSocket message', err);
            }
        };

        this.socket.onclose = () => {
            console.log('Chat WebSocket disconnected');
            this.handleReconnect(token);
        };

        this.socket.onerror = (error) => {
            console.error('Chat WebSocket error', error);
        };
    }

    private handleReconnect(token: string) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(token), this.reconnectInterval * this.reconnectAttempts);
        }
    }

    subscribe(listener: Listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(event: ChatEvent) {
        this.listeners.forEach(listener => listener(event));
    }

    send(event: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(event));
        } else {
            console.warn('WebSocket not connected. Message queued or dropped.');
        }
    }

    disconnect() {
        this.socket?.close();
        this.socket = null;
        this.listeners.clear();
    }
}

export const chatWebSocket = new WebSocketManager();
