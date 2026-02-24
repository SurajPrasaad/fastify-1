import fp from 'fastify-plugin';
import fastifySwagger, { type FastifySwaggerOptions } from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';

export default fp<FastifySwaggerOptions>(async (fastify) => {
    await fastify.register(fastifySwagger, {
        openapi: {
            info: {
                title: 'Fastify API',
                description: 'PostgreSQL, MongoDB, Drizzle, and more! REST API documentation generated automatically.',
                version: '1.0.0',
            },
            servers: [
                {
                    url: 'http://localhost:8000',
                    description: 'Local development server'
                }
            ],
            components: {
                securitySchemes: {
                    sessionAuth: {
                        type: 'apiKey',
                        name: 'connect.sid',
                        in: 'cookie'
                    },
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        },
        transform: jsonSchemaTransform,
    });

    await fastify.register(fastifySwaggerUi, {
        routePrefix: '/docs',
    });
});
