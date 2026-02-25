"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { interactionApi } from "@/features/interaction/api"
import { getSuggestions, getActiveFriends } from "@/features/follow/api"
import { useQuery } from "@tanstack/react-query"
import { useToggleFollow } from "@/features/follow/hooks"

export function RightSidebar({ className }: { className?: string }) {
    const [showAllTrends, setShowAllTrends] = React.useState(false)
    const [showAllSuggestions, setShowAllSuggestions] = React.useState(false)

    const { data: trends, isLoading: isLoadingTrends } = useQuery({
        queryKey: ["trending-hashtags"],
        queryFn: () => interactionApi.getTrendingHashtags(10),
        staleTime: 1000 * 60 * 5,
    })

    const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
        queryKey: ["user-suggestions"],
        queryFn: () => getSuggestions(10),
        staleTime: 1000 * 60 * 5,
    })

    const { data: activeFriends, isLoading: isLoadingFriends } = useQuery({
        queryKey: ["active-friends"],
        queryFn: () => getActiveFriends(),
        refetchInterval: 1000 * 30, // Refetch every 30 seconds for presence updates
    })

    const displayTrends = showAllTrends ? trends : trends?.slice(0, 3)
    const displaySuggestions = showAllSuggestions ? suggestions : suggestions?.slice(0, 2)

    return (
        <aside className={cn("hidden lg:flex flex-col w-80 h-screen p-6 gap-6 overflow-y-auto", className)}>
            {/* Search */}
            <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                    search
                </span>
                <input
                    className="w-full bg-slate-100 dark:bg-surface-dark border-none rounded-full py-3 pl-12 pr-4 focus:ring-1 focus:ring-primary focus:bg-transparent transition-all outline-none text-sm"
                    placeholder="Search SocialApp"
                    type="text"
                />
            </div>

            {/* Trending Section */}
            <div className="bg-slate-100 dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-white/5">
                <h3 className="text-lg font-bold p-4 pb-2">Trending</h3>
                <div className="flex flex-col max-h-[400px] overflow-y-auto custom-scrollbar">
                    {isLoadingTrends ? (
                        <div className="p-4 space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse space-y-2">
                                    <div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : displayTrends?.length ? (
                        displayTrends.map((trend) => (
                            <TrendingItem
                                key={trend.id}
                                category="Trending"
                                topic={`#${trend.name}`}
                                posts={`${trend.postsCount.toLocaleString()} posts`}
                            />
                        ))
                    ) : (
                        <p className="p-4 text-sm text-slate-500 text-center">No trending topics</p>
                    )}

                    {trends && trends.length > 3 && (
                        <button
                            onClick={() => setShowAllTrends(!showAllTrends)}
                            className="w-full text-left px-4 py-4 text-primary text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border-t border-slate-200 dark:border-white/5"
                        >
                            {showAllTrends ? "Show less" : "Show more"}
                        </button>
                    )}
                </div>
            </div>

            {/* Who to Follow */}
            <div className="bg-slate-100 dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-white/5">
                <h3 className="text-lg font-bold p-4 pb-2">Who to follow</h3>
                <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                    {isLoadingSuggestions ? (
                        <div className="p-4 space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                        <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    </div>
                                    <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : displaySuggestions?.length ? (
                        displaySuggestions.map((user) => (
                            <FollowSuggestion
                                key={user.id}
                                userId={user.id}
                                name={user.name}
                                username={`@${user.username}`}
                                avatar={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`}
                                isFollowing={user.isFollowing}
                            />
                        ))
                    ) : (
                        <p className="p-4 text-sm text-slate-500 text-center">No suggestions yet</p>
                    )}

                    {suggestions && suggestions.length > 2 && (
                        <button
                            onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                            className="w-full text-left px-4 py-4 text-primary text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border-t border-slate-200 dark:border-white/5"
                        >
                            {showAllSuggestions ? "Show less" : "Show more"}
                        </button>
                    )}
                </div>
            </div>

            {/* Active Friends */}
            <div className="bg-slate-100 dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-white/5">
                <h3 className="text-sm font-bold p-4 pb-2 text-slate-500 uppercase tracking-widest">Active Friends</h3>
                <div className="flex flex-col px-2 py-2 gap-1 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {isLoadingFriends ? (
                        <div className="px-2 py-2 space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-center gap-3 animate-pulse">
                                    <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : activeFriends?.length ? (
                        activeFriends.map((friend) => (
                            <ActiveFriend
                                key={friend.id}
                                name={friend.name}
                                avatar={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.name}`}
                            />
                        ))
                    ) : (
                        <p className="p-4 text-[12px] text-slate-500 text-center">No friends active</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            {/* <footer className="px-4 pb-8 text-[12px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-auto">
                <a className="hover:underline" href="#">Terms of Service</a>
                <a className="hover:underline" href="#">Privacy Policy</a>
                <a className="hover:underline" href="#">Cookie Policy</a>
                <a className="hover:underline" href="#">Accessibility</a>
                <a className="hover:underline" href="#">Ads info</a>
                <span>© 2024 SocialApp Corp.</span>
            </footer> */}
        </aside>
    )
}

function TrendingItem({ category, topic, posts }: { category: string, topic: string, posts: string }) {
    return (
        <a className="px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all" href="#">
            <p className="text-xs text-slate-500">{category}</p>
            <p className="font-bold">{topic}</p>
            <p className="text-xs text-slate-500">{posts}</p>
        </a>
    )
}

function FollowSuggestion({ userId, name, username, avatar, isFollowing }: { userId: string, name: string, username: string, avatar: string, isFollowing: boolean }) {
    const { mutate: toggleFollow, isPending } = useToggleFollow();

    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer">
            <div className="size-10 rounded-full bg-slate-400 overflow-hidden shrink-0">
                <img className="w-full h-full object-cover" alt={name} src={avatar} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{name}</p>
                <p className="text-xs text-slate-500 truncate">{username}</p>
            </div>
            <button
                disabled={isPending}
                onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow({ userId, isFollowing });
                }}
                className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50",
                    isFollowing
                        ? "bg-transparent border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-80"
                )}
            >
                {isFollowing ? "Following" : "Follow"}
            </button>
        </div>
    )
}

function ActiveFriend({ name, avatar }: { name: string, avatar: string }) {
    return (
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer">
            <div className="relative">
                <div className="size-9 rounded-full bg-slate-400 overflow-hidden">
                    <img className="w-full h-full object-cover" alt={name} src={avatar} />
                </div>
                <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-slate-100 dark:border-surface-dark rounded-full"></div>
            </div>
            <span className="text-sm font-medium truncate">{name}</span>
        </div>
    )
}
