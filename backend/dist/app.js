import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './modules/health/health.route.js';
import { userRoutes } from './modules/user/user.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { commentRoutes } from './modules/comment/comment.routes.js';
import { interactionRoutes } from './modules/interaction/interaction.routes.js';
import { notificationRoutes } from './modules/notification/notification.routes.js';
import { postRoutes } from './modules/post/post.routes.js';
import { feedRoutes } from './modules/feed/feed.routes.js';
import { recommendationRoutes } from './modules/recommendation/recommendation.routes.js';
import { blockRoutes } from './modules/block/block.routes.js';
import { privacyRoutes } from './modules/privacy/privacy.routes.js';
import { engagementRoutes } from './modules/engagement/engagement.routes.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import fastifyWebsocket from '@fastify/websocket';
import sessionPlugin from './plugin/session.js';
import rateLimitPlugin from './plugin/rate-limit.js';
import swaggerPlugin from './plugin/swagger.js';
const rawApp = Fastify({ logger: true });
rawApp.setValidatorCompiler(validatorCompiler);
rawApp.setSerializerCompiler(serializerCompiler);
export const app = rawApp.withTypeProvider();
app.register(cors, {
    origin: true, // In production, replace with specific domain
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
app.get('/', async () => {
    return { message: 'Fastify + TypeScript Running 🚀' };
});
app.register(sessionPlugin);
app.register(rateLimitPlugin);
app.register(swaggerPlugin);
app.register(healthRoutes);
app.register(userRoutes, { prefix: '/users' });
app.register(authRoutes, { prefix: '/auth' });
app.register(commentRoutes, { prefix: '/comments' });
app.register(interactionRoutes, { prefix: '/interactions' });
app.register(fastifyWebsocket);
app.register(notificationRoutes, { prefix: '/notifications' });
app.register(postRoutes, { prefix: '/posts' });
app.register(feedRoutes, { prefix: '/feeds' });
app.register(recommendationRoutes, { prefix: '/recommendations' });
app.register(blockRoutes, { prefix: '/blocks' });
app.register(privacyRoutes, { prefix: '/privacy' });
app.register(engagementRoutes, { prefix: '/engagement' });
app.register(chatRoutes, { prefix: '/chat' });
app.setErrorHandler((error, request, reply) => {
    const err = error;
    request.log.error(err);
    const statusCode = err.statusCode || 500;
    reply.status(statusCode).send({
        statusCode,
        code: err.code,
        error: err.name,
        message: err.message,
        stack: err.stack
    });
});
//# sourceMappingURL=app.js.map