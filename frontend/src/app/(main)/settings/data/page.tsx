"use client";

import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
    Loader2,
    Download,
    LockKeyhole,
    Mail,
    LogIn,
    Laptop,
    Smartphone,
    ShieldAlert,
    ExternalLink,
    X,
    MapPin,
    Network,
    Shield
} from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { useSecurity } from "@/hooks/use-user";
import { formatDistanceToNow, format } from "date-fns";

export default function SettingsDataPage() {
    const { user, isLoading: isAuthLoading, deleteAccount, isDeleting, logout } = useAuth();
    const {
        sessions,
        auditLogs,
        dataRequests,
        requestDataArchive,
        revokeSession,
        revokeAllSessions
    } = useSettings();
    const { security, revokeApp } = useSecurity();

    const isPageLoading = isAuthLoading || sessions.isLoading || auditLogs.isLoading || dataRequests.isLoading;

    if (isPageLoading || !user) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleDownloadRequest = async () => {
        try {
            await requestDataArchive.mutateAsync();
        } catch (error) {
            // Error toast handled in hook
        }
    };

    const parseUserAgent = (ua: string) => {
        const isMobile = /mobile|iphone|android|tablet/i.test(ua);
        const Icon = isMobile ? Smartphone : Laptop;

        let name = "Unknown Device";
        if (/chrome/i.test(ua)) name = "Chrome Browser";
        else if (/safari/i.test(ua)) name = "Safari Browser";
        else if (/firefox/i.test(ua)) name = "Firefox Browser";
        else if (/edg/i.test(ua)) name = "Edge Browser";

        if (/windows/i.test(ua)) name += " (Windows)";
        else if (/mac/i.test(ua)) name += " (macOS)";
        else if (/iphone/i.test(ua)) name = "iPhone App";
        else if (/android/i.test(ua)) name = "Android App";

        return { name, Icon };
    };

    const auditLogIcons: Record<string, { icon: any, color: string }> = {
        'PASSWORD_CHANGE': { icon: LockKeyhole, color: "text-blue-500 bg-blue-500/10" },
        'EMAIL_UPDATE': { icon: Mail, color: "text-purple-500 bg-purple-500/10" },
        'LOGIN': { icon: LogIn, color: "text-emerald-500 bg-emerald-500/10" },
        'DEFAULT': { icon: Shield, color: "text-slate-500 bg-slate-500/10" }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Data & Activity</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your digital footprint, download your archives, and monitor your account security.</p>
            </header>

            <div className="space-y-10">
                {/* Download Data Section */}
                <section className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex-1 space-y-2">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Download Your Data</h3>
                            <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                                Get a copy of everything you've shared on SocialApp. This includes your posts, media, messages, and profile information. The archive can take up to 24 hours to generate.
                            </p>
                        </div>
                        <button
                            onClick={handleDownloadRequest}
                            disabled={requestDataArchive.isPending}
                            className="flex h-14 items-center justify-center gap-3 rounded-2xl bg-primary px-8 text-sm font-black text-white transition-all hover:bg-blue-700 active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-70"
                        >
                            {requestDataArchive.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                            Request Download
                        </button>
                    </div>
                </section>

                {/* Account Activity Section */}
                <section className="space-y-5">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Account Activity</h3>
                        <button className="text-[13px] font-black uppercase tracking-widest text-primary hover:underline transition-all">View all history</button>
                    </div>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(auditLogs.data || []).length > 0 ? (auditLogs.data || []).map((item) => {
                                const info = auditLogIcons[item.action] || auditLogIcons.DEFAULT;
                                return (
                                    <div key={item.id} className="flex items-start gap-5 p-6 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                        <div className={cn("size-10 shrink-0 items-center justify-center rounded-2xl flex", info.color)}>
                                            <info.icon className="size-5" />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-1.5">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-slate-900 dark:text-white text-[15px]">{item.action.replace(/_/g, ' ')}</p>
                                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> Earth</span>
                                                <span className="flex items-center gap-1.5"><Network className="size-3.5" /> {item.ipAddress}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-8 text-center text-slate-500 font-medium">No recent activity detected.</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Active Sessions Section */}
                <section className="space-y-5">
                    <div className="flex items-center justify-between px-2">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Sessions</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">You are currently logged in on these devices.</p>
                        </div>
                        <button
                            onClick={() => revokeAllSessions.mutate(undefined, { onSuccess: () => logout() })}
                            disabled={revokeAllSessions.isPending}
                            className="rounded-xl border-2 border-rose-500/20 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-rose-500 transition-all hover:bg-rose-500 hover:text-white shadow-sm disabled:opacity-50"
                        >
                            Log out from all devices
                        </button>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {(sessions.data || []).map((session) => {
                            const { name, Icon } = parseUserAgent(session.userAgent);
                            return (
                                <div key={session.id} className="group relative flex items-center gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-6 shadow-sm transition-all hover:border-primary/20">
                                    <div className="size-14 shrink-0 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                        <Icon className={cn("size-6", session.isValid ? "text-primary" : "text-slate-400")} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="truncate font-bold text-slate-900 dark:text-white text-[15px]">{name}</p>
                                            <button
                                                onClick={() => revokeSession.mutate(session.id)}
                                                disabled={revokeSession.isPending}
                                                className="text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-50"
                                            >
                                                <X className="size-5" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {session.isValid && (
                                                <span className="flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-emerald-500 mb-1">
                                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                    ACTIVE NOW
                                                </span>
                                            )}
                                            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                                                {formatDistanceToNow(new Date(session.lastActiveAt), { addSuffix: true })} • {session.ipAddress}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Third-party Apps Section */}
                <section className="space-y-5">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white px-2">Third-party Apps</h3>
                    <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(security?.connectedApps || []).length > 0 ? (
                                (security?.connectedApps || []).map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-black/10 bg-primary")}>
                                                {app.provider?.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white capitalize text-[15px]">{app.provider.toLowerCase()} API Integration</p>
                                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">Full access to profile information</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => revokeApp(app.id)}
                                            className="rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-500 hover:dark:bg-rose-500/10 hover:dark:text-rose-400">
                                            Revoke Access
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <p className="text-slate-500 font-medium text-sm">No connected apps found.</p>
                                </div>
                            )}
                        </div>
                        <div className="bg-slate-50/50 dark:bg-slate-800/20 p-5 text-center border-t border-slate-100 dark:border-slate-800">
                            <button className="text-[13px] font-bold text-primary hover:underline inline-flex items-center gap-2 group">
                                Find more apps in the App Directory
                                <ExternalLink className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Danger Zone Section */}
                <section className="rounded-2xl border-2 border-rose-500/10 bg-rose-500/5 p-8 dark:bg-rose-500/10">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="size-14 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 flex text-rose-500">
                            <ShieldAlert className="size-8" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h4 className="font-extrabold text-rose-500 text-lg">Delete Account & Data</h4>
                            <p className="text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Permanently remove your account and all associated data. This action is irreversible and will purge your history immediately.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                if (confirm("Are you sure you want to permanently delete your account? This cannot be undone!")) {
                                    deleteAccount();
                                }
                            }}
                            disabled={isDeleting}
                            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-8 py-4 text-sm font-black text-white transition-all hover:bg-rose-600 active:scale-95 shadow-xl shadow-rose-500/20 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {isDeleting && <Loader2 className="size-4 animate-spin" />}
                            Delete Account
                        </button>
                    </div>
                </section>

                {/* <footer className="pt-10 pb-16 border-t border-slate-200 dark:border-slate-800 space-y-6">
                    <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 px-2 leading-relaxed">
                        <Shield className="size-5 shrink-0 text-primary" />
                        <p className="text-xs font-semibold tracking-tight">Your data is encrypted and secure with SocialApp Enterprise Shield™</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-2">
                        <div className="flex flex-wrap items-center gap-8">
                            <a href="#" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Privacy Policy</a>
                            <a href="#" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Terms of Service</a>
                            <a href="#" className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">Cookie Settings</a>
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400/60">© 2024 SocialApp Enterprise</p>
                    </div>
                </footer> */}
            </div>
        </div>
    );
}
