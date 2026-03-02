"use client";

import React, { useState, useEffect } from "react";
import {
    Shield, CheckCircle2, XCircle, Clock, AlertTriangle,
    TrendingUp, TrendingDown, Eye, Lock, Unlock,
    ChevronRight, BarChart3, Users, FileText, Activity
} from "lucide-react";

// ==========================================
// TYPES
// ==========================================

type DateRange = "24h" | "7d" | "30d";

const MOCK_STATS = {
    pendingCount: 847,
    approvedToday: 1234,
    rejectedToday: 89,
    avgReviewTime: "2m 14s",
    slaCompliance: "98.4%",
    queueVelocity: "+12%",
};

const RECENT_ACTIONS = [
    { id: "1", action: "APPROVE", postPreview: "New React hooks tutorial for beginners...", time: "2m ago", author: "devJohn" },
    { id: "2", action: "REJECT", postPreview: "Buy followers now! Best prices guaranteed...", time: "5m ago", author: "spammer42" },
    { id: "3", action: "REQUEST_REVISION", postPreview: "How to hack into any website easily...", time: "8m ago", author: "newbie_dev" },
    { id: "4", action: "APPROVE", postPreview: "Building scalable microservices with Go...", time: "12m ago", author: "goMaster" },
    { id: "5", action: "ESCALATE", postPreview: "Political content that may violate policies...", time: "15m ago", author: "blogger99" },
];

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const StatCard = ({ title, value, change, icon: Icon, colorClass, accentBg }: any) => (
    <div className="bg-[#16181C] p-5 rounded-xl border border-[#2F3336] hover:border-[#71767B]/50 transition-all group relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
            <span className="text-[#71767B] font-semibold text-[13px] uppercase tracking-wide">{title}</span>
            <div className={`w-8 h-8 rounded-lg ${accentBg || 'bg-black'} border border-[#2F3336] flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
        <h3 className="text-[28px] font-bold text-[#E7E9EA] tracking-tight leading-none">{value}</h3>
        {change && (
            <div className={`mt-2 text-[12px] font-bold ${change.startsWith('+') || change.startsWith('-') ? (change.startsWith('+') ? 'text-[#00BA7C]' : 'text-[#F91880]') : 'text-[#71767B]'}`}>
                {change}
            </div>
        )}
    </div>
);

const ActionBadge = ({ action }: { action: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        APPROVE: { bg: "bg-[#00BA7C]/10", text: "text-[#00BA7C]", label: "Approved" },
        REJECT: { bg: "bg-[#F91880]/10", text: "text-[#F91880]", label: "Rejected" },
        REQUEST_REVISION: { bg: "bg-[#FFD400]/10", text: "text-[#FFD400]", label: "Revision" },
        ESCALATE: { bg: "bg-[#8247E5]/10", text: "text-[#8247E5]", label: "Escalated" },
        REMOVE: { bg: "bg-[#F91880]/10", text: "text-[#F91880]", label: "Removed" },
    };
    const c = config[action] || { bg: "bg-[#71767B]/10", text: "text-[#71767B]", label: action };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text} border border-current/10`}>
            {c.label}
        </span>
    );
};

// ==========================================
// MAIN DASHBOARD
// ==========================================

