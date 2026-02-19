import { useState, useCallback } from "react";
import { MediaFile } from "./types";
import { mediaService } from "./media.service";
import { toast } from "sonner";

export function useMediaUpload() {
    const [files, setFiles] = useState<MediaFile[]>([]);

    const addFiles = useCallback((newFiles: File[]) => {
        const mediaFiles: MediaFile[] = newFiles.map((file) => ({
            id: Math.random().toString(36).substring(7),
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
            status: "idle",
            progress: 0,
        }));

        setFiles((prev) => [...prev, ...mediaFiles].slice(0, 4)); // Max 4 items
    }, []);

    const removeFile = useCallback((id: string) => {
        setFiles((prev) => {
            const filtered = prev.filter((f) => f.id !== id);
            const removed = prev.find((f) => f.id === id);
            if (removed) URL.revokeObjectURL(removed.preview);
            return filtered;
        });
    }, []);

    const clearFiles = useCallback(() => {
        files.forEach((f) => URL.revokeObjectURL(f.preview));
        setFiles([]);
    }, [files]);

    const uploadAll = async () => {
        if (files.length === 0) return [];

        const uploadPromises = files.map(async (file) => {
            if (file.status === "success" && file.remoteUrl) return file;

            try {
                setFiles((prev) =>
                    prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" } : f))
                );

                // 1. Get signature
                const signature = await mediaService.getUploadSignature();

                // 2. Upload to Cloudinary
                const response = await mediaService.uploadToCloudinary(
                    file.file,
                    signature,
                    (progress) => {
                        setFiles((prev) =>
                            prev.map((f) => (f.id === file.id ? { ...f, progress } : f))
                        );
                    }
                );

                const successFile: MediaFile = {
                    ...file,
                    status: "success",
                    progress: 100,
                    remoteUrl: response.secure_url,
                    remoteMetadata: response,
                };

                setFiles((prev) =>
                    prev.map((f) => (f.id === file.id ? successFile : f))
                );

                return successFile;
            } catch (error) {
                console.error("Upload error:", error);
                setFiles((prev) =>
                    prev.map((f) => (f.id === file.id ? { ...f, status: "error" } : f))
                );
                toast.error(`Failed to upload ${file.file.name}`);
                throw error;
            }
        });

        return Promise.all(uploadPromises);
    };

    return {
        files,
        addFiles,
        removeFile,
        clearFiles,
        uploadAll,
        isUploading: files.some((f) => f.status === "uploading"),
    };
}
