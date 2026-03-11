"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    FileText,
    AlertTriangle,
    BarChart3,
    Settings,
    Bell,
    Menu,
    Shield,
    Verified,
    LogOut,
    Sun,
    MoreHorizontal
} from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
    const { data: user, isLoading } = useCurrentUser();
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();

    const isAdmin = !!user && user.auth.role === "ADMIN";

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            if (user?.auth?.role === "SUPER_ADMIN") {
                router.replace("/super-admin");
            } else {
                router.replace("/");
            }
        }
    }, [isAdmin, isLoading, router, user]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0B0C0E]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D9BF0]"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const navigationLinks = [
        { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { label: "Users", icon: Users, href: "/admin/users" },
        { label: "Posts", icon: FileText, href: "/admin/posts" },
        { label: "Reports", icon: AlertTriangle, href: "/admin/reports" },
        { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
        { label: "Notifications", icon: Bell, href: "/admin/notifications" },
        { label: "RBAC", icon: Shield, href: "/admin/rbac" },
        { label: "Policies", icon: Verified, href: "/admin/policies" },
        { label: "Settings", icon: Settings, href: "/admin/settings" },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-white dark:bg-[#0B0C0E] text-slate-900 dark:text-[#E7E9EA] font-display transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-[300px] border-r border-slate-200 dark:border-[#2F3336]/30 shrink-0 flex flex-col hidden md:flex transition-all p-6 bg-slate-50/50 dark:bg-transparent">
                <div className="flex flex-col h-full justify-between">
                    <div className="flex flex-col gap-8">
                        {/* Logo */}
                        <Link href="/admin" className="px-3">
                            <Logo />
                        </Link>

                        {/* Nav Links */}
                        <nav className="flex flex-col gap-1">
                            {navigationLinks.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all group relative",
                                            isActive
                                                ? "bg-[#1D9BF0]/10 text-[#1D9BF0] font-bold"
                                                : "text-slate-600 dark:text-[#E7E9EA]/70 hover:bg-slate-200/50 dark:hover:bg-[#16181C] hover:text-slate-900 dark:hover:text-[#E7E9EA]"
                                        )}
                                    >
                                        <Icon className={cn("w-6 h-6", isActive ? "text-[#1D9BF0]" : "text-slate-400 dark:text-[#E7E9EA]/50")} />
                                        <span className="text-[17px]">{link.label}</span>
                                    </Link>
                                );
                            })}

                            <button
                                type="button"
                                onClick={() => logout()}
                                className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-[#F97070] hover:bg-[#F97070]/10 mt-2"
                            >
                                <LogOut className="w-6 h-6" />
                                <span className="text-[17px] font-bold">Logout</span>
                            </button>
                        </nav>
                    </div>

                    {/* Bottom Utils */}
                    <div className="flex flex-col gap-4">
                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between px-4 py-3.5 bg-white dark:bg-[#16181C] rounded-2xl border border-slate-200 dark:border-[#2F3336]/20 shadow-sm">
                            <div className="flex items-center gap-3">
                                {theme === "dark" ? (
                                    <svg className="w-5 h-5 text-[#E7E9EA]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                ) : (
                                    <Sun className="w-5 h-5 text-amber-500" />
                                )}
                                <span className="text-[15px] font-medium text-slate-700 dark:text-[#E7E9EA]">Dark Mode</span>
                            </div>
                            <Switch
                                checked={theme === "dark"}
                                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                                className="data-[state=checked]:bg-[#1D9BF0]"
                            />
                        </div>

                        {/* User Profile */}
                        {user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-200/50 dark:hover:bg-[#16181C] transition-all cursor-pointer group outline-none border border-transparent active:border-slate-300 dark:active:border-[#2F3336]">
                                        <div className="size-11 rounded-full bg-gradient-to-br from-[#1D9BF0] to-[#0A4A7F] p-[2px] overflow-hidden shrink-0 shadow-lg">
                                            <div className="size-full rounded-full overflow-hidden bg-white dark:bg-black">
                                                <img
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    alt={user.name}
                                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-[15px] truncate text-slate-900 dark:text-[#E7E9EA]">{user.name}</p>
                                            <p className="text-[13px] text-slate-500 dark:text-[#71767B] truncate lowercase">@{user.username}</p>
                                        </div>
                                        <MoreHorizontal className="w-5 h-5 text-slate-400 dark:text-[#71767B] group-hover:text-slate-900 dark:group-hover:text-[#E7E9EA] transition-colors" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" side="top" className="w-64 p-3 rounded-2xl bg-white dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] shadow-2xl mb-2 text-slate-900 dark:text-[#E7E9EA]">
                                    <DropdownMenuItem
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-[#333639] transition-colors outline-none"
                                        onClick={() => router.push(`/settings`)}
                                    >
                                        <Settings className="w-5 h-5 text-slate-400 dark:text-[#71767B]" />
                                        <span className="font-semibold">Settings</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-rose-50 dark:hover:bg-[#F97070]/10 text-rose-600 dark:text-[#F97070] transition-colors outline-none"
                                        onClick={() => logout()}
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span className="font-semibold">Logout @{user.username}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-black relative">
                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#1D9BF0]/5 to-transparent pointer-events-none" />

                <header className="h-[64px] bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 border-b border-slate-200 dark:border-[#2F3336]/30 z-10 lg:hidden">
                    <Logo size={32} />
                    <button className="p-2 text-slate-600 dark:text-[#E7E9EA] hover:bg-slate-100 dark:hover:bg-[#16181C] rounded-full transition-colors">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-auto relative z-0">
                    <div className="w-full p-0 min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
