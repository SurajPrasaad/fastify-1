"use client";

import * as React from "react";
import { ArrowLeft, Loader2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { MainPost } from "@/components/thread/main-post";
import { ReplyComposer } from "@/components/thread/reply-composer";
import { ReplyItem, Reply } from "@/components/thread/reply-item";
import { Separator } from "@/components/ui/separator";

// Mock Data
const MOCK_POST = {
    id: "1",
    author: {
        username: "johndoe",
        displayName: "John Doe",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        isVerified: true,
    },
    content: "Just launched my new project! It's a scalable social media platform built with Fastify and Next.js. What do you think about the architecture? 🚀 #webdev #javascript #coding",
    media: [
        { type: "image" as const, url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80" }
    ],
    stats: {
        likes: 12400,
        comments: 856,
        reposts: 231,
    },
    createdAt: new Date(),
    isLiked: false,
};

const MOCK_REPLIES: Reply[] = [
    {
        id: "r1",
        author: {
            username: "tech_guru",
            displayName: "Tech Guru",
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guru",
        },
        content: "The architecture looks solid! Are you using Redis for the feeds? That really helps with scaling at 100M+ users.",
        stats: { likes: 124, comments: 2 },
        createdAt: new Date(Date.now() - 3600000),
        isLiked: true,
    },
    {
        id: "r2",
        author: {
            username: "dev_jane",
            displayName: "Jane Developer",
            avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
        },
        content: "Love the UI! The dark theme is so easy on the eyes. How did you handle the real-time updates?",
        stats: { likes: 45, comments: 0 },
        createdAt: new Date(Date.now() - 7200000),
        replyTo: "johndoe"
    },
];

const NESTED_REPLY: Reply = {
    id: "r3",
    author: {
        username: "frontend_fan",
        displayName: "UI Enthusiast",
        avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=UI",
    },
    content: "He mentioned using WebSockets in the post! 🚀",
    stats: { likes: 12, comments: 0 },
    createdAt: new Date(Date.now() - 1800000),
    replyTo: "dev_jane"
};

export default function ThreadPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmittingReply, setIsSubmittingReply] = React.useState(false);
    const [replies, setReplies] = React.useState<Reply[]>(MOCK_REPLIES);

    React.useEffect(() => {
        // Simulate initial loading
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleReply = (content: string) => {
        setIsSubmittingReply(true);
        // Simulate API call
        setTimeout(() => {
            const newReply: Reply = {
                id: Date.now().toString(),
                author: {
                    username: "keegan_sears",
                    displayName: "Keegan Sears",
                    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Keegan",
                },
                content,
                stats: { likes: 0, comments: 0 },
                createdAt: new Date(),
            };
            setReplies([newReply, ...replies]);
            setIsSubmittingReply(false);
        }, 800);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background max-w-[700px] mx-auto border-x border-border/50">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 flex items-center gap-6 px-4 py-2 bg-background/80 backdrop-blur-md border-b border-border/50">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9 w-9"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold">Post</h1>
            </header>

            <main className="flex-1">
                {isLoading ? (
                    <div className="flex flex-col gap-4 p-4">
                        <SkeletonHeader />
                        <div className="h-40 bg-muted rounded-2xl animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                ) : (
                    <>
                        <MainPost post={MOCK_POST} />

                        {/* Reply Composer */}
                        <ReplyComposer
                            replyTo={MOCK_POST.author.username}
                            onReply={handleReply}
                            isSubmitting={isSubmittingReply}
                        />

                        {/* Thread Section */}
                        <div className="flex flex-col">
                            {replies.map((reply, index) => (
                                <React.Fragment key={reply.id}>
                                    <ReplyItem
                                        reply={reply}
                                        isLast={index === replies.length - 1}
                                        hasConnector={index !== replies.length - 1}
                                    />
                                    {/* Demonstrate internal threading */}
                                    {reply.id === "r2" && (
                                        <>
                                            <div className="absolute left-[39px] h-full w-[2px] bg-border/60 z-0" style={{ height: '100px', transform: 'translateY(-20px)' }} />
                                            <ReplyItem
                                                reply={NESTED_REPLY}
                                                isNested
                                                isLast={index === replies.length - 1}
                                            />
                                        </>
                                    )}
                                    <Separator className="bg-border/30" />
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Infinite Scroll Indicator */}
                        <div className="py-8 flex justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function SkeletonHeader() {
    return (
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded-full animate-pulse" />
            <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
        </div>
    );
}
