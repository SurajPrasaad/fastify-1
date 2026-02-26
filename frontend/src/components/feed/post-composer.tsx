"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { postService } from "@/services/post.service"
import { useAuth } from "@/features/auth/components/AuthProvider"

import { Image, Vote, Smile, MapPin, X, Plus } from "lucide-react"
import { PollCreator } from "./poll-creator"
import { EmojiPicker } from "./emoji-picker"
import { LocationPicker } from "./location-picker"
import { UserService } from "@/services/user.service"
import { UserResponse } from "@/types/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUpload } from "@/hooks/use-upload"

interface PostComposerProps {
    onSuccess?: (post: any) => void;
}

export function PostComposer({ onSuccess }: PostComposerProps) {
    const [content, setContent] = React.useState("")
    const [isPosting, setIsPosting] = React.useState(false)

    const [selectedMedia, setSelectedMedia] = React.useState<{ file: File, previewUrl: string, type: 'image' | 'video' }[]>([])
    const [poll, setPoll] = React.useState<{ question: string; options: string[]; expiresAt: Date } | null>(null)
    const [location, setLocation] = React.useState<string | null>(null)

    // Mention state
    const [mentionSearch, setMentionSearch] = React.useState<string | null>(null)
    const [suggestions, setSuggestions] = React.useState<UserResponse[]>([])
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [cursorPosition, setCursorPosition] = React.useState(0)

    // UI state for pickers
    const [activePicker, setActivePicker] = React.useState<"gif" | "poll" | "emoji" | "location" | null>(null)

    const { user } = useAuth()
    const { upload, isUploading: isUploadingMedia } = useUpload()
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const router = useRouter()

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

    const handlePost = async () => {
        if (!content.trim() && selectedMedia.length === 0 && !poll) return

        setIsPosting(true)
        try {
            const uploadedUrls: string[] = []
            if (selectedMedia.length > 0) {
                for (const media of selectedMedia) {
                    const url = await upload(media.file, "post_media")
                    if (url) {
                        uploadedUrls.push(url)
                    }
                }
            }

            const response = await postService.createPost({
                content: content.trim(),
                mediaUrls: uploadedUrls,
                poll: poll,
                location: location,
                status: "PUBLISHED"
            })

            toast.success("Post shared!")

            if (onSuccess) {
                // The backend likely returns the full post object or we need to fetch it
                // For now, assume it's returned or the callback handles conversion
                onSuccess(response);
            }

            setContent("")

            setSelectedMedia([])
            setPoll(null)
            setLocation(null)
            setActivePicker(null)

            if (!onSuccess) {
                router.refresh()
            }
        } catch (error: any) {
            toast.error(error?.message || "Failed to post")
        } finally {
            setIsPosting(false)
        }
    }

    const removeAttachment = (url: string) => {
        setSelectedMedia(selectedMedia.filter(i => i.previewUrl !== url))
    }

    const canPost = (content.trim().length > 0 || selectedMedia.length > 0 || poll) && !isPosting && !isUploadingMedia

    return (
        <div className="flex flex-col px-4 py-3 border-b border-slate-800 transition-colors">
            {/* Top Row: Avatar & Text Area */}
            <div className="flex gap-3 sm:gap-4 w-full relative">
                <div className="size-10 sm:size-12 rounded-full bg-slate-500 overflow-hidden shrink-0 mt-0.5 relative z-10">
                    <img
                        className="w-full h-full object-cover"
                        alt="User"
                        src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCiOL2n_wnGX-tkNBmn9gmSIO2py_5xhODyOdE2R10P7HxgjYmnH9d38rfNSl-_PT0a7K-oozQygeBMztHAO5W5u5qEeMlbqCr6_Hqn9JcyIEX8X7yIb6P_Dh213M8X7LPzhvFFNlxpMD2aRyuRUaW5o5lxnHkj-2oGoMSGk37wybjSgFXw0anwxAHcpicg8P9U-6cfeulPNyxhBCyzbfca7rtxBGgJ0jZPwfhUoevY9RSvmr64jIn2fXTcvF0SAn7PXAo7VgIt58c"}
                    />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <textarea
                        ref={textareaRef}
                        className="w-full bg-transparent border-none focus:ring-0 text-xl placeholder:text-slate-500 resize-none outline-none font-display min-h-[44px] pt-1 sm:pt-2"
                        placeholder="What's happening?"
                        rows={2}
                        value={content}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                    />

                    {/* Mention Suggestions Overlay */}
                    {suggestions.length > 0 && (
                        <div className="absolute left-10 sm:left-14 top-full z-50 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
                                            <AvatarFallback className="text-[10px]">{u.username[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-sm truncate">{u.name}</span>
                                            <span className="text-slate-500 text-xs truncate">@{u.username}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Row / Full width extensions: Poll, Media, Tools */}
            <div className="flex flex-col gap-2 w-full pl-0 sm:pl-[52px] md:pl-[64px] mt-2">
                {/* Attachments Preview */}
                {selectedMedia.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 mt-1">
                        {selectedMedia.map((media, i) => (
                            <div key={i} className="relative aspect-square w-24 rounded-xl overflow-hidden group bg-slate-800">
                                {media.type === 'video' ? (
                                    <video src={media.previewUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <img src={media.previewUrl} className="w-full h-full object-cover" />
                                )}
                                <button
                                    onClick={() => removeAttachment(media.previewUrl)}
                                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <X size={14} />
                                </button>
                                {media.type === 'video' && (
                                    <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 text-[10px] text-white font-bold pointer-events-none">
                                        VIDEO
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Poll Preview */}
                {poll && (
                    <div className="mb-2 w-full mt-1">
                        <PollCreator onUpdate={(p) => setPoll(p)} />
                    </div>
                )}

                {/* Location Badge */}
                {location && (
                    <div className="flex items-center gap-1 w-fit bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-2 mt-1">
                        <MapPin size={12} />
                        {location}
                        <button onClick={() => setLocation(null)} className="hover:text-white transition-colors ml-1">
                            <X size={12} />
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800/50 pt-3 mt-1">
                    <div className="flex items-center gap-1 text-primary relative">
                        <input
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            id="image-upload"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                const newMediaItems: any[] = []
                                for (const file of files) {
                                    if (file.size > 20 * 1024 * 1024) {
                                        toast.error(`File size exceeds 20MB limit for ${file.name}`)
                                        continue;
                                    }
                                    newMediaItems.push({
                                        file,
                                        previewUrl: URL.createObjectURL(file),
                                        type: file.type.startsWith('video/') ? 'video' : 'image'
                                    })
                                }
                                setSelectedMedia(prev => [...prev, ...newMediaItems])
                                // Reset the value so the same file could be selected again if deleted
                                if (e.target) e.target.value = ''
                            }}
                        />
                        <IconButton
                            icon={<Image size={20} />}
                            onClick={() => document.getElementById('image-upload')?.click()}
                        />

                        <IconButton
                            icon={<Vote size={20} />}
                            active={activePicker === "poll"}
                            onClick={() => setActivePicker(activePicker === "poll" ? null : "poll")}
                            disabled={!!poll}
                        />
                        <IconButton
                            icon={<Smile size={20} />}
                            active={activePicker === "emoji"}
                            onClick={() => setActivePicker(activePicker === "emoji" ? null : "emoji")}
                        />
                        <IconButton
                            icon={<MapPin size={20} />}
                            active={activePicker === "location"}
                            onClick={() => setActivePicker(activePicker === "location" ? null : "location")}
                        />

                        {/* Pickers */}
                        {activePicker === "emoji" && (
                            <EmojiPicker
                                onSelect={(emoji) => {
                                    setContent(prev => prev + emoji)
                                    // Don't close so they can add more
                                }}
                                onClose={() => setActivePicker(null)}
                            />
                        )}
                        {activePicker === "location" && (
                            <LocationPicker
                                onSelect={(loc) => setLocation(loc)}
                                onClose={() => setActivePicker(null)}
                            />
                        )}
                        {activePicker === "poll" && !poll && (
                            <button
                                className="hidden"
                                onClick={() => {
                                    setPoll({ question: "", options: ["", ""], expiresAt: new Date() })
                                    setActivePicker(null)
                                }}
                            />
                        )}
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={!canPost}
                        className={cn(
                            "bg-primary text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2",
                            canPost ? "hover:opacity-90 active:scale-95 shadow-md shadow-primary/20" : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {(isPosting || isUploadingMedia) ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>{isUploadingMedia ? "Uploading..." : "..."}</span>
                            </>
                        ) : "Post"}
                    </button>
                </div>

                {/* Special case for poll initialization */}
                {activePicker === "poll" && !poll && (
                    <div className="hidden" ref={(el) => {
                        if (el) {
                            setPoll({ question: "", options: ["", ""], expiresAt: new Date() })
                            setActivePicker(null)
                        }
                    }} />
                )}
            </div>
        </div>
    )
}

function IconButton({ icon, onClick, active, disabled }: { icon: React.ReactNode; onClick: () => void; active?: boolean; disabled?: boolean }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "p-2 hover:bg-primary/10 rounded-full transition-all group active:scale-90 disabled:opacity-30 disabled:pointer-events-none",
                active && "bg-primary/20"
            )}
        >
            <div className={cn("text-primary group-hover:scale-110 transition-transform", active && "scale-110")}>
                {icon}
            </div>
        </button>
    )
}

