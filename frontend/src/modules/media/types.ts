export interface CloudinarySignatureResponse {
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    folder: string;
}

export interface CloudinaryUploadResponse {
    public_id: string;
    version: number;
    signature: string;
    width: number;
    height: number;
    format: string;
    resource_type: "image" | "video" | "audio";
    created_at: string;
    bytes: number;
    type: string;
    url: string;
    secure_url: string;
    duration?: number;
}

export interface MediaFile {
    id: string;
    file: File;
    preview: string;
    type: "image" | "video";
    status: "idle" | "uploading" | "success" | "error";
    progress: number;
    remoteUrl?: string;
    remoteMetadata?: CloudinaryUploadResponse;
}
