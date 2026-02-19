"use client";

import { useEffect, useState } from "react";
import { postService } from "@/services/post.service";
import { FeedList } from "@/components/feed/feed-list";
import { Post } from "@/components/feed/post-card";
import { Loader2 } from "lucide-react";

interface ProfileFeedProps {
    username: string;
}

export function ProfileFeed({ username }: ProfileFeedProps) {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const data = await postService.getPosts(undefined, 10, { authorUsername: username });

                if (Array.isArray(data)) {
                    const mapped = data.map((p: any) => ({
                        id: p.id,
                        userId: p.userId,
                        author: {
                            username: p.author?.username || "anonymous",
                            displayName: p.author?.name || "Anonymous",
                            avatarUrl: p.author?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.userId}`,
                            isVerified: false,
                        },
                        content: p.content,
                        media: p.mediaUrls?.map((url: string) => {
                            const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video/upload/');
                            return {
                                type: isVideo ? "video" : "image",
                                url,
                            };
                        }),
                        stats: {
                            likes: p.likesCount || 0,
                            comments: p.commentsCount || 0,
                            shares: 0,
                        },
                        createdAt: new Date(p.createdAt),
                        isLiked: !!p.isLiked,
                        isBookmarked: !!p.isBookmarked,
                    }));
                    setPosts(mapped);
                }
            } catch (error) {
                console.error("Failed to fetch profile posts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPosts();
    }, [username]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return <FeedList initialPosts={posts} filters={{ authorUsername: username }} />;
}