export default function ModeratorDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>("24h");
    const [time, setTime] = useState("");

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-[100vh] font-display overflow-hidden">

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md z-20 shrink-0 sticky top-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[20px] font-bold tracking-[-0.02em]">Moderation Dashboard</h1>
                        <div className="flex items-center gap-3 mt-1 text-[12px] text-[#71767B] font-mono">
                            <span className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD400] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD400]"></span>
                                </span>
                                QUEUE ACTIVE
                            </span>
                            <span>•</span>
                            <span>{time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-[#16181C] border border-[#2F3336] rounded-md p-1">
                            {(["24h", "7d", "30d"] as DateRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1 text-[12px] font-bold rounded-sm transition-colors ${dateRange === range ? "bg-[#333639] text-[#E7E9EA]" : "text-[#71767B] hover:text-[#E7E9EA]"}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <a
                            href="/moderator/queue"
                            className="flex items-center gap-2 px-4 py-2 bg-[#FFD400] text-black font-bold text-[13px] rounded-full hover:bg-[#FFD400]/90 transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            Open Queue
                        </a>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard title="Pending Queue" value={MOCK_STATS.pendingCount} change="-12% from yesterday" icon={Clock} colorClass="text-[#FFD400]" accentBg="bg-[#FFD400]/5" />
                    <StatCard title="Approved Today" value={MOCK_STATS.approvedToday} change="+8% from avg" icon={CheckCircle2} colorClass="text-[#00BA7C]" accentBg="bg-[#00BA7C]/5" />
                    <StatCard title="Rejected Today" value={MOCK_STATS.rejectedToday} change="-3% from avg" icon={XCircle} colorClass="text-[#F91880]" accentBg="bg-[#F91880]/5" />
                    <StatCard title="Avg Review Time" value={MOCK_STATS.avgReviewTime} change="Within SLA" icon={Activity} colorClass="text-[#1D9BF0]" accentBg="bg-[#1D9BF0]/5" />
                    <StatCard title="SLA Compliance" value={MOCK_STATS.slaCompliance} change="+0.4% this week" icon={BarChart3} colorClass="text-[#8247E5]" accentBg="bg-[#8247E5]/5" />
                    <StatCard title="Queue Velocity" value={MOCK_STATS.queueVelocity} change="Processing faster" icon={TrendingUp} colorClass="text-[#00BA7C]" accentBg="bg-[#00BA7C]/5" />
                </div>

                {/* QUEUE PREVIEW + RECENT ACTIONS */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                    {/* Queue Priority Distribution */}
                    <div className="xl:col-span-2 bg-[#16181C] border border-[#2F3336] rounded-xl p-6">
                        <h3 className="text-[16px] font-bold mb-4">Queue Priority Distribution</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Critical (80+)", count: 12, pct: 1.4, color: "bg-[#F91880]" },
                                { label: "High (60-79)", count: 68, pct: 8.0, color: "bg-[#FFD400]" },
                                { label: "Medium (40-59)", count: 245, pct: 28.9, color: "bg-[#1D9BF0]" },
                                { label: "Low (<40)", count: 522, pct: 61.6, color: "bg-[#71767B]" },
                            ].map((tier) => (
                                <div key={tier.label}>
                                    <div className="flex justify-between text-[13px] mb-1.5">
                                        <span className="text-[#E7E9EA] font-semibold">{tier.label}</span>
                                        <span className="text-[#71767B] font-mono">{tier.count} items</span>
                                    </div>
                                    <div className="h-2 bg-[#2F3336] rounded-full overflow-hidden">
                                        <div className={`h-full ${tier.color} rounded-full transition-all`} style={{ width: `${tier.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 pt-4 border-t border-[#2F3336] flex items-center justify-between">
                            <span className="text-[13px] text-[#71767B]">Total in queue</span>
                            <span className="text-[20px] font-bold text-[#FFD400]">{MOCK_STATS.pendingCount}</span>
                        </div>
                    </div>

                    {/* Recent Actions Feed */}
                    <div className="xl:col-span-3 bg-[#16181C] border border-[#2F3336] rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between">
                            <h3 className="text-[16px] font-bold">Your Recent Actions</h3>
                            <a href="/moderator/history" className="text-[13px] text-[#1D9BF0] font-bold hover:underline flex items-center gap-1">
                                View all <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="divide-y divide-[#2F3336]">
                            {RECENT_ACTIONS.map((item) => (
                                <div key={item.id} className="px-6 py-3.5 hover:bg-black/30 transition-colors flex items-center gap-4">
                                    <ActionBadge action={item.action} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] text-[#E7E9EA] truncate">{item.postPreview}</p>
                                        <p className="text-[12px] text-[#71767B]">by @{item.author}</p>
                                    </div>
                                    <span className="text-[12px] text-[#71767B] font-mono whitespace-nowrap">{item.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS + YOUR METRICS */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* Quick Actions */}
                    <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6">
                        <h3 className="text-[16px] font-bold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Review Queue", desc: "847 items pending", href: "/moderator/queue", icon: Eye, color: "border-[#FFD400]/30 hover:bg-[#FFD400]/5" },
                                { label: "Reports", desc: "23 new reports", href: "/moderator/reports", icon: AlertTriangle, color: "border-[#F91880]/30 hover:bg-[#F91880]/5" },
                                { label: "My History", desc: "View your actions", href: "/moderator/history", icon: FileText, color: "border-[#1D9BF0]/30 hover:bg-[#1D9BF0]/5" },
                                { label: "Guidelines", desc: "Moderation policies", href: "/moderator/guidelines", icon: Shield, color: "border-[#8247E5]/30 hover:bg-[#8247E5]/5" },
                            ].map((action) => (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className={`flex items-center gap-3 p-4 rounded-xl border ${action.color} transition-all`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-black border border-[#2F3336] flex items-center justify-center">
                                        <action.icon className="w-5 h-5 text-[#71767B]" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-bold text-[#E7E9EA]">{action.label}</p>
                                        <p className="text-[12px] text-[#71767B]">{action.desc}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Your Performance */}
                    <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6">
                        <h3 className="text-[16px] font-bold mb-4">Your Performance (Today)</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Posts Reviewed", value: "127", target: "150", pct: 84.7 },
                                { label: "Avg Decision Time", value: "1m 42s", target: "3m", pct: 95 },
                                { label: "Accuracy Rate", value: "99.2%", target: "98%", pct: 100 },
                                { label: "Escalation Rate", value: "2.1%", target: "<5%", pct: 42 },
                            ].map((metric) => (
                                <div key={metric.label}>
                                    <div className="flex justify-between text-[13px] mb-1">
                                        <span className="text-[#E7E9EA] font-semibold">{metric.label}</span>
                                        <span className="text-[#71767B]">
                                            <span className="text-[#E7E9EA] font-bold">{metric.value}</span> / {metric.target}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-[#2F3336] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${metric.pct >= 90 ? 'bg-[#00BA7C]' : metric.pct >= 70 ? 'bg-[#1D9BF0]' : 'bg-[#FFD400]'}`}
                                            style={{ width: `${Math.min(metric.pct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
