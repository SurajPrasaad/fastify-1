
import * as amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

let connection: amqp.ChannelModel;
let channel: amqp.Channel;

export async function getRabbitConnection() {
    if (!connection) {
        connection = await amqp.connect(RABBITMQ_URL);

        // Prevent unhandled error events from crashing the process
        connection.on('error', (err) => {
            console.error('❌ RabbitMQ connection error:', err.message);
            connection = null as any;
            channel = null as any;
        });

        connection.on('close', () => {
            console.warn('⚠️ RabbitMQ connection closed');
            connection = null as any;
            channel = null as any;
        });

        console.log('✅ RabbitMQ connected');
    }
    return connection;
}

export async function getRabbitChannel() {
    if (!channel || (channel as any).closed) {
        const conn = await getRabbitConnection();
        channel = await conn.createChannel();

        // Prevent channel-level errors from crashing the process
        channel.on('error', (err) => {
            console.error('❌ RabbitMQ channel error:', err.message);
            channel = null as any;
        });

        channel.on('close', () => {
            channel = null as any;
        });

        console.log('✅ RabbitMQ channel created');
    }
    return channel;
}

export const QUEUES = {
    NOTIFICATIONS: 'notifications_queue'
};
