import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { requireAuth } from '../../middleware/auth.js';
import { getUploadSignatureHandler, deleteMediaHandler } from './media.controller.js';
import { getUploadSignatureSchema } from './media.schema.js';

export async function mediaRoutes(app: FastifyInstance) {
    const provider = app.withTypeProvider<ZodTypeProvider>();

    // Use a sub-router for protected routes
    app.register(async (protectedApp) => {
        const protectedProvider = protectedApp.withTypeProvider<ZodTypeProvider>();
        protectedApp.addHook('preHandler', requireAuth);

        // Endpoint for generating upload signatures
        // Limited to 10 signatures per minute to prevent abuse
        protectedProvider.get(
            '/signature',
            {
                schema: {
                    querystring: getUploadSignatureSchema,
                    tags: ['Media'],
                    description: 'Get a signed upload signature for Cloudinary'
                },
                config: {
                    rateLimit: {
                        max: 10,
                        timeWindow: '1 minute'
                    }
                }
            },
            getUploadSignatureHandler
        );

        protectedProvider.delete(
            '/',
            {
                schema: {
                    tags: ['Media']
                }
            },
            deleteMediaHandler
        );
    });
}
