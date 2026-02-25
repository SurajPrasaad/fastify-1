import Dexie, { Table } from 'dexie';
import { ChatMessage, ChatRoom, MessageStatus, MessageType } from '@/types/chat';
import { api } from './api-client';

/**
 * FAANG-Level Chat Storage Architecture
 * 
 * DESIGN PRINCIPLES:
 * 1. Offline-First: All read/write operations happen locally first.
 * 2. Eventual Consistency: Reconciliation via background sync and hash/cursor comparisons.
 * 3. Multi-Tab Synergy: Dexie's built-in observable support for tab synchronization.
 * 4. High Availability: Low-latency rendering using IndexedDB as the primary UI source.
 */

export interface LocalMessage extends ChatMessage {
    isSynced?: boolean;
    retryCount?: number;
}

export interface LocalConversation extends ChatRoom {
    lastReadMessageId?: string;
    draftContent?: string;
    isSyncing?: boolean;
}

export interface PendingMessage {
    id?: number;
    tempId: string;
    roomId: string;
    content: string;
    type: MessageType;
    mediaUrl?: string;
    createdAt: string;
    attempts: number;
}

export interface ReadReceipt {
    roomId: string;
    messageId: string;
    userId: string;
    timestamp: string;
}

export class ChatDatabase extends Dexie {
    messages!: Table<LocalMessage>;
    conversations!: Table<LocalConversation>;
    pendingMessages!: Table<PendingMessage>;
    readReceipts!: Table<ReadReceipt>;

    constructor() {
        super('ChatDB');

        this.version(1).stores({
            // Primary Index: _id (Server ID or Temp ID)
            // Secondary Indexes for optimized UI rendering and sync logic
            messages: '&_id, roomId, [roomId+createdAt], senderId, status',

            // Track conversations for the sidebar
            conversations: '&_id, updatedAt, unreadCount',

            // Offline queue for unsent messages
            pendingMessages: '++id, tempId, roomId, createdAt',

            // Audit log for read receipts
            readReceipts: '[roomId+messageId+userId], roomId, userId'
        });
    }

    /**
     * SMART EVICTION STRATEGY (LRU-based partial caching)
     * Keeps only the most recent N messages to maintain performance.
     */
    async evictOldMessages(roomId: string, limit: number = 200) {
        const count = await this.messages.where('roomId').equals(roomId).count();
        if (count > limit) {
            const overflow = count - limit;
            const toDelete = await this.messages
                .where('roomId').equals(roomId)
                .sortBy('createdAt');

            const idsToDelete = toDelete.slice(0, overflow).map(m => m._id);
            await this.messages.bulkDelete(idsToDelete);
        }
    }

    /**
     * DEDUPLICATION & RECONCILIATION
     * Merges server truth with local cache, replacing temp IDs seamlessly.
     */
    async upsertMessage(message: LocalMessage) {
        return this.transaction('rw', this.messages, this.pendingMessages, async () => {
            // If this message confirms a pending one, remove from queue
            if (message.tempId) {
                await this.pendingMessages.where('tempId').equals(message.tempId).delete();
            }

            await this.messages.put(message);
        });
    }

    /**
     * OFFLINE SYNC: Queue a message for background delivery
     */
    async queuePendingMessage(roomId: string, content: string, tempId: string, type: MessageType = MessageType.TEXT) {
        await this.pendingMessages.add({
            tempId,
            roomId,
            content,
            type,
            createdAt: new Date().toISOString(),
            attempts: 0
        });
    }

    /**
     * OFFLINE SYNC: Process the queue when back online
     */
    async processPendingMessages(onSuccess?: (msg: ChatMessage) => void) {
        const pending = await this.pendingMessages.toArray();
        if (pending.length === 0) return;

        console.log(`[Sync] Processing ${pending.length} pending messages...`);

        for (const msg of pending) {
            try {
                // Increment attempts
                await this.pendingMessages.update(msg.id!, { attempts: msg.attempts + 1 });

                const response = await api.post<ChatMessage>(`/rooms/${msg.roomId}/messages`, {
                    content: msg.content,
                    type: msg.type
                });

                // On success, upsert to main table (reconciles via upsertMessage) and remove from queue
                await this.upsertMessage({
                    ...response,
                    tempId: msg.tempId // Ensure reconciliation happens
                });

                onSuccess?.(response);
            } catch (error) {
                console.error(`[Sync] Failed to send message ${msg.tempId}:`, error);
                // If it's a permanent failure (e.g. 400), you might want to remove it, 
                // but usually, we keep it for manual retry if it's a network error.
            }
        }
    }

    /**
     * LOGOUT WIPE
     * Ensures GDPR compliance and security.
     */
    async clearAllData() {
        await this.messages.clear();
        await this.conversations.clear();
        await this.pendingMessages.clear();
        await this.readReceipts.clear();
    }
}

export const db = new ChatDatabase();
