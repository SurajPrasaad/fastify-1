"use client"

import * as React from "react"
import { FeedList } from "@/components/feed/feed-list"
import { Post } from "@/components/feed/post-card"
import { PostComposer } from "@/components/feed/post-composer"
import { cn } from "@/lib/utils"

export default function FeedPage() {
    const [activeTab, setActiveTab] = React.useState<"for-you" | "following">("for-you")
    const [posts, setPosts] = React.useState<Post[]>([])

    const mapBackendPost = (p: any) => ({
        id: p.id,
        userId: p.userId,
        author: {
            username: p.author?.username || "anonymous",
            name: p.author?.name || "Anonymous",
            avatarUrl: p.author?.avatarUrl || null,
            isVerified: true,
        },
        content: p.content,
        mediaUrls: p.mediaUrls || [],
        likesCount: p.likesCount || 0,
        commentsCount: p.commentsCount || 0,
        sharesCount: 0,
        pollId: p.pollId,
        poll: p.poll,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        isLiked: !!p.isLiked,
        isBookmarked: !!p.isBookmarked,
        status: p.status || "PUBLISHED"
    });

    React.useEffect(() => {
        const fetchPosts = async () => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
            try {
                const res = await fetch(`${API_URL}/posts`);
                if (!res.ok) return;
                const data = await res.json();

                const mappedPosts = data.map(mapBackendPost);
                setPosts(mappedPosts);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            }
        };

        fetchPosts();
    }, []);

    const handlePostSuccess = (newPost: any) => {
        const mapped = mapBackendPost(newPost);
        setPosts(prev => [mapped, ...prev]);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark">
            {/* Sticky Header Tabs */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50">
                <div className="flex w-full">
                    <TabItem
                        label="For You"
                        active={activeTab === "for-you"}
                        onClick={() => setActiveTab("for-you")}
                    />
                    <TabItem
                        label="Following"
                        active={activeTab === "following"}
                        onClick={() => setActiveTab("following")}
                    />
                </div>
            </header>

            {/* Composer */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/50">
                <PostComposer onSuccess={handlePostSuccess} />
            </div>

            {/* The Feed */}
            <div className="flex-1">
                <FeedList initialPosts={posts} />
            </div>
        </div>
    )
}

function TabItem({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-1 py-4 text-sm font-bold transition-all border-b-2",
                active
                    ? "border-primary text-slate-900 dark:text-slate-100"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            )}
        >
            {label}
        </button>
    )
}
