import 'dotenv/config';
import { app } from "./app.js";
import { connectMongoose } from "./config/mongoose.js";
import { getRabbitChannel } from "./config/rabbitmq.js";
import { testDbConnection } from "./config/drizzle.js";
import { redis } from "./config/redis.js"; // Importing triggers 'connect' listener
const start = async () => {
    try {
        // Initialize Database Connections
        console.log("🚀 Initializing services...");
        await testDbConnection();
        await connectMongoose();
        await getRabbitChannel();
        // Start Notification Service Drivers (Staff Design)
        const { connectKafka } = await import("./config/kafka.js");
        const { startKafkaIngestion } = await import("./modules/notification/notification.kafka.js");
        const { startDeliveryWorkers } = await import("./modules/notification/notification.worker.js");
        await connectKafka();
        startKafkaIngestion();
        startDeliveryWorkers();
        const port = Number(process.env.PORT) || 3000;
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Server running on http://localhost:${port} 🚀`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map