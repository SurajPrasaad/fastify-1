"use client";

import React, { useState } from "react";
import { Clock, Search } from "lucide-react";

const ActionBadge = ({ action }: { action: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        APPROVE: { bg: "bg-[#00BA7C]/10", text: "text-[#00BA7C]", label: "Approved" },
        REJECT: { bg: "bg-[#F91880]/10", text: "text-[#F91880]", label: "Rejected" },
        REQUEST_REVISION: { bg: "bg-[#FFD400]/10", text: "text-[#FFD400]", label: "Revision Requested" },
        ESCALATE: { bg: "bg-[#8247E5]/10", text: "text-[#8247E5]", label: "Escalated" },
        REMOVE: { bg: "bg-[#F91880]/10", text: "text-[#F91880]", label: "Removed" },
        RESTORE: { bg: "bg-[#00BA7C]/10", text: "text-[#00BA7C]", label: "Restored" },
    };
    const c = config[action] || { bg: "bg-[#71767B]/10", text: "text-[#71767B]", label: action };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
            {c.label}
        </span>
    );
};

const MOCK_HISTORY = [
    { id: "1", action: "APPROVE", postContent: "Just discovered an amazing approach to building GraphQL APIs...", authorUsername: "devJohn", reason: "Content is educational and valuable", createdAt: new Date(Date.now() - 120000).toISOString() },
    { id: "2", action: "REJECT", postContent: "🔥 EARN $5000 A DAY FROM HOME! Click here...", authorUsername: "spammer42", reason: "Spam content promoting scams", createdAt: new Date(Date.now() - 300000).toISOString() },
    { id: "3", action: "REQUEST_REVISION", postContent: "How to bypass security in web applications...", authorUsername: "securityNoob", reason: "Content needs to be framed as defensive security education", createdAt: new Date(Date.now() - 600000).toISOString() },
    { id: "4", action: "APPROVE", postContent: "Building scalable microservices with Go and gRPC...", authorUsername: "goMaster", reason: "High-quality technical content", createdAt: new Date(Date.now() - 900000).toISOString() },
    { id: "5", action: "ESCALATE", postContent: "Political commentary that references platform policies...", authorUsername: "blogger99", reason: "Needs admin review — policy edge case", createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: "6", action: "APPROVE", postContent: "My journey from bootcamp to senior engineer in 3 years...", authorUsername: "careerDev", reason: "Inspiring and community-appropriate", createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "7", action: "REJECT", postContent: "NSFW content disguised as art discussion...", authorUsername: "artLover", reason: "Violates community guidelines on explicit content", createdAt: new Date(Date.now() - 5400000).toISOString() },
    { id: "8", action: "REMOVE", postContent: "User doxxing another community member...", authorUsername: "angryUser", reason: "Privacy violation — personal information exposed", createdAt: new Date(Date.now() - 7200000).toISOString() },
];

function timeAgo(createdAt: string): string {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

interface HistoryProps {
    readonly initialFilter?: "ALL" | "APPROVE" | "REJECT" | "REQUEST_REVISION" | "ESCALATE";
}

import { trpc } from "@/lib/trpc";

function ModeratorHistoryView({ initialFilter = "ALL" }: HistoryProps) {
    const [filterAction, setFilterAction] = useState<string>(initialFilter);
    const [searchQuery, setSearchQuery] = useState("");

    const historyQuery = trpc.moderation.getModeratorHistory.useQuery({
        limit: 50,
        action: filterAction,
    });

    const items = historyQuery.data ?? [];

    const filtered = items.filter((item: any) => {
        if (searchQuery && !item.post?.content?.toLowerCase().includes(searchQuery.toLowerCase()) && !item.author?.username?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            {/* HEADER */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em]">Moderation History</h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">Your recent moderation decisions</p>
                </div>
                {historyQuery.isFetching && <span className="text-xs text-primary animate-pulse">Syncing...</span>}
            </div>

            {/* FILTERS */}
            <div className="px-6 py-3 border-b border-[#2F3336] flex items-center gap-3 bg-black shrink-0">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71767B]" />
                    <input
                        type="text"
                        placeholder="Search local results..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#16181C] border border-[#2F3336] rounded-lg pl-9 pr-3 py-2 text-[14px] text-[#E7E9EA] placeholder:text-[#71767B] focus:border-[#1D9BF0] focus:outline-none"
                    />
                </div>
                <div className="flex bg-[#16181C] border border-[#2F3336] rounded-lg p-1">
                    {["ALL", "APPROVE", "REJECT", "REQUEST_REVISION", "ESCALATE"].map(
                        (action) => {
                            let label = action.charAt(0) + action.slice(1).toLowerCase();
                            if (action === "ALL") label = "All";
                            if (action === "REQUEST_REVISION") label = "Revision";

                            const isActive = filterAction === action;

                            return (
                                <button
                                    key={action}
                                    onClick={() => setFilterAction(action)}
                                    className={`px-2.5 py-1 text-[11px] font-bold rounded transition-colors ${isActive
                                            ? "bg-[#333639] text-[#E7E9EA]"
                                            : "text-[#71767B] hover:text-[#E7E9EA]"
                                        }`}
                                >
                                    {label}
                                </button>
                            );
                        }
                    )}
                </div>
            </div>

            {/* HISTORY LIST */}
            <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-[#2F3336]">
                    {historyQuery.isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="px-6 py-8 border-b border-[#2F3336] animate-pulse">
                                <div className="h-3 bg-gray-800 rounded w-24 mb-3"></div>
                                <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                                <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                            </div>
                        ))
                    ) : filtered.map((item: any) => (
                        <div key={item.id} className="px-6 py-4 hover:bg-[#16181C]/50 transition-colors cursor-default">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <ActionBadge action={item.action} />
                                        <span className="text-[12px] text-[#71767B] font-mono">{timeAgo(item.createdAt)}</span>
                                    </div>
                                    <p className="text-[14px] text-[#E7E9EA] line-clamp-2">{item.post?.content || "No content"}</p>
                                    <p className="text-[12px] text-[#1D9BF0] mt-1 font-medium">by @{item.author?.username || "unknown"}</p>
                                    <div className="mt-2 flex items-start gap-2 bg-[#16181C] p-2 rounded border border-[#2F3336]">
                                        <span className="text-[11px] text-[#71767B] font-bold uppercase tracking-wide shrink-0 mt-0.5">Note:</span>
                                        <p className="text-[12px] text-[#E7E9EA]/80 whitespace-pre-wrap">{item.reason || "No justification provided"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {!historyQuery.isLoading && filtered.length === 0 && (
                        <div className="px-6 py-16 text-center text-[#71767B]">
                            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-[14px] font-bold">No history found</p>
                            <p className="text-[12px]">Try adjusting your filters or search query</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ModeratorHistory() {
    return <ModeratorHistoryView />;
}

export function ModeratorHistoryApproved() {
    return <ModeratorHistoryView initialFilter="APPROVE" />;
}

export function ModeratorHistoryRejected() {
    return <ModeratorHistoryView initialFilter="REJECT" />;
}

export function ModeratorHistoryRequestedChanges() {
    return <ModeratorHistoryView initialFilter="REQUEST_REVISION" />;
}
