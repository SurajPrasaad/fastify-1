"use client";

import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSettings, ChatSettings } from "@/hooks/use-settings";

export default function SettingsChatPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { chatSettings, updateChatSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState<ChatSettings | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (chatSettings.data) {
            setLocalSettings(chatSettings.data);
        }
    }, [chatSettings.data]);

    const isPageLoading = isAuthLoading || chatSettings.isLoading;

    if (isPageLoading || !user || !localSettings) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSave = async () => {
        if (!localSettings) return;
        try {
            await updateChatSettings.mutateAsync(localSettings);
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleToggle = (key: keyof ChatSettings) => {
        setLocalSettings(prev => prev ? { ...prev, [key]: !prev[key] } : null);
    };

    const handleDiscard = () => {
        if (chatSettings.data) {
            setLocalSettings(chatSettings.data);
        }
    };

    return (
        <div className="relative">
            <div className={cn(
                "animate-in fade-in slide-in-from-bottom-2 duration-500",
                isDeleteDialogOpen && "blur-sm pointer-events-none transition-all duration-300"
            )}>
                <header className="mb-10">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Chat Settings</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Customize your messaging experience and manage your chat data.</p>
                </header>

                <div className="space-y-8">
                    {/* Messaging Section */}
                    <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary fill-icon">chat</span>
                                Messaging
                            </h2>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            <ChatToggle
                                title="Enter to send"
                                desc="The Enter key will send your message"
                                checked={localSettings.enterToSend}
                                onCheckedChange={() => handleToggle('enterToSend')}
                            />
                            <ChatToggle
                                title="Typing indicator"
                                desc="Let others know when you are typing"
                                checked={localSettings.typingIndicators}
                                onCheckedChange={() => handleToggle('typingIndicators')}
                            />
                            <ChatToggle
                                title="Read receipts"
                                desc="Show when you've read messages"
                                checked={localSettings.readReceipts}
                                onCheckedChange={() => handleToggle('readReceipts')}
                            />
                        </div>
                    </section>

                    {/* Media & Storage Section */}
                    <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary fill-icon">perm_media</span>
                                Media & Storage
                            </h2>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            <ChatToggle
                                title="Media auto-download"
                                desc="Automatically download images and videos"
                                checked={localSettings.mediaAutoDownload}
                                onCheckedChange={() => handleToggle('mediaAutoDownload')}
                            />
                            <ChatToggle
                                title="Save to gallery"
                                desc="Save photos and videos to your device gallery"
                                checked={localSettings.saveToGallery}
                                onCheckedChange={() => handleToggle('saveToGallery')}
                            />
                        </div>
                    </section>

                    {/* Privacy & History Section */}
                    <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary fill-icon">history</span>
                                Privacy & History
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <button className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                                Clear all chat history
                            </button>
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-black text-rose-500 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl transition-all"
                            >
                                Delete all conversations
                            </button>
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-5 pt-4 pb-12">
                        <button
                            onClick={handleDiscard}
                            className="px-6 py-2.5 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            Discard Changes
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateChatSettings.isPending}
                            className="px-10 py-3 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {updateChatSettings.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {isDeleteDialogOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="p-10 text-center">
                            <div className="size-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce-[0.5s]">
                                <span className="material-symbols-outlined text-rose-500 text-4xl fill-icon">delete_forever</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                Delete all chats?
                            </h3>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px] mx-auto">
                                This action will permanently remove all your chat history. <span className="font-bold text-rose-500">This cannot be undone.</span>
                            </p>
                        </div>
                        <div className="px-10 pb-10 space-y-3">
                            <button
                                onClick={() => setIsDeleteDialogOpen(false)} // Simulation
                                className="w-full py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl transition-all shadow-xl shadow-rose-500/25 hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Delete All
                            </button>
                            <button
                                onClick={() => setIsDeleteDialogOpen(false)}
                                className="w-full py-4 px-6 bg-transparent text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all rounded-2xl"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ChatToggle({
    title,
    desc,
    checked,
    onCheckedChange
}: {
    title: string,
    desc: string,
    checked: boolean,
    onCheckedChange: () => void
}) {
    return (
        <label className="flex items-center justify-between px-6 py-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all cursor-pointer group">
            <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</span>
            </div>
            <Switch
                checked={checked}
                onCheckedChange={onCheckedChange}
                className="data-[state=checked]:bg-primary"
            />
        </label>
    );
}
