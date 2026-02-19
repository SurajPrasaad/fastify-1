"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2, ImageOff } from "lucide-react";

export default function ProfileMediaPage() {
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const mediaItems = [
        "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
        "https://images.unsplash.com/photo-1558494949-ef010911182e?w=400&h=400&fit=crop",
    ];

    if (mediaItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ImageOff className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No media yet</h3>
                <p className="text-muted-foreground mt-1 max-w-[280px]">
                    When you post photos or videos, they will show up here.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-1">
            {mediaItems.map((url, i) => (
                <div key={i} className="relative aspect-square bg-muted overflow-hidden hover:opacity-90 cursor-pointer transition-opacity">
                    <Image
                        src={url}
                        alt="Profile media"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 20vw"
                    />
                </div>
            ))}
        </div>
    );
}
