"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { postService } from "@/services/post.service"
import { useAuth } from "@/features/auth/components/AuthProvider"

export function PostComposer() {
    const [content, setContent] = React.useState("")
    const [isPosting, setIsPosting] = React.useState(false)
    const { user } = useAuth()
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const router = useRouter()

    // Auto-expand textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [content])

    const handlePost = async () => {
        if (!content.trim()) return

        setIsPosting(true)
        try {
            await postService.createPost({
                content: content.trim(),
                mediaUrls: []
            })
            toast.success("Post shared!")
            setContent("")
            router.refresh()
        } catch (error: any) {
            toast.error(error?.message || "Failed to post")
        } finally {
            setIsPosting(false)
        }
    }

    const canPost = content.trim().length > 0 && !isPosting

    return (
        <div className="flex gap-4">
            <div className="size-12 rounded-full bg-slate-500 overflow-hidden shrink-0">
                <img
                    className="w-full h-full object-cover"
                    alt="User"
                    src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCiOL2n_wnGX-tkNBmn9gmSIO2py_5xhODyOdE2R10P7HxgjYmnH9d38rfNSl-_PT0a7K-oozQygeBMztHAO5W5u5qEeMlbqCr6_Hqn9JcyIEX8X7yIb6P_Dh213M8X7LPzhvFFNlxpMD2aRyuRUaW5o5lxnHkj-2oGoMSGk37wybjSgFXw0anwxAHcpicg8P9U-6cfeulPNyxhBCyzbfca7rtxBGgJ0jZPwfhUoevY9RSvmr64jIn2fXTcvF0SAn7PXAo7VgIt58c"}
                />
            </div>
            <div className="flex-1 flex flex-col gap-4">
                <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent border-none focus:ring-0 text-xl placeholder:text-slate-500 resize-none outline-none font-display min-h-[44px]"
                    placeholder="What's happening?"
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-primary -ml-2">
                        <IconButton icon="image" />
                        <IconButton icon="gif_box" />
                        <IconButton icon="ballot" />
                        <IconButton icon="sentiment_satisfied" />
                        <IconButton icon="location_on" />
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={!canPost}
                        className={cn(
                            "bg-primary text-white px-6 py-2 rounded-full font-bold transition-all",
                            canPost ? "hover:opacity-90 active:scale-95 shadow-md shadow-primary/20" : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isPosting ? "..." : "Post"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function IconButton({ icon }: { icon: string }) {
    return (
        <button className="p-2 hover:bg-primary/10 rounded-full transition-all group active:scale-90">
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </button>
    )
}
