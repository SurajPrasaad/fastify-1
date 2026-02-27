"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, FileText, AlertTriangle,
    BarChart3, Settings, Bell, Menu, Search,
    Rocket, User as UserIcon,
    Verified
} from "lucide-react";

import { useCurrentUser } from "@/features/auth/hooks";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: user, isLoading } = useCurrentUser();
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        if (!isLoading && (!user || user.auth.role !== 'ADMIN')) {
            router.replace("/");
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D9BF0]"></div>
            </div>
        );
    }

    if (!user || user.auth.role !== 'ADMIN') {
        return null;
    }

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Posts", href: "/admin/posts", icon: FileText },
        { name: "Reports", href: "/admin/reports", icon: AlertTriangle },
        { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        // { name: "Monitoring", href: "/admin/monitoring", icon: BarChart3 },
        { name: "Notifications", href: "/admin/notifications", icon: Bell },
        { name: "RBAC", href: "/admin/rbac", icon: UserIcon },
        { name: "Policies", href: "/admin/policies", icon: Verified }

    ];

    return (
        <div className="flex h-screen overflow-hidden bg-black text-[#E7E9EA] font-display">
            {/* Sidebar (Dark Mode) */}
            <aside className="w-[275px] bg-black border-r border-[#2F3336] flex-shrink-0 flex-col hidden md:flex transition-all">
                <div className="px-6 py-5 flex items-center gap-3 mt-2">
                    <div className="w-[30px] h-[30px] bg-[#1D9BF0] rounded-full flex items-center justify-center">
                        <Rocket className="w-[16px] h-[16px] text-white fill-white" />
                    </div>
                    <span className="font-[800] text-[20px] tracking-[-0.03em] text-[#E7E9EA]">DevAtlas</span>
                </div>

                <nav className="flex-1 mt-6 space-y-2 px-3">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3.5 text-[15px] transition-colors rounded-full ${isActive
                                    ? "bg-[#333639] text-[#E7E9EA] font-bold"
                                    : "text-[#E7E9EA] hover:bg-[#16181C] font-semibold"
                                    }`}
                            >
                                <div className="flex items-center justify-center w-8 mr-1.5">
                                    <item.icon className={`w-[20px] h-[20px] ${isActive ? "text-[#E7E9EA]" : "text-[#71767B]"}`} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {item.name}
                            </Link>
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
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
                {/* Top Navbar Header Removed or Minimized based on screenshot */}
                <header className="h-[60px] bg-black flex items-center justify-end px-6 flex-shrink-0 lg:hidden">
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
