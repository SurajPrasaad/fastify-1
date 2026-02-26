"use client";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNotificationSettings } from "@/hooks/use-user";

export default function SettingsNotificationsPage() {
    const { settings, isLoading, updateSettings, isUpdating } = useNotificationSettings();
    const [localSettings, setLocalSettings] = useState<any>(null);

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleToggle = (category: string, key: string) => {
        setLocalSettings((prev: any) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [key]: !prev[category][key]
            }
        }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
    };

    const handleRestoreDefaults = () => {
        const defaults = {
            pushNotifications: {
                likes: true,
                comments: true,
                mentions: true,
                follows: true,
                reposts: true,
                messages: true,
            },
            emailNotifications: {
                weeklySummary: true,
                securityAlerts: true,
                productUpdates: false,
            }
        };
        setLocalSettings(defaults);
    };

    if (isLoading || !localSettings) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Notification Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage how you receive alerts and updates across devices and channels.</p>
            </header>

            <div className="space-y-8">
                {/* Push Notifications Card */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
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
                            checked={localSettings.pushNotifications.likes}
                            onChange={() => handleToggle('pushNotifications', 'likes')}
                        />
                        <NotificationToggle
                            title="Comments"
                            desc="When someone comments on your posts"
                            checked={localSettings.pushNotifications.comments}
                            onChange={() => handleToggle('pushNotifications', 'comments')}
                        />
                        <NotificationToggle
                            title="Mentions"
                            desc="When someone mentions you in a post or comment"
                            checked={localSettings.pushNotifications.mentions}
                            onChange={() => handleToggle('pushNotifications', 'mentions')}
                        />
                        <NotificationToggle
                            title="Follows"
                            desc="When a new user starts following you"
                            checked={localSettings.pushNotifications.follows}
                            onChange={() => handleToggle('pushNotifications', 'follows')}
                        />
                        <NotificationToggle
                            title="Reposts"
                            desc="When someone shares your content"
                            checked={localSettings.pushNotifications.reposts}
                            onChange={() => handleToggle('pushNotifications', 'reposts')}
                        />
                        <NotificationToggle
                            title="Messages"
                            desc="Direct messages from other users"
                            checked={localSettings.pushNotifications.messages}
                            onChange={() => handleToggle('pushNotifications', 'messages')}
                        />
                    </div>
                </section>

                {/* Email Notifications Card */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
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
                            checked={localSettings.emailNotifications.weeklySummary}
                            onChange={() => handleToggle('emailNotifications', 'weeklySummary')}
                        />
                        <NotificationToggle
                            title="Security alerts"
                            desc="Alerts for login attempts and account changes (Recommended)"
                            checked={localSettings.emailNotifications.securityAlerts}
                            onChange={() => handleToggle('emailNotifications', 'securityAlerts')}
                            disabled
                        />
                        <NotificationToggle
                            title="Product updates"
                            desc="Tips, feature updates, and periodic news"
                            checked={localSettings.emailNotifications.productUpdates}
                            onChange={() => handleToggle('emailNotifications', 'productUpdates')}
                        />
                    </div>
                </section>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-5 pt-4 pb-12">
                    <button
                        onClick={handleRestoreDefaults}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        Restore Defaults
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="px-10 py-3 bg-primary text-white text-sm font-black rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
                    >
                        {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

function NotificationToggle({
    title,
    desc,
    checked,
    onChange,
    disabled
}: {
    title: string,
    desc: string,
    checked: boolean,
    onChange: () => void,
    disabled?: boolean
}) {
    return (
        <label className={cn(
            "flex items-center justify-between px-6 py-5 transition-all cursor-pointer group",
            disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
        )}>
            <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</span>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onChange}
                disabled={disabled}
                className="data-[state=checked]:bg-primary"
            />
        </label>
    );
}
