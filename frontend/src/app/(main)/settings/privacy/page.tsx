"use client";

import React from "react";
import { usePrivacy } from "@/hooks/use-user";
import { Loader2, Shield, Eye, Users, Search, Activity, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const VISIBILITY_OPTIONS = [
    { label: "Everyone", value: "PUBLIC", description: "Anyone on or off the platform can see this." },
    { label: "Followers", value: "FOLLOWERS", description: "Only people who follow you can see this." },
    { label: "Private", value: "PRIVATE", description: "Only you can see this information." },
];

export default function PrivacySettingsPage() {
    const { privacy, isLoading, updatePrivacy, isUpdating } = usePrivacy();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleUpdate = (field: string, value: any) => {
        updatePrivacy({ [field]: value });
    };

    return (
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Privacy & Safety</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Control who sees your content and how you interact with others on the platform.</p>
            </header>

            <div className="space-y-8">
                {/* Profile Visibility */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <Eye className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Profile Visibility</h2>
                            <p className="text-sm text-slate-500">Determine who can view your main profile page.</p>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        {VISIBILITY_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleUpdate("profileVisibility", option.value)}
                                className={cn(
                                    "w-full flex items-center justify-between p-6 rounded-2xl border transition-all text-left group",
                                    privacy?.profileVisibility === option.value
                                        ? "bg-primary/5 border-primary shadow-sm"
                                        : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "size-5 rounded-full border-2 flex items-center justify-center transition-all",
                                        privacy?.profileVisibility === option.value
                                            ? "border-primary bg-primary"
                                            : "border-slate-300 dark:border-slate-600"
                                    )}>
                                        {privacy?.profileVisibility === option.value && <div className="size-2 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <p className={cn("font-bold", privacy?.profileVisibility === option.value ? "text-primary" : "text-slate-900 dark:text-white")}>
                                            {option.label}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">{option.description}</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Network Visibility */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <VisibilityCard
                        title="Followers List"
                        description="Who can see your followers list?"
                        icon={<Users className="size-5" />}
                        value={privacy?.followersVisibility}
                        onChange={(val) => handleUpdate("followersVisibility", val)}
                    />
                    <VisibilityCard
                        title="Following List"
                        description="Who can see who you follow?"
                        icon={<Users className="size-5" />}
                        value={privacy?.followingVisibility}
                        onChange={(val) => handleUpdate("followingVisibility", val)}
                    />
                </div>

                {/* Activity & Search */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <Activity className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Activity Visibility</h3>
                                    <p className="text-sm text-slate-500">Show when you're active on the platform.</p>
                                </div>
                            </div>
                            <select
                                value={privacy?.activityVisibility}
                                onChange={(e) => handleUpdate("activityVisibility", e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                            >
                                <option value="PUBLIC">Everyone</option>
                                <option value="FOLLOWERS">Followers only</option>
                                <option value="PRIVATE">Only me</option>
                            </select>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-800" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Search className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Search Visibility</h3>
                                    <p className="text-sm text-slate-500">Allow search engines to index your profile.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={privacy?.searchVisibility}
                                    onChange={(e) => handleUpdate("searchVisibility", e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Enhanced Protection Promo */}
                <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                        <Shield className="size-32" />
                    </div>
                    <div className="relative z-10 flex items-start gap-4">
                        <div className="size-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Shield className="size-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-white">Enhanced Protection</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-lg leading-relaxed">
                                Our advanced safety systems work in the background to detect and block suspicious accounts, harmful links, and unwanted interactions before they reach you.
                            </p>
                            <button className="mt-4 text-indigo-600 dark:text-indigo-400 text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all">
                                Learn more <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isUpdating && (
                <div className="fixed bottom-8 right-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                    <Loader2 className="size-5 animate-spin text-primary" />
                    <span className="text-sm font-bold">Saving changes...</span>
                </div>
            )}
        </div>
    );
}

interface VisibilityCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    value: string | undefined;
    onChange: (value: string) => void;
}

function VisibilityCard({ title, description, icon, value, onChange }: VisibilityCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{description}</p>
                </div>
            </div>

            <div className="space-y-2">
                {["PUBLIC", "FOLLOWERS", "PRIVATE"].map((option) => (
                    <button
                        key={option}
                        onClick={() => onChange(option)}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm",
                            value === option
                                ? "bg-primary/5 border-primary/30 text-primary font-bold shadow-sm"
                                : "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 font-medium"
                        )}
                    >
                        {option === "PUBLIC" ? "Everyone" : option === "FOLLOWERS" ? "Followers" : "Private"}
                        {value === option && <div className="size-2 bg-primary rounded-full" />}
                    </button>
                ))}
            </div>
        </div>
    );
}
