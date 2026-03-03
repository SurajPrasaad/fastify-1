/**
 * Server Entry Point — Enhanced with graceful shutdown,
 * call state auditor, cross-region consumers, and presence federation
 */

import 'dotenv/config';
import { app } from './app.js';
import { connectMongoose } from './config/mongoose.js';
import { getRabbitChannel } from './config/rabbitmq.js';
import { testDbConnection } from './config/drizzle.js';
import { redis } from './config/redis.js';
import { LOCAL_REGION, POD_ID } from './config/region.js';

const start = async () => {
  try {
    console.log(`🚀 Initializing services (Region: ${LOCAL_REGION}, Pod: ${POD_ID})...`);

    // ── Core Database Connections ──
    await testDbConnection();
    await connectMongoose();
    await getRabbitChannel();

    // ── Kafka & Notification Workers ──
    const { connectKafka } = await import('./config/kafka.js');
    const { startKafkaIngestion } = await import('./modules/notification/notification.kafka.js');
    const { startDeliveryWorkers } = await import('./modules/notification/notification.worker.js');

    const kafkaConnected = await connectKafka();

    if (kafkaConnected) {
      startKafkaIngestion();
      startDeliveryWorkers();

      // ── Cross-Region Signaling Consumer ──
      const { signalConsumer } = await import('./modules/signaling/signal.consumer.js');
      await signalConsumer.start();

      // ── Presence Federation Consumer ──
      const { presenceFederation } = await import('./modules/presence/presence.federation.js');
      await presenceFederation.startConsumer();

      console.log('✅ Cross-region consumers started');
    }

    // ── Call State Auditor (CronJob) ──
    const { callAuditor } = await import('./modules/call/call.auditor.js');
    callAuditor.start();

    // ── Start HTTP Server ──
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port} 🚀`);
    console.log(`Region: ${LOCAL_REGION} | Pod: ${POD_ID}`);

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// ────────────────────────────────────────────────────────
// Graceful Shutdown Handler
// ────────────────────────────────────────────────────────

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 ${signal} received, starting graceful shutdown...`);

  try {
    // 1. Stop call auditor
    const { callAuditor } = await import('./modules/call/call.auditor.js');
    callAuditor.stop();

    // 2. Notify connected clients to reconnect (via Socket.IO)
    const io = (app as any).io;
    if (io) {
      const sockets = await io.fetchSockets();
      for (const socket of sockets) {
        socket.emit('system:reconnect', {
          reason: 'MAINTENANCE',
          retryAfterMs: 1000 + Math.random() * 4000, // Staggered 1-5s
        });
      }

      // Wait for active calls to drain (max 15s in shutdown)
      const drainStart = Date.now();
      const MAX_DRAIN_MS = 15_000;
      while (Date.now() - drainStart < MAX_DRAIN_MS) {
        const connectedSockets = await io.fetchSockets();
        if (connectedSockets.length === 0) break;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Force-close remaining sockets
      const remainingSockets = await io.fetchSockets();
      for (const socket of remainingSockets) {
        socket.disconnect(true);
      }
    }

    // 3. Cleanup pod presence entries
    const { presenceService } = await import('./modules/presence/presence.service.js');
    await presenceService.cleanupPodPresence(POD_ID);

    // 4. Close the Fastify server
    await app.close();
    console.log('✅ Server closed gracefully');

    // 5. Close Redis connection
    await redis.quit();
    console.log('✅ Redis disconnected');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

start();
