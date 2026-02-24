"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
    { label: "Profile", href: "/settings/profile" },
    { label: "Account", href: "/settings/account" },
    { label: "Privacy", href: "/settings/privacy" },
    { label: "Security", href: "/settings/security" },
    { label: "Notifications", href: "/settings/notifications" },
    { label: "Appearance", href: "/settings/appearance" },
    { label: "Chat Settings", href: "/settings/chat" },
    { label: "Blocked Users", href: "/settings/blocking" },
    { label: "Data & Activity", href: "/settings/data" },
    { label: "Help & Support", href: "/settings/help" },
];

export function SettingsSidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className="w-full flex flex-col h-full bg-slate-50/50 dark:bg-background-dark/30 overflow-y-auto custom-scrollbar">
            <div className="p-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6 px-3">
                    Settings
                </h2>
                <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-white dark:bg-slate-800 shadow-sm border border-slate-200/50 dark:border-slate-700/50 text-primary font-bold"
                                        : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40"
                                )}
                            >
                                <span className="text-sm">{item.label}</span>
                                {isActive && (
                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                )}
                            </Link>
                        );
                    })}

                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => logout()}
                            className="w-full flex items-center justify-between px-4 py-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all mt-1"
                        >
                            <span className="text-sm font-bold uppercase tracking-wider">Logout</span>
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                        </button>
                    </div>
                </nav>
            </div>
        </aside>
    );
}
