import { z } from 'zod';

export const getUploadSignatureSchema = z.object({
    folder: z.string().optional().default('general'),
    resourceType: z.enum(['image', 'video', 'auto']).optional().default('auto'),
});

export const mediaMetadataSchema = z.object({
    id: z.string().uuid().optional(),
    publicId: z.string(),
    secureUrl: z.string().url(),
    resourceType: z.enum(['image', 'video', 'audio']),
    format: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    bytes: z.number().optional(),
});
