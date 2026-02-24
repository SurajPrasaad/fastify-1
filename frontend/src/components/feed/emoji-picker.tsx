"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
    onClose: () => void
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    const [search, setSearch] = React.useState("")

    const emojiGroups = [
        {
            title: "Smileys & People",
            emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿"]
        },
        {
            title: "Hands & Body",
            emojis: ["👋", "🤚", "🖐", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄", "💋", "🩸"]
        },
        {
            title: "Animals & Nature",
            emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮", "🐩", "🐺", "🦊", "🦝", "🐱", "🐈", "🦁", "🐯", "🐆", "🐴", "🐎", "🦄", "🦓", "🦌", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏", "🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦏", "🦛", "🐭", "🐀", "🐹", "🐰", "🐇", "🐿", "🦔", "🦇", "🐻", "🐨", "🐼", "🦥", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥", "🐦", "🐧", "🕊", "🦅", "🦆", "🦢", "🦉", "🦩", " peacock", "🦜", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕", "🦖"]
        }
    ]

    const filteredGroups = emojiGroups.map(group => ({
        ...group,
        emojis: group.emojis.filter(e => e.includes(search)) // Simple mock search, doesn't really work for emojis without metadata
    })).filter(group => group.emojis.length > 0)

    return (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                <Search className="text-slate-500" size={18} />
                <input
                    autoFocus
                    placeholder="Search emoji"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-500"
                />
                <button onClick={onClose} className="text-slate-500 hover:text-white">
                    <X size={18} />
                </button>
            </div>

            <ScrollArea className="flex-1 p-2 h-72">
                <div className="flex flex-col gap-4">
                    {filteredGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2 tracking-wider">
                                {group.title}
                            </h3>
                            <div className="grid grid-cols-8 gap-1">
                                {group.emojis.map((emoji, i) => (
                                    <button
                                        key={i}
                                        onClick={() => onSelect(emoji)}
                                        className="text-2xl p-1 hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
