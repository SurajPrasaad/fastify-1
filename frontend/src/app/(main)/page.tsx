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
        repostsCount: p.repostsCount || 0,
        pollId: p.pollId,
        poll: p.poll,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        isLiked: !!p.isLiked,
        isBookmarked: !!p.isBookmarked,
        isReposted: !!p.isReposted,
        status: p.status || "PUBLISHED",
        originalPost: p.originalPost ? {
            id: p.originalPost.id,
            content: p.originalPost.content,
            createdAt: p.originalPost.createdAt,
            author: p.originalPost.author
        } : null
    });

    React.useEffect(() => {
        const fetchPosts = async () => {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
            try {
                const res = await fetch(`${API_URL}/posts`);
                if (!res.ok) return;
                const data = await res.json();

                const mappedPosts = data.map(mapBackendPost);
                // Filter out any duplicates if the backend returns them
                const uniquePosts: Post[] = Array.from(new Map(mappedPosts.map((p: any) => [p.id, p])).values()) as Post[];
                setPosts(uniquePosts);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
            }
        };

        fetchPosts();
    }, []);

    const handlePostSuccess = (newPost: any) => {
        const mapped = mapBackendPost(newPost);
        setPosts(prev => {
            if (prev.some(p => p.id === mapped.id)) return prev;
            return [mapped, ...prev];
        });
    };

    const [showJumpToPresent, setShowJumpToPresent] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 500) {
                setShowJumpToPresent(true);
            } else {
                setShowJumpToPresent(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark relative">
            {/* Sticky Header Tabs */}
            <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50">
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

            {/* Jump to Present Button */}
            {showJumpToPresent && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-20 md:bottom-8 right-4 md:right-8 lg:right-[calc((100vw-1440px)/2+20px)] xl:right-[calc((100vw-1440px)/2+40px)] z-50 flex items-center justify-center gap-3 bg-primary text-white px-15 py-3 rounded-full shadow-lg shadow-primary/40 hover:brightness-110 active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 group min-w-[260px]"
                >
                    <span className="material-symbols-outlined text-[20px] group-hover:-translate-y-0.5 transition-transform">arrow_upward</span>
                    <span className="text-sm font-bold">Jump to present</span>
                </button>
            )}
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
