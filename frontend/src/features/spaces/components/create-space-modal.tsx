"use client"

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { X, Mic2, Radio } from 'lucide-react'
import { cn } from "@/lib/utils"

interface CreateSpaceModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (title: string) => void
    isLoading?: boolean
}



export function CreateSpaceModal({ isOpen, onClose, onCreate, isLoading }: CreateSpaceModalProps) {
    const [title, setTitle] = useState("")

    const handleCreate = () => {
        if (title.trim()) {
            onCreate(title)
        }
    }

    // Reset title when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setTitle("")
        }
    }, [isOpen])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[450px] bg-[#000000] border-[#2f3336] text-[#e7e9ea] p-0 overflow-hidden rounded-3xl">
                <div className="absolute top-4 right-4 z-10">
                    <DialogClose asChild>
                    </DialogClose>
                </div>

                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-[#1d9bf0]/10 rounded-xl">
                            <Mic2 className="h-5 w-5 text-[#1d9bf0]" />
                        </div>
                        <DialogTitle className="text-xl font-bold">New Audio Space</DialogTitle>
                    </div>
                    <p className="text-[#71767b] text-sm">Host a conversation for anyone to join</p>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="title" className="text-sm font-semibold text-[#71767b]">Space Title</Label>
                            <span className={cn(
                                "text-xs",
                                title.length > 90 ? "text-red-500" : "text-[#71767b]"
                            )}>{title.length}/100</span>
                        </div>
                        <Input
                            id="title"
                            placeholder="What's happening?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                            className="bg-[#16181c] border-[#2f3336] focus:border-[#1d9bf0] focus:ring-[#1d9bf0]/20 text-lg py-6 rounded-2xl placeholder:text-[#71767b]"
                            autoFocus
                        />
                    </div>




                    {/* Action Button */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleCreate}
                            disabled={!title.trim() || isLoading}
                            className="w-full bg-blue-500  hover:opacity-90 text-white rounded-full py-6 font-bold text-base shadow-xl  transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </div>
                            ) : (
                                "Start Your Space"
                            )}
                        </Button>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    )
}
