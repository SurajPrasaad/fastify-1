"use client";

import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function SettingsNotificationsPage() {
    const { user, isLoading } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
        }, 1000);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Notification Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage how you receive alerts and updates across devices and channels.</p>
            </header>

            <div className="space-y-8">
                {/* Push Notifications Card */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary fill-icon">send_to_mobile</span>
                            Push Notifications
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <NotificationToggle
                            title="Likes"
                            desc="When someone likes one of your posts"
                            defaultChecked
                        />
                        <NotificationToggle
                            title="Comments"
                            desc="When someone comments on your posts"
                            defaultChecked
                        />
                        <NotificationToggle
                            title="Mentions"
                            desc="When someone mentions you in a post or comment"
                            defaultChecked
                        />
                        <NotificationToggle
                            title="Follows"
                            desc="When a new user starts following you"
                        />
                        <NotificationToggle
                            title="Reposts"
                            desc="When someone shares your content"
                            defaultChecked
                        />
                        <NotificationToggle
                            title="Messages"
                            desc="Direct messages from other users"
                            defaultChecked
                        />
                    </div>
                </section>

                {/* Email Notifications Card */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary fill-icon">mail</span>
                            Email Notifications
                        </h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        <NotificationToggle
                            title="Weekly summary"
                            desc="Get a digest of the most important things you missed"
                            defaultChecked
                        />
                        <NotificationToggle
                            title="Security alerts"
                            desc="Alerts for login attempts and account changes (Recommended)"
                            disabled
                            defaultChecked
                        />
                        <NotificationToggle
                            title="Product updates"
                            desc="Tips, feature updates, and periodic news"
                        />
                    </div>
                </section>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-5 pt-4 pb-12">
                    <button className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Restore Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-10 py-3 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function NotificationToggle({ title, desc, defaultChecked, disabled }: { title: string, desc: string, defaultChecked?: boolean, disabled?: boolean }) {
    return (
        <label className={cn(
            "flex items-center justify-between px-6 py-5 transition-all cursor-pointer group",
            disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
        )}>
            <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</span>
            </div>
            <Switch
                defaultChecked={defaultChecked}
                disabled={disabled}
                className="data-[state=checked]:bg-primary"
            />
        </label>
    );
}
