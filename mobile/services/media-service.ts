import { api } from "./api-client";

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

    uploadToCloudinary: async (uri: string, signatureData: UploadSignatureResponse): Promise<string> => {
        const formData = new FormData();
        
        // React Native FormData expects an object for files
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append("file", {
            uri,
            name: filename,
            type,
        } as any);
        
        formData.append("api_key", signatureData.apiKey);
        formData.append("timestamp", signatureData.timestamp.toString());
        formData.append("signature", signatureData.signature);
        formData.append("folder", signatureData.folder);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`,
            {
                method: "POST",
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to upload to Cloudinary");
        }

        const data = await response.json();
        return data.secure_url;
    }
};
