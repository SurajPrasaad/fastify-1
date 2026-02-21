"use client";

import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SettingsPrivacyPage() {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Privacy & Safety</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Control who sees your content and how you interact with others on the platform.</p>
            </header>

            <div className="space-y-6">
                {/* Private Account */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex items-center justify-between shadow-sm group hover:border-primary/20 transition-all">
                    <div className="max-w-[80%]">
                        <h3 className="text-lg font-bold mb-1">Private Account</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            When your account is private, only people you approve can see your photos and videos.
                        </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-primary" />
                </div>

                {/* Interactions */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary fill-icon">forum</span>
                        </div>
                        <h3 className="text-lg font-bold">Interactions</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Who can message me</label>
                            <div className="relative group">
                                <select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-[15px] appearance-none cursor-pointer">
                                    <option>Everyone</option>
                                    <option>Friends only</option>
                                    <option>No one</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors">
                                    expand_more
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Who can comment</label>
                            <div className="relative group">
                                <select className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-[15px] appearance-none cursor-pointer">
                                    <option>Everyone</option>
                                    <option>Friends only</option>
                                    <option>Followers only</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-primary transition-colors">
                                    expand_more
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visibility */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-emerald-500 fill-icon">visibility</span>
                        </div>
                        <h3 className="text-lg font-bold">Visibility</h3>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-5 border-b border-slate-100 dark:border-slate-800 group">
                            <div className="space-y-0.5">
                                <p className="font-bold text-[15px]">Read receipts</p>
                                <p className="text-sm text-slate-500">Allow others to see when you've read their messages.</p>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                        </div>

                        <div className="flex items-center justify-between py-5 group">
                            <div className="space-y-0.5">
                                <p className="font-bold text-[15px]">Activity status</p>
                                <p className="text-sm text-slate-500">Show when you're active on the platform.</p>
                            </div>
                            <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                        </div>
                    </div>
                </div>

                {/* Enhanced Protection Card */}
                <div className="bg-primary/[0.03] dark:bg-primary/[0.02] border border-primary/20 rounded-2xl p-6 flex items-start gap-5 group hover:border-primary/40 transition-colors">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-3xl fill-icon">verified_user</span>
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-primary mb-1">Enhanced Protection</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Our advanced safety systems work in the background to detect and block suspicious accounts, harmful links, and unwanted interactions before they reach you.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
