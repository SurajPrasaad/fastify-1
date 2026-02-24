import { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PostMediaProps {
    mediaUrls?: string[];
    type?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL';
}

export const PostMedia = ({ mediaUrls, type }: PostMediaProps) => {
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Auto play/pause based on intersection
    useEffect(() => {
        if (!mediaUrls || mediaUrls.length === 0 || !videoRef.current) return;

        // Only handles primary video for now
        const isVideo = mediaUrls[0].match(/\.(mp4|webm|ogg)$/i) || type === 'VIDEO';
        if (!isVideo) return;

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
    }, [mediaUrls, type]);

    if (!mediaUrls || mediaUrls.length === 0) return null;

    // Determine grid based on number of images
    const gridCols = mediaUrls.length === 1 ? 'grid-cols-1' : mediaUrls.length === 2 ? 'grid-cols-2' : 'grid-cols-2';

    return (
        <div className={cn(
            "mt-3 grid gap-2 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-muted",
            gridCols
        )}>
            {mediaUrls.map((url, index) => {
                const isVideo = url.match(/\.(mp4|webm|ogg)$/i) || type === 'VIDEO';

                if (isVideo) {
                    return (
                        <div key={url} className="relative aspect-video group bg-black">
                            <video
                                ref={videoRef}
                                src={url}
                                className="w-full h-full object-cover"
                                loop
                                muted={isMuted}
                                playsInline
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                                {!isPlaying && <Play className="w-12 h-12 text-white fill-white" />}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMuted(!isMuted);
                                }}
                                className="absolute bottom-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors pointer-events-auto"
                            >
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </div>
                    );
                }

                return (
                    <div
                        key={url}
                        className={cn(
                            "relative overflow-hidden",
                            mediaUrls.length === 3 && index === 0 ? "row-span-2" : "aspect-square"
                        )}
                    >
                        <img
                            src={url}
                            alt={`Post media ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                            loading="lazy"
                        />
                    </div>
                );
            })}
        </div>
    );
};
