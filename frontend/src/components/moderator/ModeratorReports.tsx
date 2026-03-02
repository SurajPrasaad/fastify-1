"use client";

import React from "react";
import { AlertTriangle, Flag, Shield, Users } from "lucide-react";

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

    const filtered = MOCK_REPORTS.filter((row) => {
        switch (variant) {
            case "SPAM":
                return row.type === "Spam";
            case "ABUSE":
                return row.type === "Abuse";
            case "POLICY":
                return row.type === "Policy";
            case "COMMUNITY":
                return row.type === "Community";
            default:
                return true;
        }
    });

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
                <span className="text-[12px] text-[#71767B]">
                    {filtered.length} open items · mock data
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="rounded-xl border border-[#2F3336] bg-[#111827] overflow-hidden">
                    <div className="grid grid-cols-12 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6B7280] border-b border-[#2F3336]">
                        <span className="col-span-5">Post</span>
                        <span className="col-span-2">Type</span>
                        <span className="col-span-2">Reports</span>
                        <span className="col-span-2">Status</span>
                        <span className="col-span-1 text-right">Reporter</span>
                    </div>
                    <div className="divide-y divide-[#1F2937]">
                        {filtered.map((row) => (
                            <div
                                key={row.id}
                                className="grid grid-cols-12 px-4 py-3 text-[13px] hover:bg-[#111827]/80 transition-colors"
                            >
                                <div className="col-span-5 pr-4 text-[#E5E7EB] truncate">
                                    {row.postPreview}
                                </div>
                                <div className="col-span-2 text-[#9CA3AF]">{row.type}</div>
                                <div className="col-span-2 text-[#FBBF24] font-semibold">
                                    {row.reportsCount} reports
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
                                <div className="col-span-1 text-right text-[#9CA3AF]">
                                    {row.reporter}
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-4 py-8 text-center text-[#6B7280] text-[13px]">
                                No mock data for this category yet.
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

