"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    AlertTriangle,
    Menu,
    Rocket,
    LogOut,
    ChevronDown,
} from "lucide-react";
import { useCurrentUser } from "../../features/auth/hooks";
import { useAuth } from "@/features/auth/components/AuthProvider";

export default function ModeratorLayout({ children }: { readonly children: React.ReactNode }) {
    const { data: user, isLoading } = useCurrentUser();
    const { logout, user: authUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [openSections, setOpenSections] = useState({
        queue: false,
        reports: false,
        history: false,
        risk: false,
    });

    const isModeratorLike =
        user && (user.auth.role === "MODERATOR" || user.auth.role === "SUPER_ADMIN");

    useEffect(() => {
        if (!isLoading && !isModeratorLike) {
            router.replace("/");
        }
    }, [isModeratorLike, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD400]"></div>
            </div>
        );
    }

    if (!isModeratorLike) {
        return null;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-black text-[#E7E9EA] font-display">
            <aside className="w-[260px] bg-black border-r border-[#2F3336] shrink-0 flex-col hidden md:flex transition-all">
                <div className="px-6 py-5 flex items-center gap-3 mt-2">
                    <div className="w-[30px] h-[30px] bg-[#FFD400] rounded-full flex items-center justify-center">
                        <Rocket className="w-[16px] h-[16px] text-black fill-black" />
                    </div>
                    <span className="font-extrabold text-[20px] tracking-[-0.03em] text-[#E7E9EA]">
                        Mod Console
                    </span>
                </div>

                <nav className="flex-1 mt-6 space-y-4 px-3 text-[14px]">
                    {/* Dashboard */}
                    <div>
                        <Link
                            href="/moderator"
                            className={`flex items-center px-4 py-3.5 rounded-full transition-colors ${
                                pathname === "/moderator"
                                    ? "bg-[#333639] text-[#E7E9EA] font-bold"
                                    : "text-[#E7E9EA] hover:bg-[#16181C] font-semibold"
                            }`}
                        >
                            <div className="flex items-center justify-center w-8 mr-1.5">
                                <LayoutDashboard
                                    className={`w-[20px] h-[20px] ${
                                        pathname === "/moderator" ? "text-[#E7E9EA]" : "text-[#71767B]"
                                    }`}
                                    strokeWidth={pathname === "/moderator" ? 2.5 : 2}
                                />
                            </div>
                            Dashboard
                        </Link>
                    </div>

                    {/* Moderation Queue */}
                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenSections((prev) => ({ ...prev, queue: !prev.queue }))
                            }
                            className="flex w-full items-center justify-between px-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71767B] hover:text-[#E7E9EA]"
                        >
                            <span>Moderation Queue</span>
                            <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                    openSections.queue ? "rotate-0" : "-rotate-90"
                                }`}
                            />
                        </button>
                        {openSections.queue && (
                            <div className="space-y-1">
                                <SidebarSubLink
                                    href="/moderator/queue"
                                    label="All Pending"
                                    isActive={pathname === "/moderator/queue"}
                                />
                                <SidebarSubLink
                                    href="/moderator/queue/high-risk"
                                    label="High Risk"
                                    isActive={pathname.startsWith("/moderator/queue/high-risk")}
                                />
                                <SidebarSubLink
                                    href="/moderator/queue/low-risk"
                                    label="Low Risk"
                                    isActive={pathname.startsWith("/moderator/queue/low-risk")}
                                />
                                <SidebarSubLink
                                    href="/moderator/queue/auto-flagged"
                                    label="Auto-Flagged"
                                    isActive={pathname.startsWith("/moderator/queue/auto-flagged")}
                                />
                                <SidebarSubLink
                                    href="/moderator/queue/user-reported"
                                    label="User Reported"
                                    isActive={pathname.startsWith("/moderator/queue/user-reported")}
                                />
                                <SidebarSubLink
                                    href="/moderator/queue/escalated"
                                    label="Escalated Cases"
                                    isActive={pathname.startsWith("/moderator/queue/escalated")}
                                />
                            </div>
                        )}
                    </div>

                    {/* Reports */}
                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenSections((prev) => ({ ...prev, reports: !prev.reports }))
                            }
                            className="flex w-full items-center justify-between px-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71767B] hover:text-[#E7E9EA]"
                        >
                            <span>Reports</span>
                            <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                    openSections.reports ? "rotate-0" : "-rotate-90"
                                }`}
                            />
                        </button>
                        {openSections.reports && (
                            <div className="space-y-1">
                                <SidebarSubLink
                                    href="/moderator/reports/spam"
                                    label="Spam Reports"
                                    isActive={pathname.startsWith("/moderator/reports/spam")}
                                />
                                <SidebarSubLink
                                    href="/moderator/reports/abuse"
                                    label="Abuse Reports"
                                    isActive={pathname.startsWith("/moderator/reports/abuse")}
                                />
                                <SidebarSubLink
                                    href="/moderator/reports/policy"
                                    label="Policy Violations"
                                    isActive={pathname.startsWith("/moderator/reports/policy")}
                                />
                                <SidebarSubLink
                                    href="/moderator/reports/community-flags"
                                    label="Community Flags"
                                    isActive={pathname.startsWith(
                                        "/moderator/reports/community-flags"
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* Review History */}
                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenSections((prev) => ({ ...prev, history: !prev.history }))
                            }
                            className="flex w-full items-center justify-between px-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71767B] hover:text-[#E7E9EA]"
                        >
                            <span>Review History</span>
                            <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                    openSections.history ? "rotate-0" : "-rotate-90"
                                }`}
                            />
                        </button>
                        {openSections.history && (
                            <div className="space-y-1">
                                <SidebarSubLink
                                    href="/moderator/history/approved"
                                    label="Approved"
                                    isActive={pathname.startsWith("/moderator/history/approved")}
                                />
                                <SidebarSubLink
                                    href="/moderator/history/rejected"
                                    label="Rejected"
                                    isActive={pathname.startsWith("/moderator/history/rejected")}
                                />
                                <SidebarSubLink
                                    href="/moderator/history/requested-changes"
                                    label="Requested Changes"
                                    isActive={pathname.startsWith(
                                        "/moderator/history/requested-changes"
                                    )}
                                />
                                <SidebarSubLink
                                    href="/moderator/history"
                                    label="My Activity Log"
                                    isActive={pathname === "/moderator/history"}
                                />
                            </div>
                        )}
                    </div>

                    {/* Risk & Safety */}
                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                setOpenSections((prev) => ({ ...prev, risk: !prev.risk }))
                            }
                            className="flex w-full items-center justify-between px-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71767B] hover:text-[#E7E9EA]"
                        >
                            <span>Risk &amp; Safety</span>
                            <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                    openSections.risk ? "rotate-0" : "-rotate-90"
                                }`}
                            />
                        </button>
                        {openSections.risk && (
                            <div className="space-y-1">
                                <SidebarSubLink
                                    href="/moderator/risk/ai-scores"
                                    label="AI Risk Scores"
                                    isActive={pathname.startsWith("/moderator/risk/ai-scores")}
                                />
                                <SidebarSubLink
                                    href="/moderator/risk/sensitive-content"
                                    label="Sensitive Content"
                                    isActive={pathname.startsWith(
                                        "/moderator/risk/sensitive-content"
                                    )}
                                />
                                <SidebarSubLink
                                    href="/moderator/risk/repeat-offenders"
                                    label="Repeat Offenders"
                                    isActive={pathname.startsWith(
                                        "/moderator/risk/repeat-offenders"
                                    )}
                                />
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    <div>
                        <Link
                            href="/moderator/notifications"
                            className={`flex items-center px-4 py-3.5 rounded-full transition-colors ${
                                pathname.startsWith("/moderator/notifications")
                                    ? "bg-[#333639] text-[#E7E9EA] font-bold"
                                    : "text-[#E7E9EA] hover:bg-[#16181C] font-semibold"
                            }`}
                        >
                            <div className="flex items-center justify-center w-8 mr-1.5">
                                <AlertTriangle
                                    className={`w-[20px] h-[20px] ${
                                        pathname.startsWith("/moderator/notifications")
                                            ? "text-[#E7E9EA]"
                                            : "text-[#71767B]"
                                    }`}
                                    strokeWidth={pathname.startsWith("/moderator/notifications") ? 2.5 : 2}
                                />
                            </div>
                            Notifications
                        </Link>
                    </div>

                    {/* Profile */}
                    <div>
                        <p className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#71767B]">
                            Profile
                        </p>
                        <div className="space-y-1">
                            <SidebarSubLink
                                href={`/${authUser?.username ?? ""}`}
                                label="My Profile"
                                isActive={pathname === `/${authUser?.username ?? ""}`}
                            />
                            <button
                                type="button"
                                onClick={() => logout()}
                                className="w-full flex items-center justify-between px-4 py-2 text-[13px] rounded-full text-[#F97070] hover:bg-[#2F3336] transition-colors"
                            >
                                <span>Logout</span>
                                <LogOut className="w-[16px] h-[16px]" />
                            </button>
                        </div>
                    </div>
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
                                isDarkMode ? "bg-[#FFD400]" : "bg-[#333639]"
                            }`}
                        >
                            <div
                                className={`absolute top-1 bg-white rounded-full w-3 h-3 transition-all duration-200 ${
                                    isDarkMode ? "right-1" : "left-1"
                                }`}
                            ></div>
                        </div>
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

function SidebarSubLink({
    href,
    label,
    isActive,
}: {
    readonly href: string;
    readonly label: string;
    readonly isActive: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center justify-between px-4 py-2 rounded-full text-[13px] transition-colors ${
                isActive ? "bg-[#333639] text-[#E7E9EA] font-semibold" : "text-[#9CA3AF] hover:bg-[#16181C]"
            }`}
        >
            <span>{label}</span>
        </Link>
    );
}
