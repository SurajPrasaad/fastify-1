import { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface PostMediaProps {
    mediaUrl?: string;
    type: 'TEXT' | 'IMAGE' | 'VIDEO';
}

export const PostMedia = ({ mediaUrl, type }: PostMediaProps) => {
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Auto play/pause based on intersection
    useEffect(() => {
        if (type !== 'VIDEO' || !videoRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(() => { });
                    setIsPlaying(true);
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.6 }
        );

        observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, [type, mediaUrl]);

    if (!mediaUrl) return null;

    if (type === 'IMAGE') {
        return (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
                <img
                    src={mediaUrl}
                    alt="Post media"
                    className="w-full h-auto object-cover max-h-[512px]"
                    loading="lazy"
                />
            </div>
        );
    }

    if (type === 'VIDEO') {
        return (
            <div className="mt-3 relative rounded-2xl overflow-hidden bg-black aspect-video group">
                <video
                    ref={videoRef}
                    src={mediaUrl}
                    className="w-full h-full"
                    loop
                    muted={isMuted}
                    playsInline
                />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                    {!isPlaying && <Play className="w-12 h-12 text-white fill-white" />}
                </div>

                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
            </div>
        );
    }

    return null;
};
