
"use client"

import * as React from "react"
import { useInView } from "react-intersection-observer"
import { Loader2 } from "lucide-react"

import { PostCard, type Post } from "@/components/feed/post-card"
import { postService } from "@/services/post.service"

interface FeedListProps {
    initialPosts: Post[]
    filters?: {
        authorUsername?: string
        authorId?: string
    }
}

export function FeedList({ initialPosts, filters }: FeedListProps) {
    const [posts, setPosts] = React.useState<Post[]>(initialPosts)
    const [isLoading, setIsLoading] = React.useState(false)
    const [hasMore, setHasMore] = React.useState(initialPosts.length >= 10)

    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: "100px",
    })

    React.useEffect(() => {
        // Sync with initialPosts when server-side data changes (e.g. on router.refresh)
        setPosts(initialPosts)
        setHasMore(initialPosts.length >= 10)
    }, [initialPosts])

    React.useEffect(() => {
        if (inView && !isLoading && hasMore) {
            loadMorePosts()
        }
    }, [inView, isLoading, hasMore])

    const loadMorePosts = async () => {
        if (posts.length === 0) return;

        setIsLoading(true)
        try {
            const lastPost = posts[posts.length - 1];
            const cursor = lastPost.createdAt instanceof Date
                ? lastPost.createdAt.toISOString()
                : lastPost.createdAt;

            const data = await postService.getPosts(cursor, 10, filters);

            if (!data || (data as any[]).length === 0) {
                setHasMore(false)
                return
            }

            const mappedPosts: Post[] = (data as any[]).map((p: any) => ({
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
            }));

            setPosts((prev) => [...prev, ...mappedPosts])
            if (mappedPosts.length < 10) setHasMore(false)
        } catch (error) {
            console.error("Failed to load more posts:", error)
            setHasMore(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemove = (id: string) => {
        setPosts((prev) => prev.filter((p) => p.id !== id));
    };

    const handleUpdate = (id: string, updatedData: Partial<Post>) => {
        setPosts((prev) =>
            prev.map((p) => p.id === id ? { ...p, ...updatedData } : p)
        );
    };

    const handlePostCreated = (newPost: Post) => {
        setPosts((prev) => [newPost, ...prev]);
    };

    console.log(`FeedList rendering ${posts.length} posts`);
    return (
        <div className="flex flex-col gap-3 pb-8 w-full">
            {posts.length === 0 && !isLoading && (
                <div className="text-center py-12 bg-muted/20 rounded-lg border-2 border-dashed">
                    <p className="text-muted-foreground">No posts found.</p>
                </div>
            )}
            {posts.map((post) => (
                <PostCard
                    key={post.id}
                    post={post}
                    onRemove={handleRemove}
                    onUpdate={handleUpdate}
                    onPostCreated={handlePostCreated}
                />
            ))}

            {/* Loading Indicator / Cursor */}
            <div ref={ref} className="flex justify-center py-4">
                {isLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                {!hasMore && <p className="text-sm text-muted-foreground">You&apos;ve reached the end.</p>}
            </div>
        </div>
    )
}
