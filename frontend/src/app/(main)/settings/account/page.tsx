"use client";

import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SettingsAccountPage() {
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
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Account Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your account credentials, security preferences, and subscription status.</p>
            </header>

            <div className="space-y-6">
                {/* Account Information */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-blue-500">info</span>
                        </div>
                        <h3 className="text-lg font-bold">Account Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <input
                                    className="w-full pl-4 pr-11 py-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-[15px]"
                                    type="email"
                                    defaultValue={user.email || "alex.premium@example.com"}
                                />
                                <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 text-[20px] fill-icon">check_circle</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
                            <input
                                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white text-[15px]"
                                placeholder="+1 (555) 000-0000"
                                type="text"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button className="px-8 py-3 bg-primary text-white text-sm font-bold rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            Update Profile
                        </button>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-amber-500">security</span>
                        </div>
                        <h3 className="text-lg font-bold">Security</h3>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="space-y-0.5">
                                <p className="font-bold text-[15px]">Password</p>
                                <p className="text-sm text-slate-500">Last changed 3 months ago</p>
                            </div>
                            <button className="px-5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                Change Password
                            </button>
                        </div>

                        <div className="flex items-center justify-between py-4">
                            <div className="space-y-0.5">
                                <p className="font-bold text-[15px]">Two-factor authentication</p>
                                <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
                            </div>
                            <Switch className="data-[state=checked]:bg-primary" />
                        </div>
                    </div>
                </div>

                {/* Account Status */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[20px] fill-icon">stars</span>
                        </div>
                        <div>
                            <p className="font-bold text-[15px]">Account Status</p>
                            <p className="text-sm text-slate-500">Current plan: <span className="text-primary font-bold">Premium Pro</span></p>
                        </div>
                    </div>
                    <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.15em] rounded-full border border-emerald-500/20">
                        Active
                    </span>
                </div>

                {/* Danger Zone */}
                <div className="border border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-500/[0.02] rounded-2xl p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-rose-500">warning</span>
                        </div>
                        <h3 className="text-lg font-bold text-rose-500">Danger Zone</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/60 rounded-2xl flex items-center justify-between group hover:border-rose-500/30 transition-colors">
                            <div className="space-y-1">
                                <p className="font-bold text-[15px]">Deactivate Account</p>
                                <p className="text-sm text-slate-500">Temporarily hide your profile and content.</p>
                            </div>
                            <button className="text-rose-500 font-bold text-sm hover:underline">Deactivate</button>
                        </div>

                        <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between group">
                            <div className="space-y-1">
                                <p className="font-bold text-rose-500 text-[15px]">Delete Account</p>
                                <p className="text-sm text-rose-500/70">Permanently remove all your data. This cannot be undone.</p>
                            </div>
                            <button className="px-6 py-3 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 hover:scale-[1.02] active:scale-[0.98]">
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
