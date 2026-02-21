
import React from 'react';
import { FileIcon, X, Download, Play, FileText } from 'lucide-react';
import { IAttachment } from '../types/chat.types';
import { motion } from 'framer-motion';

interface AttachmentPreviewProps {
    attachments: IAttachment[];
    onRemove?: (id: string) => void;
    isEditable?: boolean;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
    attachments,
    onRemove,
    isEditable = false
}) => {
    if (attachments.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 p-2">
            {attachments.map((file) => (
                <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group rounded-xl border bg-card overflow-hidden w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center"
                >
                    {file.type === 'IMAGE' ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                    ) : file.type === 'VIDEO' ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/10">
                            <Play className="w-8 h-8 text-primary fill-primary" />
                            {file.thumbnailUrl && <img src={file.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1 p-2 text-center">
                            <FileText className="w-8 h-8 text-primary" />
                            <span className="text-[10px] truncate w-full px-1">{file.name}</span>
                        </div>
                    )}

                    {isEditable && onRemove && (
                        <button
                            onClick={() => onRemove(file.id)}
                            className="absolute top-1 right-1 p-1 bg-background/80 backdrop-blur-md rounded-full border shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-all opacity-0 group-hover:opacity-100"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {!isEditable && (
                        <a
                            href={file.url}
                            download
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Download className="w-6 h-6 text-white" />
                        </a>
                    )}
                </motion.div>
            ))}
        </div>
    );
};
