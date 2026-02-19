import cloudinary from '../../config/cloudinary.js';
import { AppError } from '../../utils/AppError.js';

export class MediaService {
    /**
     * Generates a signed upload signature for Cloudinary.
     * This prevents exposing the API Secret and ensures only authorized users can upload.
     */
    async generateUploadSignature(userId: string, folder: string) {
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Security: Restrict folder path to user-specific directory
        // Pattern: users/{userId}/{folder}
        const uploadFolder = `social_app/users/${userId}/${folder}`;

        const paramsToSign = {
            timestamp,
            folder: uploadFolder,
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET!
        );

        return {
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: uploadFolder,
        };
    }

    /**
     * Deletes a resource from Cloudinary.
     */
    async deleteMedia(publicId: string) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            return result;
        } catch (error) {
            console.error(`Failed to delete media ${publicId} from Cloudinary:`, error);
            throw new AppError("Failed to delete media from storage", 500);
        }
    }

    /**
     * Validates if a provided Cloudinary URL is authentic and belongs to the user's folder.
     * (FAANG-level security: Never trust client-provided strings)
     */
    validateCloudinaryUrl(url: string, userId: string): boolean {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const expectedPrefix = `https://res.cloudinary.com/${cloudName}/image/upload/v\\d+/social_app/users/${userId}/`;
        const regex = new RegExp(expectedPrefix);
        return regex.test(url);
    }
}
