"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    BarChart3,
    Settings,
    Bell,
    Menu,
    Rocket,
    User as UserIcon,
    LogOut,
    Shield,
    ShieldAlert,
} from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks";
import { useAuth } from "@/features/auth/components/AuthProvider";

type GroupId =
    | "dashboard"
    | "users"
    | "moderators"
    | "content"
    | "oversight"
    | "risk"
    | "reports"
    | "security"
    | "settings"
    | "notifications"
    | "profile";

export default function SuperAdminLayout({
    children,
}: {
    readonly children: React.ReactNode;
}) {
    const { data: user, isLoading } = useCurrentUser();
    const { logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [openGroups, setOpenGroups] = useState<Record<GroupId, boolean>>(() => {
        if (typeof globalThis === "undefined" || !globalThis.window) return {
            dashboard: true,
            users: false,
            moderators: false,
            content: false,
            oversight: false,
            risk: false,
            reports: false,
            security: false,
            settings: false,
            notifications: false,
            profile: false,
        };
        try {
            return JSON.parse(
                globalThis.window.localStorage.getItem("superadmin_sidebar") ||
                '{"dashboard":true}'
            );
        } catch {
            return { dashboard: true } as Record<GroupId, boolean>;
        }
    });

    const isSuperAdmin = user?.auth.role === "SUPER_ADMIN";

    useEffect(() => {
        if (!isLoading && !isSuperAdmin) {
            router.replace("/");
        }
    }, [isSuperAdmin, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1D9BF0]"></div>
            </div>
        );
    }

    if (!isSuperAdmin) {
        return null;
    }

    const groups: {
        id: GroupId;
        label: string;
        icon: any;
        items: { label: string; href: string; badgeKey?: string; kind?: "danger" }[];
    }[] = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            items: [{ label: "Overview", href: "/super-admin" }],
        },
        {
            id: "users",
            label: "User Management",
            icon: Users,
            items: [
                { label: "All Users", href: "/super-admin/users" },
                { label: "Suspended Users", href: "/super-admin/users/suspended", badgeKey: "suspendedUsers" },
                { label: "Banned Users", href: "/super-admin/users/banned" },
                { label: "User Activity Logs", href: "/super-admin/users/activity-logs" },
                { label: "Role Assignments", href: "/super-admin/users/roles" },
            ],
        },
        {
            id: "moderators",
            label: "Moderator Management",
            icon: Shield,
            items: [
                { label: "All Moderators", href: "/super-admin/moderators" },
                { label: "Performance Metrics", href: "/super-admin/moderators/performance" },
                { label: "Escalated Cases", href: "/super-admin/moderators/escalated", badgeKey: "escalatedCases" },
                { label: "Assign Permissions", href: "/super-admin/moderators/permissions" },
            ],
        },
        {
            id: "content",
            label: "Content Control",
            icon: BarChart3,
            items: [
                { label: "All Posts", href: "/super-admin/content/posts" },
                { label: "Removed Content", href: "/super-admin/content/removed" },
                { label: "Override Decisions", href: "/super-admin/content/overrides" },
                { label: "Appeals", href: "/super-admin/content/appeals" },
                { label: "Archived Content", href: "/super-admin/content/archived" },
            ],
        },
        {
            id: "oversight",
            label: "Moderation Oversight",
            icon: ShieldAlert,
            items: [
                { label: "Live Moderation Queue", href: "/super-admin/oversight/live-queue" },
                { label: "Rejection Trends", href: "/super-admin/oversight/rejection-trends" },
                { label: "Approval Metrics", href: "/super-admin/oversight/approval-metrics" },
                { label: "SLA Monitoring", href: "/super-admin/oversight/sla" },
            ],
        },
        {
            id: "risk",
            label: "Risk & AI Control",
            icon: Shield,
            items: [
                { label: "Risk Threshold Settings", href: "/super-admin/risk/thresholds" },
                { label: "AI Model Scores", href: "/super-admin/risk/ai-scores" },
                { label: "Sensitive Categories", href: "/super-admin/risk/sensitive" },
                { label: "Repeat Offender Tracking", href: "/super-admin/risk/repeat-offenders" },
            ],
        },
        {
            id: "reports",
            label: "Reports & Analytics",
            icon: BarChart3,
            items: [
                { label: "Platform Reports", href: "/super-admin/reports/platform" },
                { label: "Abuse Trends", href: "/super-admin/reports/abuse" },
                { label: "Growth Metrics", href: "/super-admin/reports/growth" },
                { label: "Engagement Metrics", href: "/super-admin/reports/engagement" },
                { label: "Revenue Insights", href: "/super-admin/reports/revenue" },
            ],
        },
        {
            id: "security",
            label: "Security & Compliance",
            icon: ShieldAlert,
            items: [
                { label: "Audit Logs", href: "/super-admin/security/audit-logs" },
                { label: "Admin Activity Logs", href: "/super-admin/security/admin-logs" },
                { label: "Access Control Logs", href: "/super-admin/security/access-logs" },
                { label: "IP Monitoring", href: "/super-admin/security/ip-monitoring" },
                { label: "Data Retention Policies", href: "/super-admin/security/data-retention" },
            ],
        },
        {
            id: "settings",
            label: "System Settings",
            icon: Settings,
            items: [
                { label: "Feature Flags", href: "/super-admin/settings/feature-flags" },
                { label: "Content Policies", href: "/super-admin/settings/policies" },
                { label: "Notification Settings", href: "/super-admin/settings/notifications" },
                { label: "API Management", href: "/super-admin/settings/api" },
                { label: "Environment Configurations", href: "/super-admin/settings/environment" },
            ],
        },
        {
            id: "notifications",
            label: "Notifications",
            icon: Bell,
            items: [{ label: "Inbox", href: "/super-admin/notifications" }],
        },
    
    ];

    const toggleGroup = (id: GroupId) => {
        setOpenGroups(prev => {
            const next = { ...prev, [id]: !prev[id] };
            if (typeof globalThis !== "undefined" && globalThis.window) {
                globalThis.window.localStorage.setItem("superadmin_sidebar", JSON.stringify(next));
            }
            return next;
        });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-black text-[#E7E9EA] font-display">
            <aside className="w-[275px] bg-black border-r border-[#2F3336] shrink-0 flex-col hidden md:flex transition-all">
                <div className="px-6 py-5 flex items-center gap-3 mt-2">
                    <div className="w-[30px] h-[30px] bg-[#1D9BF0] rounded-full flex items-center justify-center">
                        <Rocket className="w-[16px] h-[16px] text-white fill-white" />
                    </div>
                    <span className="font-extrabold text-[20px] tracking-[-0.03em] text-[#E7E9EA]">
                        Super Admin
                    </span>
                </div>

                <nav className="flex-1 mt-6 space-y-3 px-3 text-[14px]">
                    {groups.map(group => {
                        const Icon = group.icon;
                        const isOpen = openGroups[group.id];
                        return (
                            <div key={group.id}>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.id)}
                                    className="flex w-full items-center justify-between px-4 py-2 rounded-full text-[13px] font-semibold text-[#E7E9EA] hover:bg-[#16181C]"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-5 h-5 text-[#71767B]">
                                            <Icon className="w-4 h-4" />
                                        </span>
                                        {group.label}
                                    </span>
                                    <span className="text-[#71767B]">
                                        {isOpen ? "−" : "+"}
                                    </span>
                                </button>
                                {isOpen && (
                                    <div className="mt-1 space-y-1">
                                        {group.items.map(item => {
                                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    className={`flex items-center justify-between px-6 py-1.5 rounded-full text-[13px] transition-colors ${
                                                        isActive
                                                            ? "bg-[#333639] text-[#E7E9EA] font-semibold"
                                                            : "text-[#9CA3AF] hover:bg-[#16181C]"
                                                    }`}
                                                >
                                                    <span className={item.kind === "danger" ? "text-[#F97070]" : ""}>
                                                        {item.label}
                                                    </span>
                                                </Link>
                                            );
                                        })}
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
                                <svg
                                    className="w-[18px] h-[18px]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                    />
                                </svg>
                            </div>
                            <span className="text-[15px] font-bold text-[#E7E9EA]">
                                Dark Mode
                            </span>
                        </div>
                        <div
                            className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
                                isDarkMode ? "bg-[#1D9BF0]" : "bg-[#333639]"
                            }`}
                        >
                            <div
                                className={`absolute top-1 bg-white rounded-full w-3 h-3 transition-all duration-200 ${
                                    isDarkMode ? "right-1" : "left-1"
                                }`}
                            ></div>
                        </div>
                    </button>
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

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
                <header className="h-[60px] bg-black flex items-center justify-end px-6 shrink-0 lg:hidden">
                    <button className="md:hidden p-2 text-[#E7E9EA]">
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-auto p-0 border-l border-[#2F3336]">
                    {children}
                </main>
            </div>
        </div>
    );
}

