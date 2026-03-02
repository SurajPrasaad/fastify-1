"use client";

import React from "react";
import { Bell, CheckCircle2, AlertTriangle } from "lucide-react";

const MOCK_NOTIFICATIONS = [
    {
        id: "1",
        type: "QUEUE",
        title: "New high-risk items in queue",
        body: "12 posts exceeded the critical risk threshold in the last 10 minutes.",
        time: "2m ago",
    },
    {
        id: "2",
        type: "REPORT",
        title: "Abuse report volume elevated",
        body: "Abuse reports increased by 34% compared to previous hour.",
        time: "15m ago",
    },
    {
        id: "3",
        type: "SYSTEM",
        title: "Moderation SLAs healthy",
        body: "Average decision time is within the configured target.",
        time: "30m ago",
    },
];

export default function ModeratorNotifications() {
    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#1D9BF0]" />
                    <h1 className="text-[20px] font-bold tracking-[-0.02em]">Moderator Notifications</h1>
                </div>
                <button className="text-[12px] font-semibold text-[#22C55E] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Mark all as read
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {MOCK_NOTIFICATIONS.map((n) => (
                    <div
                        key={n.id}
                        className="flex items-start gap-3 rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3"
                    >
                        <div className="mt-1">
                            {n.type === "SYSTEM" ? (
                                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                            ) : (
                                <AlertTriangle className="w-4 h-4 text-[#F97316]" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[14px] font-semibold">{n.title}</p>
                                <span className="text-[11px] text-[#9CA3AF]">{n.time}</span>
                            </div>
                            <p className="text-[13px] text-[#D1D5DB] mt-0.5">{n.body}</p>
                        </div>
                    </div>
                ))}
                {MOCK_NOTIFICATIONS.length === 0 && (
                    <div className="text-center text-[#6B7280] text-[13px] py-12">
                        No notifications right now.
                    </div>
                )}
            </div>
        </div>
    );
}

