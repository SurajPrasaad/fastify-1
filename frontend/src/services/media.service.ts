import { api } from "@/lib/api-client";

export interface UploadSignatureResponse {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
}

export const MediaService = {
    getUploadSignature: async (folder: string): Promise<UploadSignatureResponse> => {
        return api.get<UploadSignatureResponse>(`/media/signature?folder=${folder}`);
    },

    uploadToCloudinary: async (file: File, signatureData: UploadSignatureResponse): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signatureData.apiKey);
        formData.append("timestamp", signatureData.timestamp.toString());
        formData.append("signature", signatureData.signature);
        formData.append("folder", signatureData.folder);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to upload to Cloudinary");
        }

        const data = await response.json();
        return data.secure_url;
    },

    deleteMedia: async (publicId: string): Promise<void> => {
        return api.delete("/media", { body: JSON.stringify({ publicId }) });
    }
};
