/**
 * Signal Consumer — Kafka consumer for cross-region signaling
 * Receives signaling events from remote regions and delivers
 * them to local users via Redis pub/sub.
 */

import { Kafka } from 'kafkajs';
import { redis } from '../../config/redis.js';
import { LOCAL_REGION } from '../../config/region.js';
import type { SignalEvent } from '../call/call.types.js';

const CROSS_REGION_TOPIC = 'signaling.cross-region';

interface CrossRegionSignal {
    targetRegion: string;
    targetUserId: string;
    sourceRegion: string;
    event: SignalEvent;
    timestamp: number;
}

export class SignalConsumer {
    private kafka: Kafka;

    constructor() {
        this.kafka = new Kafka({
            clientId: `signaling-consumer-${LOCAL_REGION}`,
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            retry: {
                initialRetryTime: 100,
                retries: 5,
            },
        });
    }

    /**
     * Start consuming cross-region signaling events
     * Only processes events targeted at this region
     */
    async start(): Promise<void> {
        const consumer = this.kafka.consumer({
            groupId: `signaling-${LOCAL_REGION}`,
        });

        try {
            await consumer.connect();
            await consumer.subscribe({
                topic: CROSS_REGION_TOPIC,
                fromBeginning: false,
            });

            await consumer.run({
                eachMessage: async ({ message }) => {
                    if (!message.value) return;

                    try {
                        const data: CrossRegionSignal = JSON.parse(message.value.toString());

                        // Only process events targeted at our region
                        if (data.targetRegion !== LOCAL_REGION) return;

                        // Deliver to the local user via Redis pub/sub
                        await redis.publish(
                            `signal:${data.targetUserId}`,
                            JSON.stringify(data.event),
                        );

                        console.log(
                            `[SignalConsumer] Delivered cross-region signal: ${data.event.type} ` +
                            `from ${data.sourceRegion} to user ${data.targetUserId}`,
                        );
                    } catch (parseErr) {
                        console.error('[SignalConsumer] Failed to parse signal:', parseErr);
                    }
                },
            });

            console.log(`✅ Cross-region signal consumer started for ${LOCAL_REGION}`);
        } catch (error) {
            console.error('[SignalConsumer] Failed to start:', error);
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Continuing without cross-region signaling in dev mode');
            }
        }
    }
}

export const signalConsumer = new SignalConsumer();
