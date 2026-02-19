import { FeedList } from "@/components/feed/feed-list"
import { Post } from "@/components/feed/post-card"
import { PostComposer } from "@/components/feed/post-composer"
import { postService } from "@/services/post.service"

export const dynamic = "force-dynamic";

async function getInitialPosts(): Promise<Post[]> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
    try {
        console.log(`FeedPage: Fetching from ${API_URL}/posts`);
        const res = await fetch(`${API_URL}/posts`, { cache: 'no-store' });

        if (!res.ok) {
            console.error(`FeedPage: Fetch failed with status ${res.status}: ${res.statusText}`);
            return [];
        }

        const data = await res.json();
        console.log(`FeedPage: Received ${data?.length} posts`);

        if (!Array.isArray(data)) {
            console.error("FeedPage: Received non-array data:", data);
            return [];
        }

        // Map backend DTO to frontend Post interface
        return data.map((p: any) => ({
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
    } catch (error) {
        console.error("Failed to fetch posts:", error);
        return [];
    }
}

export default async function FeedPage() {
    const posts = await getInitialPosts();

    return (
        <div className="flex flex-col gap-4">
            {/* Feed Header (Mobile) or just spacers */}
            <h1 className="text-2xl font-bold px-4 py-4 md:hidden">Home</h1>

            {/* Create Post Composer */}
            <div className="hidden sm:block">
                <PostComposer />
            </div>

            {/* The Infinite Feed */}
            <FeedList initialPosts={posts} />
        </div>
    )
}
