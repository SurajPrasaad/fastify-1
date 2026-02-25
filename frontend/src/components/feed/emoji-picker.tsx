"use client"
import dynamic from "next/dynamic"
import { X } from "lucide-react"
import { Theme, EmojiStyle } from "emoji-picker-react"

const Picker = dynamic(() => import("emoji-picker-react"), { ssr: false })

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
    onClose: () => void
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    return (
        <div className="absolute top-full left-0 mt-2 z-50 animate-in fade-in slide-in-from-top-2">
            <div className="relative">
                <button
                    onClick={onClose}
                    className="absolute -top-2 -right-2 z-10 size-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
                >
                    <X size={12} />
                </button>
                <Picker
                    onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
                    theme={Theme.AUTO}
                    emojiStyle={EmojiStyle.NATIVE}
                    height={300}
                    width={350}
                    searchPlaceholder="Search emoji..."
                    previewConfig={{ showPreview: false }}
                    skinTonesDisabled
                    lazyLoadEmojis
                />
            </div>
        </div>
    )
}
