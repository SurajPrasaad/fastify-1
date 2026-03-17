import { useState } from "react";
import { MediaService } from "../services/media-service";
import { Alert } from "react-native";

export const useUpload = () => {
    const [isUploading, setIsUploading] = useState(false);

    const upload = async (uri: string, folder: string = "uploads"): Promise<string | null> => {
        setIsUploading(true);
        try {
            const signature = await MediaService.getUploadSignature(folder);
            const url = await MediaService.uploadToCloudinary(uri, signature);
            return url;
        } catch (error: any) {
            Alert.alert("Upload Error", error.message || "Failed to upload image");
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
