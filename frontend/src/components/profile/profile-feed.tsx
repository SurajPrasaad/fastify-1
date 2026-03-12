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
                    const mapped: Post[] = data.map((p: any) => ({
                        id: p.id,
                        userId: p.userId,
                        author: {
                            username: p.author?.username || "anonymous",
                            name: p.author?.name || "Anonymous",
                            avatarUrl: p.author?.avatarUrl || null,
                            isVerified: false,
                        },
                        content: p.content,
                        mediaUrls: p.mediaUrls || [],
                        likesCount: p.likesCount || 0,
                        commentsCount: p.commentsCount || 0,
                        repostsCount: p.repostsCount || 0,
                        status: p.status || "PUBLISHED",
                        createdAt: p.createdAt,
                        updatedAt: p.updatedAt || p.createdAt,
                        isLiked: !!p.isLiked,
                        isBookmarked: !!p.isBookmarked,
                        isReposted: !!p.isReposted,
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
