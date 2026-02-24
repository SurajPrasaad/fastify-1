"use client"

import * as React from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { postService } from "@/services/post.service"
import { useAuth } from "@/features/auth/components/AuthProvider"

import { Image, GripVertical, Vote, Smile, MapPin, X, Plus } from "lucide-react"
import { GifSelector } from "./gif-selector"
import { PollCreator } from "./poll-creator"
import { EmojiPicker } from "./emoji-picker"
import { LocationPicker } from "./location-picker"

interface PostComposerProps {
    onSuccess?: (post: any) => void;
}

export function PostComposer({ onSuccess }: PostComposerProps) {
    const [content, setContent] = React.useState("")
    const [isPosting, setIsPosting] = React.useState(false)
    const [selectedGifs, setSelectedGifs] = React.useState<string[]>([])
    const [selectedImages, setSelectedImages] = React.useState<string[]>([])
    const [poll, setPoll] = React.useState<{ question: string; options: string[]; expiresAt: Date } | null>(null)
    const [location, setLocation] = React.useState<string | null>(null)

    // UI state for pickers
    const [activePicker, setActivePicker] = React.useState<"gif" | "poll" | "emoji" | "location" | null>(null)

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
        if (!content.trim() && selectedGifs.length === 0 && selectedImages.length === 0 && !poll) return

        setIsPosting(true)
        try {
            const response = await postService.createPost({
                content: content.trim(),
                mediaUrls: [...selectedImages, ...selectedGifs],
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
            setSelectedGifs([])
            setSelectedImages([])
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

    const removeAttachment = (url: string, type: "gif" | "image") => {
        if (type === "gif") {
            setSelectedGifs(selectedGifs.filter(g => g !== url))
        } else {
            setSelectedImages(selectedImages.filter(i => i !== url))
        }
    }

    const canPost = (content.trim().length > 0 || selectedGifs.length > 0 || selectedImages.length > 0 || poll) && !isPosting

    return (
        <div className="flex gap-4 px-4 py-3 border-b border-slate-800">
            <div className="size-12 rounded-full bg-slate-500 overflow-hidden shrink-0">
                <img
                    className="w-full h-full object-cover"
                    alt="User"
                    src={user?.avatarUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCiOL2n_wnGX-tkNBmn9gmSIO2py_5xhODyOdE2R10P7HxgjYmnH9d38rfNSl-_PT0a7K-oozQygeBMztHAO5W5u5qEeMlbqCr6_Hqn9JcyIEX8X7yIb6P_Dh213M8X7LPzhvFFNlxpMD2aRyuRUaW5o5lxnHkj-2oGoMSGk37wybjSgFXw0anwxAHcpicg8P9U-6cfeulPNyxhBCyzbfca7rtxBGgJ0jZPwfhUoevY9RSvmr64jIn2fXTcvF0SAn7PXAo7VgIt58c"}
                />
            </div>
            <div className="flex-1 flex flex-col gap-2">
                <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent border-none focus:ring-0 text-xl placeholder:text-slate-500 resize-none outline-none font-display min-h-[44px]"
                    placeholder="What's happening?"
                    rows={2}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                {/* Attachments Preview */}
                {(selectedImages.length > 0 || selectedGifs.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {[...selectedImages, ...selectedGifs].map((url, i) => (
                            <div key={i} className="relative aspect-square w-24 rounded-xl overflow-hidden group">
                                <img src={url} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeAttachment(url, selectedGifs.includes(url) ? "gif" : "image")}
                                    className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Poll Preview */}
                {poll && (
                    <div className="mb-2">
                        <PollCreator onUpdate={(p) => setPoll(p)} />
                    </div>
                )}

                {/* Location Badge */}
                {location && (
                    <div className="flex items-center gap-1 w-fit bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full mb-2">
                        <MapPin size={12} />
                        {location}
                        <button onClick={() => setLocation(null)} className="hover:text-white transition-colors">
                            <X size={12} />
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800/50 pt-2">
                    <div className="flex items-center gap-1 text-primary relative">
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id="image-upload"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || [])
                                const urls = files.map(file => URL.createObjectURL(file))
                                setSelectedImages([...selectedImages, ...urls])
                            }}
                        />
                        <IconButton
                            icon={<Image size={20} />}
                            onClick={() => document.getElementById('image-upload')?.click()}
                        />
                        <IconButton
                            icon={<GripVertical size={20} />}
                            active={activePicker === "gif"}
                            onClick={() => setActivePicker(activePicker === "gif" ? null : "gif")}
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
                        {activePicker === "gif" && (
                            <GifSelector
                                onSelect={(url) => {
                                    setSelectedGifs([...selectedGifs, url])
                                    setActivePicker(null)
                                }}
                                onClose={() => setActivePicker(null)}
                            />
                        )}
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
                            "bg-primary text-white px-6 py-2 rounded-full font-bold transition-all",
                            canPost ? "hover:opacity-90 active:scale-95 shadow-md shadow-primary/20" : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isPosting ? "..." : "Post"}
                    </button>
                </div>

                {/* Special case for poll initialization (since it's not a modal but inline) */}
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

