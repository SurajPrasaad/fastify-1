"use client"

import * as React from "react"
import { toast } from "sonner"
import { useUpdatePost } from "@/features/posts/hooks"
import { postService } from "@/services/post.service"
import { useCurrentUser } from "@/features/auth/hooks"
import { Image as ImageIcon, X, MapPin, Hash, Loader2, Smile, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserService } from "@/services/user.service"
import { UserResponse } from "@/types/auth"

interface UpdatePostModalProps {
    postId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdateSuccess?: (updatedPost: any) => void;
}

export function UpdatePostModal({ postId, isOpen, onClose, onUpdateSuccess }: UpdatePostModalProps) {
    const [content, setContent] = React.useState("")
    const [mediaUrls, setMediaUrls] = React.useState<string[]>([])
    const [location, setLocation] = React.useState<string | null>(null)
    const [hashtags, setHashtags] = React.useState<string[]>([])
    const [newTag, setNewTag] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(true)

    // Mention state
    const [mentionSearch, setMentionSearch] = React.useState<string | null>(null)
    const [suggestions, setSuggestions] = React.useState<UserResponse[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [cursorPosition, setCursorPosition] = React.useState(0)

    const { updatePost, isUpdating } = useUpdatePost()
    const { data: currentUser } = useCurrentUser()
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    // Auto-expand textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [content])

    // Mention search effect
    React.useEffect(() => {
        if (!mentionSearch || mentionSearch.length < 1) {
            setSuggestions([])
            return
        }

        const timer = setTimeout(async () => {
            try {
                const results = await UserService.searchUsers(mentionSearch)
                setSuggestions(results)
                setSelectedIndex(0)
            } catch (error) {
                console.error("Failed to fetch mention suggestions:", error)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [mentionSearch])

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        const pos = e.target.selectionStart
        setContent(value)
        setCursorPosition(pos)

        // Detect mention
        const textBeforeCursor = value.slice(0, pos)
        const lastWordMatch = textBeforeCursor.match(/@(\w*)$/)

        if (lastWordMatch) {
            setMentionSearch(lastWordMatch[1])
        } else {
            setMentionSearch(null)
        }
    }

    const insertMention = (username: string) => {
        const textBeforeMention = content.slice(0, cursorPosition).replace(/@(\w*)$/, `@${username} `)
        const textAfterMention = content.slice(cursorPosition)
        setContent(textBeforeMention + textAfterMention)
        setMentionSearch(null)
        setSuggestions([])
        textareaRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (suggestions.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % suggestions.length)
            } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
            } else if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault()
                insertMention(suggestions[selectedIndex].username)
            } else if (e.key === "Escape") {
                setMentionSearch(null)
                setSuggestions([])
            }
        }
    }

    React.useEffect(() => {
        if (isOpen && postId) {
            fetchPostData()
        }
    }, [isOpen, postId])

    const fetchPostData = async () => {
        setIsLoading(true)
        try {
            const post = await postService.getPost(postId) as any
            setContent(post.content || "")
            setMediaUrls(post.mediaUrls || [])
            setLocation(post.location || null)
            setHashtags(post.hashtags || [])
        } catch (error) {
            console.error("Failed to fetch post data:", error)
            toast.error("Failed to load post details")
            onClose()
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdate = async () => {
        if (!content.trim()) return

        try {
            const updatedData = {
                content: content.trim(),
                mediaUrls,
                location,
                hashtags,
            }

            await updatePost(postId, updatedData, (updated) => {
                toast.success("Post updated!")
                if (onUpdateSuccess) onUpdateSuccess(updated)
                onClose()
            })
        } catch (error) {
            // Error handled by hook
        }
    }

    const removeMedia = (url: string) => {
        setMediaUrls(prev => prev.filter(u => u !== url))
    }

    const addTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault()
            const tag = newTag.trim().replace(/^#/, '')
            if (!hashtags.includes(tag)) {
                setHashtags([...hashtags, tag])
            }
            setNewTag("")
        }
    }

    const removeTag = (tag: string) => {
        setHashtags(prev => prev.filter(t => t !== tag))
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none bg-white dark:bg-black rounded-3xl shadow-2xl">
                <DialogHeader className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X size={20} />
                        </Button>
                        <DialogTitle className="text-xl font-bold">Edit Post</DialogTitle>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary size-8" />
                    </div>
                ) : (
                    <div className="p-4 flex gap-4 overflow-y-auto max-h-[80vh]">
                        {/* Avatar */}
                        <Avatar className="size-12 shrink-0">
                            <AvatarImage src={currentUser?.avatarUrl || ""} />
                            <AvatarFallback>{currentUser?.name?.[0] || '?'}</AvatarFallback>
                        </Avatar>

                        {/* Composer Area */}
                        <div className="flex-1 flex flex-col gap-3 min-w-0">
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={handleTextChange}
                                onKeyDown={handleKeyDown}
                                placeholder="What's happening?"
                                className="w-full bg-transparent border-none focus:ring-0 text-xl placeholder:text-slate-500 resize-none outline-none font-display min-h-[120px]"
                            />

                            {/* Mention Suggestions Overlay */}
                            {suggestions.length > 0 && (
                                <div className="absolute z-50 mt-16 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="py-2">
                                        {suggestions.map((u, i) => (
                                            <button
                                                key={u.id}
                                                onClick={() => insertMention(u.username)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                                                    i === selectedIndex ? "bg-primary/20" : "hover:bg-slate-800"
                                                )}
                                            >
                                                <Avatar className="size-8">
                                                    <AvatarImage src={u.avatarUrl || undefined} />
                                                    <AvatarFallback className="text-white bg-slate-700 text-[10px]">{u.username[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-sm truncate text-white">{u.name}</span>
                                                    <span className="text-slate-500 text-xs truncate">@{u.username}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Media Grid */}
                            {mediaUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                    {mediaUrls.map((url, index) => (
                                        <div key={index} className="relative aspect-video group">
                                            <img src={url} className="w-full h-full object-cover" alt="" />
                                            <button
                                                onClick={() => removeMedia(url)}
                                                className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 items-center">
                                {hashtags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="gap-1 py-1 px-3 rounded-full bg-primary/10 text-primary border-none hover:bg-primary/20"
                                    >
                                        #{tag}
                                        <X size={12} className="cursor-pointer" onClick={() => removeTag(tag)} />
                                    </Badge>
                                ))}
                                <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1">
                                    <Hash size={14} className="text-slate-500" />
                                    <input
                                        type="text"
                                        placeholder="Add tag"
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={addTag}
                                        className="bg-transparent border-none outline-none text-sm w-20 focus:w-32 transition-all p-0 ml-1"
                                    />
                                </div>
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center -ml-2 text-primary">
                                    <IconButton icon={<ImageIcon size={20} />} onClick={() => { }} />
                                    <IconButton icon={<Smile size={20} />} onClick={() => { }} />
                                    <IconButton icon={<ListTodo size={20} />} onClick={() => { }} />
                                    <IconButton icon={<MapPin size={20} />} onClick={() => { }} />
                                </div>

                                <Button
                                    onClick={handleUpdate}
                                    disabled={isUpdating || !content.trim()}
                                    className="rounded-full px-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
                                >
                                    {isUpdating ? <Loader2 className="animate-spin size-4" /> : "Save"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function IconButton({ icon, onClick, active }: { icon: React.ReactNode; onClick: () => void; active?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 hover:bg-primary/10 rounded-full transition-all group active:scale-90",
                active && "bg-primary/20"
            )}
        >
            <div className={cn("text-primary group-hover:scale-110 transition-transform", active && "scale-110")}>
                {icon}
            </div>
        </button>
    )
}
