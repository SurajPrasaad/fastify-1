import { useState } from "react";
import { MediaService } from "@/services/media.service";
import { toast } from "sonner";

export const useUpload = () => {
    const [isUploading, setIsUploading] = useState(false);

    const upload = async (file: File, folder: string = "uploads"): Promise<string | null> => {
        setIsUploading(true);
        try {
            // 1. Get signed signature
            const signature = await MediaService.getUploadSignature(folder);

            // 2. Upload to Cloudinary
            const url = await MediaService.uploadToCloudinary(file, signature);

            return url;
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        upload,
        isUploading
    };
};
