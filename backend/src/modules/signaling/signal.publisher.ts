/**
 * Signal Publisher — Redis Pub/Sub (local) + Kafka (cross-region)
 * Routes signaling events to the correct user regardless of which pod
 * or region they are connected to.
 */

import { redis } from '../../config/redis.js';
import { producer } from '../../config/kafka.js';
import { LOCAL_REGION } from '../../config/region.js';
import { presenceService } from '../presence/presence.service.js';
import type { SignalEvent } from '../call/call.types.js';

const CROSS_REGION_TOPIC = 'signaling.cross-region';
const CALL_EVENTS_TOPIC = 'call.events';

export class SignalPublisher {

    /**
     * Publish a signal event to a target user
     * Automatically routes via Redis (same-region) or Kafka (cross-region)
     */
    async publishToUser(targetUserId: string, event: SignalEvent): Promise<boolean> {
        const location = await presenceService.resolveUserLocation(targetUserId);

        if (!location) {
            console.warn(`[Signal] User ${targetUserId} is offline`);
            return false;
        }

        if (location.region === LOCAL_REGION) {
            // Same region — use Redis pub/sub (fast path)
            await redis.publish(
                `signal:${targetUserId}`,
                JSON.stringify(event),
            );
            return true;
        }

        // Cross-region — use Kafka
        await this.publishCrossRegion(location.region, targetUserId, event);
        return true;
    }

    /**
     * Publish to Kafka for cross-region signaling
     */
    async publishCrossRegion(
        targetRegion: string,
        targetUserId: string,
        event: SignalEvent,
    ): Promise<void> {
        try {
            await producer.send({
                topic: CROSS_REGION_TOPIC,
                messages: [{
                    key: targetUserId,
                    value: JSON.stringify({
                        targetRegion,
                        targetUserId,
                        sourceRegion: LOCAL_REGION,
                        event,
                        timestamp: Date.now(),
                    }),
                }],
            });
        } catch (error) {
            console.error(`[Signal] Failed to publish cross-region signal:`, error);
        }
    }

    /**
     * Publish a call lifecycle event to Kafka for analytics & auditing
     */
    async publishCallEvent(event: {
        type: string;
        callId: string;
        callerId: string;
        receiverId: string;
        callType: string;
        region: string;
        metadata?: Record<string, unknown>;
    }): Promise<void> {
        try {
            await producer.send({
                topic: CALL_EVENTS_TOPIC,
                messages: [{
                    key: event.callId,
                    value: JSON.stringify({
                        ...event,
                        timestamp: Date.now(),
                    }),
                }],
            });
        } catch (error) {
            console.error('[Signal] Failed to publish call event:', error);
        }
    }

    /**
     * Broadcast a signal to a specific Redis Pub/Sub channel
     */
    async publishToChannel(channel: string, event: SignalEvent): Promise<void> {
        await redis.publish(channel, JSON.stringify(event));
    }
}

export const signalPublisher = new SignalPublisher();
