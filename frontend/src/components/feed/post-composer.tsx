"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Image as ImageIcon,
    Film,
    Smile,
    BarChart2,
    MapPin,
    Globe,
    Users,
    Lock,
    Calendar,
    X,
    Plus,
    Loader2,
    Hash,
    AtSign,
    AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card"
import { postService } from "@/services/post.service"
import { useMediaUpload } from "@/modules/media/use-media-upload"

const MAX_CHARS = 3000

export function PostComposer() {
    const [content, setContent] = React.useState("")
    const [isFocused, setIsFocused] = React.useState(false)
    const [isPosting, setIsPosting] = React.useState(false)
    const [audience, setAudience] = React.useState<"public" | "followers" | "private">("public")

    const { files: media, addFiles, removeFile, clearFiles, uploadAll } = useMediaUpload()

    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Auto-expand textarea
    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
        }
    }, [content])

    // Load draft on mount
    React.useEffect(() => {
        const draft = localStorage.getItem("post-draft")
        if (draft) setContent(draft)
    }, [])

    // Save draft
    React.useEffect(() => {
        if (content) {
            localStorage.setItem("post-draft", content)
        } else {
            localStorage.removeItem("post-draft")
        }
    }, [content])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (media.length + files.length > 4) {
            toast.error("You can only upload up to 4 media items")
            return
        }
        addFiles(files)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const handlePost = async () => {
        if (!content.trim() && media.length === 0) return
        if (content.length > MAX_CHARS) return

        setIsPosting(true)
        const toastId = toast.loading("Processing media...")

        try {
            // Step 1: Securely upload all media to Cloudinary in parallel
            const uploadedMedia = await uploadAll()

            // Step 2: Prepare payload
            const payload = {
                content: content.trim(),
                mediaUrls: uploadedMedia.map(m => m.remoteUrl),
                media: uploadedMedia.map(m => ({
                    publicId: m.remoteMetadata?.public_id,
                    secureUrl: m.remoteMetadata?.secure_url,
                    resourceType: m.remoteMetadata?.resource_type,
                    format: m.remoteMetadata?.format,
                    width: m.remoteMetadata?.width,
                    height: m.remoteMetadata?.height,
                    duration: m.remoteMetadata?.duration,
                    bytes: m.remoteMetadata?.bytes
                }))
            }

            toast.loading("Sharing your post...", { id: toastId })

            // Step 3: Create post on backend
            await postService.createPost(payload)

            toast.success("Post shared successfully!", { id: toastId })
            setContent("")
            clearFiles()
            localStorage.removeItem("post-draft")
            router.refresh()

            window.scrollTo({ top: 0, behavior: "smooth" })
        } catch (error: any) {
            toast.error(error?.message || "Failed to post", { id: toastId })
        } finally {
            setIsPosting(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handlePost()
        }
    }

    const charCount = content.length
    const isOverLimit = charCount > MAX_CHARS
    const canPost = (content.trim().length > 0 || media.length > 0) && !isOverLimit && !isPosting

    return (
        <>
            {/* Desktop/Tablet View */}
            <Card className={cn(
                "hidden sm:block border-x-0 border-t-0 sm:rounded-xl sm:border shadow-none transition-all duration-300",
                isFocused && "sm:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-primary/20"
            )}>
                <div className="p-4 flex gap-4">
                    <Avatar className="h-12 w-12 shrink-0 ring-2 ring-background">
                        <AvatarImage src="/avatars/user.jpg" />
                        <AvatarFallback>S</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 flex flex-col gap-2">
                        <div className="relative">
                            <Textarea
                                ref={textareaRef}
                                placeholder="What's happening?"
                                aria-label="Post content"
                                className="min-h-[48px] border-none bg-transparent p-0 text-xl resize-none focus-visible:ring-0 placeholder:text-muted-foreground/50 font-medium"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>

                        <AnimatePresence>
                            {media.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className={cn(
                                        "grid gap-2 mt-2 rounded-2xl overflow-hidden border bg-muted/30",
                                        media.length === 1 ? "grid-cols-1" :
                                            media.length === 2 ? "grid-cols-2" :
                                                "grid-cols-2"
                                    )}
                                >
                                    {media.map((item, index) => (
                                        <motion.div
                                            layout
                                            key={item.id}
                                            className={cn(
                                                "relative group aspect-video overflow-hidden",
                                                media.length === 3 && index === 0 && "row-span-2 aspect-auto"
                                            )}
                                        >
                                            {item.type === "image" ? (
                                                <Image
                                                    src={item.preview}
                                                    alt="Uploaded media"
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <video src={item.preview} className="h-full w-full object-cover" />
                                            )}

                                            {/* Progress Overlay */}
                                            {item.status === "uploading" && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-12 h-12 relative flex items-center justify-center">
                                                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                                                        <span className="absolute text-[10px] font-bold text-white">
                                                            {Math.round(item.progress)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-full shadow-lg"
                                                    onClick={() => removeFile(item.id)}
                                                    aria-label="Remove media"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center -ml-2 space-x-1">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <TooltipProvider delayDuration={400}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full" onClick={() => fileInputRef.current?.click()}>
                                                <ImageIcon className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Media</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full">
                                                <Smile className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Emoji</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full">
                                                <BarChart2 className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Poll</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full">
                                                <MapPin className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Location</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10 rounded-full">
                                                <Calendar className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Schedule</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center">
                                    <AnimatePresence>
                                        {content.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                className="flex items-center"
                                            >
                                                <div className="relative h-6 w-6 mr-2">
                                                    <svg className="h-6 w-6 transform -rotate-90">
                                                        <circle
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            fill="transparent"
                                                            className="text-muted/20"
                                                        />
                                                        <motion.circle
                                                            cx="12"
                                                            cy="12"
                                                            r="10"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                            fill="transparent"
                                                            strokeDasharray={63}
                                                            strokeDashoffset={63 - (Math.min(charCount, MAX_CHARS) / MAX_CHARS) * 63}
                                                            className={cn(
                                                                charCount > MAX_CHARS ? "text-destructive" :
                                                                    charCount > MAX_CHARS - 20 ? "text-yellow-500" : "text-primary"
                                                            )}
                                                            transition={{ duration: 0.3 }}
                                                        />
                                                    </svg>
                                                </div>
                                                <Separator orientation="vertical" className="h-6 mx-2" />
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-full border-primary/30 text-primary hover:bg-primary/5"
                                                    title="Add to thread"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="hidden lg:flex gap-2 rounded-full h-9 text-muted-foreground hover:text-primary transition-colors">
                                            {audience === "public" && <Globe className="h-3.5 w-3.5" />}
                                            {audience === "followers" && <Users className="h-3.5 w-3.5" />}
                                            {audience === "private" && <Lock className="h-3.5 w-3.5" />}
                                            <span className="capitalize text-xs font-semibold">{audience}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => setAudience("public")} className="gap-2">
                                            <Globe className="h-4 w-4" /> <span>Public</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setAudience("followers")} className="gap-2">
                                            <Users className="h-4 w-4" /> <span>Followers Only</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setAudience("private")} className="gap-2">
                                            <Lock className="h-4 w-4" /> <span>Only Me</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button
                                    onClick={handlePost}
                                    disabled={!canPost}
                                    className={cn(
                                        "rounded-full px-8 font-bold transition-all duration-300",
                                        canPost ? "bg-primary hover:bg-primary/90 shadow-[0_4px_14px_0_rgba(var(--primary),0.39)]" : "bg-primary/50"
                                    )}
                                >
                                    {isPosting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {isPosting ? "Posting" : "Post"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Mobile Sticky Action */}
            <div className="sm:hidden fixed bottom-20 right-4 z-50">
                <Button
                    size="icon"
                    className="h-14 w-14 rounded-full shadow-2xl bg-primary hover:bg-primary/90 transition-transform active:scale-95"
                    onClick={() => toast("Full-screen composer opening...")}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>

            <AnimatePresence>
                {isPosting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/20 backdrop-blur-[2px] z-[100] flex items-center justify-center pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card p-4 rounded-2xl shadow-2xl border flex items-center gap-3"
                        >
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="font-semibold text-sm">Sending your post...</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
