import * as amqp from 'amqplib';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
let connection;
let channel;
export async function getRabbitConnection() {
    if (!connection) {
        connection = await amqp.connect(RABBITMQ_URL);
        console.log('✅ RabbitMQ connected');
    }
    return connection;
}
export async function getRabbitChannel() {
    if (!channel) {
        const conn = await getRabbitConnection();
        channel = await conn.createChannel();
        console.log('✅ RabbitMQ channel created');
    }
    return channel;
}
export const QUEUES = {
    NOTIFICATIONS: 'notifications_queue'
};
//# sourceMappingURL=rabbitmq.js.map