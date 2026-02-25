
"use client"

import * as React from "react"
import { X, Image as ImageIcon, Smile, MessageSquareQuote } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/features/auth/hooks"
import { useRepost } from "@/features/interaction/hooks"
import { Post } from "./post-card"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface QuotePostModalProps {
    isOpen: boolean
    onClose: () => void
    originalPost: Post
    onSuccess?: (newPost: any) => void
}

export function QuotePostModal({ isOpen, onClose, originalPost, onSuccess }: QuotePostModalProps) {
    const [content, setContent] = React.useState("")
    const { data: currentUser } = useCurrentUser()
    const { repost, isSubmitting } = useRepost()

    const charLimit = 280
    const charCount = content.length
    const progress = (charCount / charLimit) * 100

    const mapToPost = (apiPost: any): Post => {
        return {
            ...apiPost,
            author: {
                ...apiPost.author,
                isVerified: false
            },
            status: "PUBLISHED",
            createdAt: apiPost.createdAt,
            updatedAt: apiPost.createdAt,
            mediaUrls: apiPost.mediaUrls || [],
            likesCount: apiPost.likesCount || 0,
            commentsCount: apiPost.commentsCount || 0,
            repostsCount: apiPost.repostsCount || 0,
        };
    };

    const handleRepost = async () => {
        if (isSubmitting) return
        try {
            await repost(originalPost.id, content, (result) => {
                onClose()
                setContent("")
                if (onSuccess) onSuccess(mapToPost(result))
            })
        } catch (error) {
            // Error handled by hook
        }
    }

    const timeAgo = (() => {
        try {
            const date = new Date(originalPost.createdAt)
            return !isNaN(date.getTime())
                ? formatDistanceToNow(date, { addSuffix: false })
                : ""
        } catch {
            return ""
        }
    })()

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                            <MessageSquareQuote size={20} />
                        </div>
                        <DialogTitle className="text-xl font-bold tracking-tight">Quote Post Editor</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Thought Input */}
                    <div className="space-y-3">
                        <div className="flex gap-4">
                            <Avatar className="size-12 border border-slate-200 dark:border-slate-800">
                                <AvatarImage src={currentUser?.avatarUrl || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {currentUser?.name?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Textarea
                                    placeholder="Add your thoughts..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full bg-transparent border-none focus-visible:ring-0 text-lg placeholder:text-slate-500 dark:placeholder:text-slate-500 resize-none min-h-[120px] p-0"
                                />
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between pl-16">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10">
                                    <Smile size={20} />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-primary hover:bg-primary/10">
                                    <ImageIcon size={20} />
                                </Button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "text-xs font-medium",
                                    charCount > charLimit ? "text-red-500" : "text-slate-500"
                                )}>
                                    {charCount} / {charLimit}
                                </span>
                                <div className="w-12 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-300",
                                            charCount > charLimit ? "bg-red-500" : "bg-primary"
                                        )}
                                        style={{ width: `${Math.min(progress, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Original Post Preview */}
                    <div className="ml-16 bg-slate-50 dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                                <AvatarImage src={originalPost.author.avatarUrl || ""} />
                                <AvatarFallback className="text-[10px]">
                                    {originalPost.author.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-sm">{originalPost.author.name}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-sm">
                                @{originalPost.author.username} • {timeAgo}
                            </span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            {originalPost.content}
                        </p>
                        {originalPost.mediaUrls?.[0] && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                                <img
                                    src={originalPost.mediaUrls[0]}
                                    alt="Post media"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-full px-6 font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRepost}
                        disabled={isSubmitting || (charCount > charLimit)}
                        className="rounded-full px-8 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? "Posting..." : "Repost"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
