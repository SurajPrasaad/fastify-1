"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useExploreSearch } from "@/features/explore/hooks"
import { useRouter } from "next/navigation"

interface ExploreSearchBarProps {
    onSearchStateChange?: (isSearching: boolean) => void
    onSearchResults?: (results: any[], type: string) => void
}

export function ExploreSearchBar({ onSearchStateChange, onSearchResults }: ExploreSearchBarProps) {
    const router = useRouter()
    const [query, setQuery] = React.useState("")
    const [debouncedQuery, setDebouncedQuery] = React.useState("")
    const [isFocused, setIsFocused] = React.useState(false)
    const [searchType, setSearchType] = React.useState("posts")
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(timer)
    }, [query])

    const { data: searchResults, isLoading } = useExploreSearch(debouncedQuery, searchType)

    // Notify parent about search state
    React.useEffect(() => {
        onSearchStateChange?.(isFocused && query.length > 0)
    }, [isFocused, query, onSearchStateChange])

    React.useEffect(() => {
        if (searchResults?.data) {
            onSearchResults?.(searchResults.data, searchType)
        }
    }, [searchResults, searchType, onSearchResults])

    const searchTypes = [
        { type: "posts", label: "Posts", icon: "article" },
        { type: "users", label: "People", icon: "person_search" },
        { type: "hashtags", label: "Tags", icon: "tag" },
    ]

    return (
        <div className="relative">
            {/* Search Input */}
            <div className={cn(
                "relative group transition-all duration-300",
                isFocused && "scale-[1.01]"
            )}>
                <span className={cn(
                    "material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
                    isFocused ? "text-primary" : "text-slate-500"
                )}>
                    search
                </span>
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    className={cn(
                        "w-full bg-slate-100 dark:bg-slate-900/80 rounded-2xl pl-12 pr-12 py-3.5",
                        "text-sm font-medium outline-none border border-transparent",
                        "transition-all duration-300",
                        "placeholder:text-slate-400 dark:placeholder:text-slate-600",
                        isFocused
                            ? "bg-transparent dark:bg-transparent border-primary/40 ring-2 ring-primary/10 shadow-lg shadow-primary/5"
                            : "hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                    )}
                    placeholder="Search posts, people, hashtags..."
                    type="text"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); inputRef.current?.focus() }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}
            </div>

            {/* Search Dropdown */}
            {isFocused && query.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/20 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Type Filter Chips */}
                    <div className="flex gap-2 p-3 border-b border-slate-100 dark:border-slate-800">
                        {searchTypes.map(st => (
                            <button
                                key={st.type}
                                onClick={(e) => { e.preventDefault(); setSearchType(st.type) }}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all",
                                    searchType === st.type
                                        ? "bg-primary/10 text-primary"
                                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                )}
                            >
                                <span className="material-symbols-outlined text-[14px]">{st.icon}</span>
                                {st.label}
                            </button>
                        ))}
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-4 space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                                            <div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : searchResults?.data && searchResults.data.length > 0 ? (
                            searchResults.data.map((item: any, idx: number) => (
                                <button
                                    key={item.id || idx}
                                    onClick={() => {
                                        if (searchType === "users") router.push(`/${item.username}`)
                                        else if (searchType === "hashtags") router.push(`/explore?tag=${item.name}`)
                                        setIsFocused(false)
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                >
                                    {searchType === "users" ? (
                                        <>
                                            <div className="size-9 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden shrink-0">
                                                <img
                                                    src={item.avatarUrl || `https://api.dicebear.com/7.x/beta/svg?seed=${item.username}`}
                                                    alt={item.username}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{item.name}</p>
                                                <p className="text-xs text-slate-500 truncate">@{item.username}</p>
                                            </div>
                                        </>
                                    ) : searchType === "hashtags" ? (
                                        <>
                                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-primary text-[18px]">tag</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm">#{item.name}</p>
                                                <p className="text-xs text-slate-500">{item.postsCount?.toLocaleString()} posts</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-slate-400 text-[18px]">article</span>
                                            <p className="flex-1 text-sm truncate">{item.content?.substring(0, 80)}...</p>
                                        </>
                                    )}
                                </button>
                            ))
                        ) : debouncedQuery.length >= 2 ? (
                            <div className="p-8 text-center">
                                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700 mb-2 block">search_off</span>
                                <p className="text-sm text-slate-500">No results for &quot;{debouncedQuery}&quot;</p>
                                <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}
