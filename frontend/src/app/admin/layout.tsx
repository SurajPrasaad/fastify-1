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
    Rocket,
    User as UserIcon,
    Verified,
    LogOut,
} from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/components/AuthProvider";

type AdminGroupId =
    | "dashboard"
    | "users"
    | "posts"
    | "reports"
    | "analytics"
    | "notifications"
    | "rbac"
    | "policies";

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
    const { data: user, isLoading } = useCurrentUser();
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [openGroups, setOpenGroups] = useState<Record<AdminGroupId, boolean>>(() => {
        if (typeof globalThis === "undefined" || !globalThis.window) {
            return {
                dashboard: true,
                moderation: false,
                users: false,
                posts: false,
                reports: false,
                analytics: false,
                notifications: false,
                rbac: false,
                policies: false,
            };
        }
        try {
            return JSON.parse(
                globalThis.window.localStorage.getItem("admin_sidebar") ||
                '{"dashboard":true}'
            );
        } catch {
            return { dashboard: true } as Record<AdminGroupId, boolean>;
        }
    });

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
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D9BF0]"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    const groups: {
        id: AdminGroupId;
        label: string;
        icon: any;
        href: string;
    }[] = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { id: "users", label: "Users", icon: Users, href: "/admin/users" },
        { id: "posts", label: "Posts", icon: FileText, href: "/admin/posts" },
        { id: "reports", label: "Reports", icon: AlertTriangle, href: "/admin/reports" },
        { id: "analytics", label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
        { id: "notifications", label: "Notifications", icon: Bell, href: "/admin/notifications" },
        { id: "rbac", label: "RBAC", icon: UserIcon, href: "/admin/rbac" },
        { id: "policies", label: "Policies", icon: Verified, href: "/admin/policies" },
    ];

    const toggleGroup = (id: AdminGroupId) => {
        setOpenGroups(prev => {
            const next = { ...prev, [id]: !prev[id] };
            if (typeof globalThis !== "undefined" && globalThis.window) {
                globalThis.window.localStorage.setItem("admin_sidebar", JSON.stringify(next));
            }
            return next;
        });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-black text-[#E7E9EA] font-display">
            {/* Sidebar */}
            <aside className="w-[275px] bg-black border-r border-[#2F3336] shrink-0 flex-col hidden md:flex transition-all">
                <div className="px-6 py-5 flex items-center gap-3 mt-2">
                    <div className="w-[30px] h-[30px] bg-[#1D9BF0] rounded-full flex items-center justify-center">
                        <Rocket className="w-[16px] h-[16px] text-white fill-white" />
                    </div>
                    <span className="font-extrabold text-[20px] tracking-[-0.03em] text-[#E7E9EA]">DevAtlas</span>
                </div>

                <nav className="flex-1 mt-6 space-y-3 px-3 text-[14px]">
                    {groups.map(group => {
                        const Icon = group.icon;
                        const isOpen = openGroups[group.id];
                        const isActive = pathname === group.href || pathname.startsWith(group.href + "/");
                        return (
                            <div key={group.id}>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.id)}
                                    className={`flex w-full items-center justify-between px-4 py-2 rounded-full text-[13px] font-semibold ${
                                        isActive ? "bg-[#333639] text-[#E7E9EA]" : "text-[#E7E9EA] hover:bg-[#16181C]"
                                    }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-5 h-5 text-[#71767B]">
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        {group.label}
                                    </span>
                                    <span className="text-[#71767B] text-xs">
                                        {isOpen ? "−" : "+"}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="mt-1 space-y-1">
                                        <Link
                                            href={group.href}
                                            className={`flex items-center justify-between px-6 py-1.5 rounded-full text-[13px] transition-colors ${
                                                isActive
                                                    ? "bg-[#333639] text-[#E7E9EA] font-semibold"
                                                    : "text-[#9CA3AF] hover:bg-[#16181C]"
                                            }`}
                                        >
                                            <span>{group.label}</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className="p-3 mb-4 space-y-2 relative">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="w-full flex items-center justify-between px-4 py-3.5 bg-[#16181C] hover:bg-[#2F3336] transition-colors rounded-full cursor-pointer outline-none"
                    >
                        <div className="flex items-center gap-1.5 text-[#E7E9EA]">
                            <div className="flex items-center justify-center w-8 text-[#71767B]">
                                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </div>
                            <span className="text-[15px] font-bold text-[#E7E9EA]">Dark Mode</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isDarkMode ? 'bg-[#1D9BF0]' : 'bg-[#333639]'}`}>
                            <div className={`absolute top-1 bg-white rounded-full w-3 h-3 transition-all duration-200 ${isDarkMode ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </button>

                    <Link
                        href="/admin/settings"
                        className="flex items-center px-4 py-3.5 text-[15px] font-semibold text-[#E7E9EA] hover:bg-[#16181C] transition-colors rounded-full"
                    >
                        <div className="flex items-center justify-center w-8 mr-1.5">
                            <Settings className="w-[20px] h-[20px] text-[#71767B]" strokeWidth={2} />
                        </div>
                        System Settings
                    </Link>
                    <button
                        type="button"
                        onClick={() => logout()}
                        className="w-full flex items-center px-4 py-3.5 text-[15px] font-semibold text-[#F97070] hover:bg-[#2F3336] transition-colors rounded-full"
                    >
                        <div className="flex items-center justify-center w-8 mr-1.5">
                            <LogOut className="w-[20px] h-[20px]" />
                        </div>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
                {/* Top Navbar Header Removed or Minimized based on screenshot */}
                <header className="h-[60px] bg-black flex items-center justify-end px-6 shrink-0 lg:hidden">
                    <button className="md:hidden p-2 text-[#E7E9EA]">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-auto p-0 border-l border-[#2F3336]">
                    {children}
                </main>
            </div>
        </div>
    );
}
