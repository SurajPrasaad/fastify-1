"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SettingsSecurityPage() {
    const { user, isLoading } = useAuth();
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [isSetupComplete, setIsSetupComplete] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleToggle2FA = (checked: boolean) => {
        if (!checked) {
            setIs2FAEnabled(false);
            setIsSetupComplete(false);
            setShowSuccess(false);
        } else {
            setIs2FAEnabled(true);
        }
    };

    const handleVerify = () => {
        setIsSetupComplete(true);
        setShowSuccess(true);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Success Alert */}
            {showSuccess && (
                <div className="mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="size-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-[20px] fill-icon">check_circle</span>
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-emerald-600 dark:text-emerald-500">Success</p>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80">Two-factor authentication activated successfully.</p>
                    </div>
                    <button onClick={() => setShowSuccess(false)} className="text-emerald-500 hover:bg-emerald-500/10 p-2 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>
            )}

            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Security Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your password, login sessions, and account integrations.</p>
            </header>

            <div className="grid gap-8">
                {/* Password Section */}
                <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-primary/20 transition-all">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex gap-4">
                            <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-2xl fill-icon">key</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">Password</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Last changed 3 months ago</p>
                            </div>
                        </div>
                        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]">
                            Change Password
                        </button>
                    </div>
                </section>

                {/* Two-factor authentication */}
                <section className="bg-white dark:bg-slate-900/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-4">
                            <div className="size-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-2xl fill-icon">verified_user</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold mb-1">Two-factor authentication</h3>
                                    {isSetupComplete && (
                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-500/20 inline-flex items-center gap-1">
                                            <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md">Add an extra layer of security to your account.</p>
                            </div>
                        </div>
                        <Switch
                            checked={is2FAEnabled}
                            onCheckedChange={handleToggle2FA}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>

                    {/* Setup / Active State Reveal */}
                    {is2FAEnabled && !isSetupComplete && (
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4 fade-in duration-500">
                            <div className="flex flex-col items-center text-center">
                                <h4 className="text-lg font-bold mb-4">2FA Setup</h4>
                                <div className="bg-white p-6 rounded-2xl mb-4 shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800">
                                    <div className="size-48 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                                        <div className="grid grid-cols-4 grid-rows-4 gap-1 opacity-20">
                                            {Array.from({ length: 16 }).map((_, i) => (
                                                <div key={i} className="size-full bg-slate-900 dark:bg-white" />
                                            ))}
                                        </div>
                                        <span className="material-symbols-outlined text-4xl absolute text-slate-400">qr_code_2</span>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
                                    Scan this QR code in your authenticator app to link your account.
                                </p>
                                <div className="w-full max-w-sm space-y-5">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 text-left ml-1" htmlFor="verification-code">
                                            Verification Code
                                        </label>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary text-center tracking-[0.5em] font-mono text-xl outline-none transition-all"
                                            id="verification-code"
                                            placeholder="000 000"
                                            type="text"
                                            maxLength={6}
                                        />
                                    </div>
                                    <button
                                        onClick={handleVerify}
                                        className="w-full bg-primary hover:bg-primary/90 text-white px-6 py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Verify & Activate
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isSetupComplete && is2FAEnabled && (
                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4 fade-in duration-500">
                            <div className="flex flex-col items-center text-center py-4 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-2xl p-8">
                                <div className="size-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                                    <span className="material-symbols-outlined text-4xl fill-icon">shield_with_heart</span>
                                </div>
                                <h4 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">2FA is Active</h4>
                                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
                                    Your account is now protected with an additional layer of security. We'll ask for a code whenever you log in from a new device.
                                </p>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <button className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm">
                                        View Backup Codes
                                    </button>
                                    <button
                                        onClick={() => handleToggle2FA(false)}
                                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-8 py-3.5 rounded-xl font-bold text-sm transition-all border border-rose-500/10"
                                    >
                                        Disable 2FA
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Login Activity */}
                <section>
                    <h3 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-2 px-1">
                        <span className="material-symbols-outlined text-primary text-[28px] fill-icon">devices</span>
                        Login Activity
                    </h3>
                    <div className="space-y-4">
                        <SessionRow
                            device="MacBook Pro - Chrome"
                            location="London, United Kingdom"
                            ip="192.168.1.1"
                            isCurrent
                            icon="laptop_mac"
                        />
                        <SessionRow
                            device="iPhone 15 Pro - App"
                            location="Paris, France"
                            time="2 hours ago"
                            icon="smartphone"
                        />
                    </div>
                </section>

                {/* Connected Apps */}
                <section>
                    <h3 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-2 px-1">
                        <span className="material-symbols-outlined text-primary text-[28px] fill-icon">hub</span>
                        Connected Apps
                    </h3>
                    <div className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
                        <ConnectedAppRow
                            name="Twitter API Integration"
                            desc="Full access to tweets and profile info"
                            icon="link"
                            iconColor="text-[#1DA1F2]"
                        />
                        <ConnectedAppRow
                            name="Gmail Contacts Sync"
                            desc="Read-only access to contacts"
                            icon="mail"
                            iconColor="text-[#EA4335]"
                        />
                        <ConnectedAppRow
                            name="Discord Rich Presence"
                            desc="Share your status with friends"
                            icon="chat"
                            iconColor="text-[#7289DA]"
                        />
                    </div>
                </section>
            </div>
        </div>
    );
}

function SessionRow({ device, location, ip, isCurrent, time, icon }: any) {
    return (
        <div className="bg-white dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between hover:border-primary/30 transition-all group shadow-sm">
            <div className="flex items-center gap-4">
                <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:bg-primary/5 transition-colors">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">{icon}</span>
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold text-[15px]">{device}</p>
                        {isCurrent && (
                            <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-500/20">Current</span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {location} • {ip ? `IP: ${ip}` : time}
                    </p>
                </div>
            </div>
            <button className="text-slate-400 hover:text-rose-500 font-bold text-sm px-4 py-2 transition-colors">Log out</button>
        </div>
    )
}

function ConnectedAppRow({ name, desc, icon, iconColor }: { name: string, desc: string, icon: string, iconColor: string }) {
    return (
        <div className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center gap-4">
                <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform">
                    <span className={cn("material-symbols-outlined", iconColor)}>{icon}</span>
                </div>
                <div>
                    <p className="font-bold text-[15px]">{name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
            </div>
            <button className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-rose-500/10">
                Revoke Access
            </button>
        </div>
    );
}
