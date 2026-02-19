import * as amqp from 'amqplib';
export declare function getRabbitConnection(): Promise<amqp.ChannelModel>;
export declare function getRabbitChannel(): Promise<amqp.Channel>;
export declare const QUEUES: {
    NOTIFICATIONS: string;
};
//# sourceMappingURL=rabbitmq.d.ts.map