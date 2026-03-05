"use client";

import React from "react";
import { AlertTriangle, Flag, Shield, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ReportsVariant = "SPAM" | "ABUSE" | "POLICY" | "COMMUNITY";

const VARIANT_META: Record<
    ReportsVariant,
    { title: string; subtitle: string; accent: string; icon: React.ElementType }
> = {
    SPAM: {
        title: "Spam Reports",
        subtitle: "Automation-detected and user-reported spam activity",
        accent: "text-[#F97316]",
        icon: Flag,
    },
    ABUSE: {
        title: "Abuse Reports",
        subtitle: "Harassment, threats, and targeted abuse reports",
        accent: "text-[#F91880]",
        icon: AlertTriangle,
    },
    POLICY: {
        title: "Policy Violations",
        subtitle: "Content that may violate platform policies",
        accent: "text-[#1D9BF0]",
        icon: Shield,
    },
    COMMUNITY: {
        title: "Community Flags",
        subtitle: "Community-driven content quality and conduct flags",
        accent: "text-[#A855F7]",
        icon: Users,
    },
};

type MockReportRow = {
    id: string;
    type: string;
    postPreview: string;
    reportsCount: number;
    status: string;
    reporter: string;
};

const MOCK_REPORTS: MockReportRow[] = [
    {
        id: "1",
        type: "Spam",
        postPreview: "🔥 EARN $5000 A DAY FROM HOME! Click here...",
        reportsCount: 14,
        status: "PENDING",
        reporter: "@frontendDev",
    },
    {
        id: "2",
        type: "Abuse",
        postPreview: "You are absolutely useless and should quit coding...",
        reportsCount: 6,
        status: "UNDER_REVIEW",
        reporter: "@kindUser",
    },
    {
        id: "3",
        type: "Policy",
        postPreview: "Here is how to bypass login throttling in production systems...",
        reportsCount: 3,
        status: "ESCALATED",
        reporter: "@securityPro",
    },
    {
        id: "4",
        type: "Community",
        postPreview: "This content seems off-topic for this community...",
        reportsCount: 2,
        status: "RESOLVED",
        reporter: "@communityMod",
    },
];

function ReportsView({ variant }: { readonly variant: ReportsVariant }) {
    const meta = VARIANT_META[variant];
    const Icon = meta.icon;

    // Map frontend variants to backend schema categories
    const categoryMap: Record<ReportsVariant, string> = {
        SPAM: "SPAM",
        ABUSE: "HARASSMENT",
        POLICY: "INAPPROPRIATE",
        COMMUNITY: "OTHER",
    };

    const reportsQuery = trpc.moderation.getReportQueue.useQuery({
        limit: 50,
        category: categoryMap[variant],
    });

    const reports = reportsQuery.data ?? [];

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${meta.accent}`} />
                        <h1 className="text-[20px] font-bold tracking-[-0.02em]">{meta.title}</h1>
                    </div>
                    <p className="text-[13px] text-[#71767B] mt-0.5">{meta.subtitle}</p>
                </div>
                <div className="flex items-center gap-4">
                    {reportsQuery.isFetching && <span className="text-[12px] text-primary animate-pulse">Updating...</span>}
                    <span className="text-[12px] text-[#71767B]">
                        {reports.length} open items
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="rounded-xl border border-[#2F3336] bg-[#111827] overflow-hidden">
                    <div className="grid grid-cols-12 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280] border-b border-[#2F3336]">
                        <span className="col-span-5">Post</span>
                        <span className="col-span-2">Type</span>
                        <span className="col-span-2">Priority</span>
                        <span className="col-span-2">Status</span>
                        <span className="col-span-1 text-right">Author</span>
                    </div>
                    <div className="divide-y divide-[#1F2937]">
                        {reportsQuery.isLoading ? (
                            [1, 2, 3].map((i) => (
                                <div key={i} className="px-4 py-6 border-b border-[#2F3336] animate-pulse">
                                    <div className="h-4 bg-gray-700/50 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-700/50 rounded w-1/4"></div>
                                </div>
                            ))
                        ) : reports.map((row: any) => (
                            <div
                                key={row.id}
                                className="grid grid-cols-12 px-4 py-3 text-[13px] hover:bg-[#111827]/80 transition-colors cursor-pointer group"
                            >
                                <div className="col-span-5 pr-4 text-[#E5E7EB] truncate group-hover:text-primary transition-colors">
                                    {row.content || "No content preview"}
                                </div>
                                <div className="col-span-2 text-[#9CA3AF]">{row.category}</div>
                                <div className="col-span-2 text-[#FBBF24] font-semibold">
                                    P{row.priority}
                                </div>
                                <div className="col-span-2">
                                    {(() => {
                                        let badgeClass = "bg-[#10B981]/10 text-[#6EE7B7]";
                                        if (row.status === "PENDING") {
                                            badgeClass = "bg-[#F97316]/10 text-[#FBBF24]";
                                        } else if (row.status === "UNDER_REVIEW") {
                                            badgeClass = "bg-[#3B82F6]/10 text-[#60A5FA]";
                                        } else if (row.status === "ESCALATED") {
                                            badgeClass = "bg-[#EC4899]/10 text-[#F472B6]";
                                        }

                                        return (
                                            <span
                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                                            >
                                                {row.status.replace("_", " ")}
                                            </span>
                                        );
                                    })()}
                                </div>
                                <div className="col-span-1 text-right text-[#9CA3AF] truncate">
                                    @{row.authorName || "system"}
                                </div>
                            </div>
                        ))}
                        {!reportsQuery.isLoading && reports.length === 0 && (
                            <div className="px-4 py-12 text-center text-[#6B7280]">
                                <Icon className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-[13px] font-medium">Clear queue! No {meta.title.toLowerCase()} found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ModeratorReportsSpam() {
    return <ReportsView variant="SPAM" />;
}

export function ModeratorReportsAbuse() {
    return <ReportsView variant="ABUSE" />;
}

export function ModeratorReportsPolicy() {
    return <ReportsView variant="POLICY" />;
}

export function ModeratorReportsCommunityFlags() {
    return <ReportsView variant="COMMUNITY" />;
}

