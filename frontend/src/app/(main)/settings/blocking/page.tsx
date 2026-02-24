"use client";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Loader2, Search, Info, UserPlus } from "lucide-react";
import { useState } from "react";
import { useSettings } from "@/hooks/use-settings";
import { format } from "date-fns";
import Image from "next/image";

// Removed mock blocked users

export default function SettingsBlockingPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { blockedUsers, unblockUser } = useSettings();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const isPageLoading = isAuthLoading || blockedUsers.isLoading;

    if (isPageLoading || !user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const filteredUsers = (blockedUsers.data || []).filter(u =>
        u.blockedUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.blockedUser.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative">
            <div className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-500",
                selectedUser && "blur-sm pointer-events-none transition-all duration-300"
            )}>
                <header className="mb-10">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Blocked Users</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed text-[15px]">
                        Manage the accounts you've blocked. Blocked users cannot message you, see your posts, or find your profile.
                    </p>
                </header>

                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
                    {/* Search Header */}
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search blocked accounts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-[15px] transition-all"
                            />
                        </div>
                    </div>

                    {/* User List */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((item) => (
                                <div
                                    key={item.blockedUser.id}
                                    className="group flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-14 w-14 group-hover:scale-105 transition-transform duration-300">
                                            <Image
                                                src={item.blockedUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.blockedUser.username}`}
                                                alt={item.blockedUser.name}
                                                fill
                                                className="rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 group-hover:ring-primary/20 transition-all"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors text-[15px]">{item.blockedUser.name}</span>
                                                <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">@{item.blockedUser.username}</span>
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-[0.05em] text-slate-400 dark:text-slate-500">
                                                Blocked {format(new Date(item.createdAt), "MMM d, yyyy")}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedUser(item.blockedUser)}
                                        className="px-6 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-slate-200 dark:border-slate-700 rounded-xl hover:bg-primary hover:border-primary hover:text-white transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
                                    >
                                        Unblock
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-center animate-in fade-in duration-500">
                                <div className="size-16 bg-slate-100 dark:bg-slate-800/40 rounded-3xl flex items-center justify-center mb-4">
                                    <Search className="size-8 text-slate-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found</h3>
                                <p className="text-sm text-slate-500 mt-1">We couldn't find any blocked users matching your search.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total items: {blockedUsers.data?.length || 0}</p>
                        <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:underline group">
                            <Info className="size-4" />
                            Help Center
                        </button>
                    </div>
                </div>
            </div>

            {/* Unblock Confirmation Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="p-10 text-center">
                            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                                <UserPlus className="h-10 w-10 text-primary" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                Unblock {selectedUser.name}?
                            </h3>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                                They will be able to see your profile, follow you, and message you again.
                            </p>
                        </div>
                        <div className="flex border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 py-5 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-r border-slate-100 dark:border-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await unblockUser.mutateAsync(selectedUser.id);
                                    setSelectedUser(null);
                                }}
                                disabled={unblockUser.isPending}
                                className="flex-1 py-5 px-6 text-sm font-black text-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                            >
                                {unblockUser.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Unblock"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
