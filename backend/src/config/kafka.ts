
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: {
        initialRetryTime: 100,
        retries: 3
    }
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'notification-group' });

export const connectKafka = async () => {
    try {
        await producer.connect();
        await consumer.connect();
        console.log('✅ Connected to Kafka');
        return true;
    } catch (error) {
        console.error('❌ Kafka Connection Error:', (error as any).message);
        if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Continuing without Kafka in development mode...');
            return false;
        }
        throw error;
    }
};
