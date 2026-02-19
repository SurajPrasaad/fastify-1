import type { FastifyReply, FastifyRequest } from 'fastify';
import { MediaService } from './media.service.js';
import { AppError } from '../../utils/AppError.js';

const mediaService = new MediaService();

export async function getUploadSignatureHandler(
    request: FastifyRequest<{ Querystring: { folder: string } }>,
    reply: FastifyReply
) {
    if (!request.user || !(request.user as any).sub) {
        throw new AppError("Unauthorized", 401);
    }

    const userId = (request.user as any).sub;
    const { folder } = request.query;

    const signatureData = await mediaService.generateUploadSignature(userId, folder);
    return reply.send(signatureData);
}

/**
 * Handle direct post-upload notification if needed, 
 * but usually the client sends the URL to the Post controller.
 */
export async function deleteMediaHandler(
    request: FastifyRequest<{ Body: { publicId: string } }>,
    reply: FastifyReply
) {
    const userId = (request.user as any).sub;
    const { publicId } = request.body;

    // Verification step: Ensure the publicId belongs to the user
    // This usually requires a DB lookup before calling Cloudinary.
    if (!publicId.includes(userId)) {
        throw new AppError("Forbidden: You do not own this resource", 403);
    }

    await mediaService.deleteMedia(publicId);
    return reply.send({ message: "Media deleted successfully" });
}
