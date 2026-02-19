import { api } from "@/lib/api-client";
import { CloudinarySignatureResponse, CloudinaryUploadResponse } from "./types";

export const mediaService = {
    /**
     * Fetches a signed upload signature from our backend.
     */
    async getUploadSignature(folder: string = "posts"): Promise<CloudinarySignatureResponse> {
        return api.get(`/media/signature?folder=${folder}`);
    },

    /**
     * Uploads a file directly to Cloudinary using a signed signature.
     * We skip our Auth headers here because we're talking to Cloudinary, not our API.
     */
    async uploadToCloudinary(
        file: File,
        signatureData: CloudinarySignatureResponse,
        onProgress?: (progress: number) => void
    ): Promise<CloudinaryUploadResponse> {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signatureData.apiKey);
        formData.append("timestamp", signatureData.timestamp.toString());
        formData.append("signature", signatureData.signature);
        formData.append("folder", signatureData.folder);

        // Using XHR for progress tracking since Fetch API doesn't support it natively yet
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/${file.type.startsWith("video") ? "video" : "image"}/upload`;

            xhr.open("POST", url);

            if (onProgress) {
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        onProgress(percentComplete);
                    }
                };
            }

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.response));
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
                }
            };

            xhr.onerror = () => reject(new Error("Network error during upload"));
            xhr.send(formData);
        });
    },
};
