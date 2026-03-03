/**
 * Presence Federation — Kafka-based cross-region presence sync
 * Publishes local presence changes to Kafka topic `presence.sync`
 * Consumes presence events from other regions and updates local gpresence cache.
 *
 * Uses its own dedicated Kafka consumer to avoid conflicts with
 * the notification consumer (KafkaJS doesn't allow subscribing
 * to new topics after consumer.run() is called).
 */

import { Kafka } from 'kafkajs';
import { producer } from '../../config/kafka.js';
import { redis } from '../../config/redis.js';
import { LOCAL_REGION } from '../../config/region.js';

const PRESENCE_TOPIC = 'presence.sync';
const GPRESENCE_TTL = 300; // 5 minute cache for cross-region presence

export class PresenceFederation {
    private kafka: Kafka;

    constructor() {
        this.kafka = new Kafka({
            clientId: `presence-federation-${LOCAL_REGION}`,
            brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
            retry: {
                initialRetryTime: 100,
                retries: 5,
            },
        });
    }

    /**
     * Publish a presence change to Kafka for cross-region replication
     */
    async publishPresenceChange(
        userId: string,
        status: 'ONLINE' | 'OFFLINE',
    ): Promise<void> {
        try {
            await producer.send({
                topic: PRESENCE_TOPIC,
                messages: [{
                    key: userId,
                    value: JSON.stringify({
                        userId,
                        region: LOCAL_REGION,
                        status,
                        timestamp: Date.now(),
                    }),
                }],
            });
        } catch (error) {
            console.error('[PresenceFed] Failed to publish presence change:', error);
        }
    }

    /**
     * Start consuming presence events from other regions
     * Uses its own dedicated consumer instance to avoid conflicts
     * with the shared notification consumer.
     */
    async startConsumer(): Promise<void> {
        try {
            const consumer = this.kafka.consumer({
                groupId: `presence-federation-${LOCAL_REGION}`,
            });

            await consumer.connect();
            await consumer.subscribe({ topic: PRESENCE_TOPIC, fromBeginning: false });

            await consumer.run({
                eachMessage: async ({ message }) => {
                    if (!message.value) return;

                    try {
                        const data = JSON.parse(message.value.toString()) as {
                            userId: string;
                            region: string;
                            status: 'ONLINE' | 'OFFLINE';
                            timestamp: number;
                        };

                        // Skip events from our own region
                        if (data.region === LOCAL_REGION) return;

                        if (data.status === 'ONLINE') {
                            await redis.hmset(`gpresence:${data.userId}`, {
                                region: data.region,
                                status: data.status,
                                timestamp: data.timestamp.toString(),
                            });
                            await redis.expire(`gpresence:${data.userId}`, GPRESENCE_TTL);
                        } else {
                            // User went offline in their region
                            await redis.del(`gpresence:${data.userId}`);
                        }
                    } catch (parseErr) {
                        console.error('[PresenceFed] Failed to parse presence message:', parseErr);
                    }
                },
            });

            console.log(`✅ Presence federation consumer started for region ${LOCAL_REGION}`);
        } catch (error) {
            console.error('[PresenceFed] Failed to start consumer:', error);
            // In development, continue without federation
            if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ Continuing without presence federation in development mode');
            }
        }
    }
}

export const presenceFederation = new PresenceFederation();
