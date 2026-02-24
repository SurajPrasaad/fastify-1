"use client"

import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface GifSelectorProps {
    onSelect: (url: string) => void
    onClose: () => void
}

export function GifSelector({ onSelect, onClose }: GifSelectorProps) {
    const [search, setSearch] = React.useState("")
    const [gifs, setGifs] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)

    // Using trending GIFs initially
    React.useEffect(() => {
        fetchTrending()
    }, [])

    const fetchTrending = async () => {
        setLoading(true)
        try {
            // Using a public-ish Giphy API key for demo purposes (usually you'd use your own)
            const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=dc6zaTOxFJmzC&limit=20`)
            const { data } = await res.json()
            setGifs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const searchGifs = async (query: string) => {
        if (!query) {
            fetchTrending()
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${query}&limit=20`)
            const { data } = await res.json()
            setGifs(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        // Debounce search
        const timeout = setTimeout(() => searchGifs(e.target.value), 500)
        return () => clearTimeout(timeout)
    }

    return (
        <div className="absolute bottom-full left-0 mb-2 w-80 h-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
                <Search className="text-slate-500" size={18} />
                <input
                    autoFocus
                    placeholder="Search GIFs"
                    value={search}
                    onChange={handleSearch}
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-500"
                />
                <button onClick={onClose} className="text-slate-500 hover:text-white">
                    <X size={18} />
                </button>
            </div>

            <ScrollArea className="flex-1 p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        Loading...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                        {gifs.map((gif) => (
                            <button
                                key={gif.id}
                                onClick={() => onSelect(gif.images.fixed_height.url)}
                                className="relative aspect-video rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-slate-800"
                            >
                                <img
                                    src={gif.images.fixed_height.url}
                                    alt={gif.title}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    )
}
