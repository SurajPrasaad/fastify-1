"use client";

import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Download,
    Filter,
    Layers3,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    Trash2,
} from "lucide-react";

type PostStatus = "Pending" | "Approved" | "Rejected" | "Removed" | "Archived";
type ContentType = "Text" | "Image" | "Video" | "Link";

interface AllPostRow {
    id: string;
    user: string;
    handle: string;
    avatarColor: string;
    snippet: string;
    type: ContentType;
    status: PostStatus;
    riskScore: number;
    moderatorDecision: "Pending" | "Approved" | "Rejected" | "Escalated";
    likes: number;
    comments: number;
    shares: number;
    postedAt: string;
    lastAction: string;
    escalated: boolean;
    category: string;
}

const MOCK_POSTS: AllPostRow[] = [
    {
        id: "POST-982341",
        user: "Alex Rivera",
        handle: "@alex_r",
        avatarColor: "#38bdf8",
        snippet: "We should really talk about how moderation transparency works...",
        type: "Text",
        status: "Pending",
        riskScore: 72,
        moderatorDecision: "Pending",
        likes: 32,
        comments: 14,
        shares: 3,
        postedAt: "2026-03-02 09:12",
        lastAction: "AI flagged for review",
        escalated: true,
        category: "Policy Discussion",
    },
    {
        id: "POST-982112",
        user: "Jordan Kim",
        handle: "@jk_security",
        avatarColor: "#a855f7",
        snippet: "Buy followers now, instant growth guaranteed! Limited offer: ...",
        type: "Link",
        status: "Removed",
        riskScore: 94,
        moderatorDecision: "Rejected",
        likes: 4,
        comments: 2,
        shares: 1,
        postedAt: "2026-03-01 18:41",
        lastAction: "Super Admin override: removed",
        escalated: true,
        category: "Spam",
    },
    {
        id: "POST-981903",
        user: "Taylor Lee",
        handle: "@tl_creates",
        avatarColor: "#22c55e",
        snippet: "New artwork drop: exploring color, light, and motion in digital media.",
        type: "Image",
        status: "Approved",
        riskScore: 3,
        moderatorDecision: "Approved",
        likes: 1289,
        comments: 203,
        shares: 89,
        postedAt: "2026-02-29 21:03",
        lastAction: "Approved by moderator",
        escalated: false,
        category: "Art & Media",
    },
    {
        id: "POST-981544",
        user: "Casey Nguyen",
        handle: "@casey_ng",
        avatarColor: "#f97316",
        snippet: "This policy is absolutely unacceptable and clearly targets...",
        type: "Text",
        status: "Rejected",
        riskScore: 81,
        moderatorDecision: "Rejected",
        likes: 203,
        comments: 47,
        shares: 12,
        postedAt: "2026-02-28 16:28",
        lastAction: "Rejected for harassment",
        escalated: false,
        category: "Harassment",
    },
    {
        id: "POST-981102",
        user: "Riya Patel",
        handle: "@riyap",
        avatarColor: "#facc15",
        snippet: "Join our community fundraiser stream this weekend to support...",
        type: "Video",
        status: "Archived",
        riskScore: 5,
        moderatorDecision: "Approved",
        likes: 542,
        comments: 77,
        shares: 38,
        postedAt: "2026-02-25 11:05",
        lastAction: "Archived after campaign end",
        escalated: false,
        category: "Community",
    },
];

const STATUS_COLORS: Record<PostStatus, string> = {
    Pending: "bg-[#422006] text-[#fed7aa] border-[#f97316]/60",
    Approved: "bg-[#022c22] text-[#bbf7d0] border-[#16a34a]/60",
    Rejected: "bg-[#450a0a] text-[#fecaca] border-[#b91c1c]/70",
    Removed: "bg-[#450a0a] text-[#fecaca] border-[#b91c1c]/80",
    Archived: "bg-[#020617] text-[#9ca3af] border-[#374151]",
};

function riskBadge(score: number) {
    if (score >= 80) {
        return {
            label: "High",
            className: "bg-[#450a0a] text-[#fecaca] border-[#b91c1c]/80",
        };
    }
    if (score >= 40) {
        return {
            label: "Medium",
            className: "bg-[#422006] text-[#fef9c3] border-[#eab308]/70",
        };
    }
    return {
        label: "Low",
        className: "bg-[#022c22] text-[#bbf7d0] border-[#16a34a]/60",
    };
}

const KPI = {
    totalPosts: 128_430,
    pending: 3_214,
    approved: 102_398,
    rejected: 12_934,
    removed: 3_107,
    highRiskPct: 2.3,
};

const dailyVolumeOptions = {
    grid: { left: 8, right: 8, top: 24, bottom: 16, containLabel: true },
    xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        axisLine: { lineStyle: { color: "#4B5563" } },
        axisLabel: { color: "#9CA3AF" },
    },
    yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(55,65,81,0.6)" } },
        axisLabel: { color: "#6B7280" },
    },
    series: [
        {
            name: "Posts",
            type: "line",
            smooth: true,
            data: [18000, 22000, 26000, 25000, 30000, 32000, 21000],
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(56,189,248,0.32)" },
                        { offset: 1, color: "rgba(15,23,42,0)" },
                    ],
                },
            },
            lineStyle: { color: "#38bdf8", width: 2 },
            symbolSize: 6,
        },
    ],
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
    },
};

const statusDistributionOptions = {
    grid: { left: 8, right: 12, top: 24, bottom: 16, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
    },
    legend: {
        data: ["Pending", "Approved", "Rejected", "Removed"],
        textStyle: { color: "#9CA3AF", fontSize: 10 },
        top: 0,
        right: 0,
    },
    xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        axisLine: { lineStyle: { color: "#4B5563" } },
        axisLabel: { color: "#9CA3AF" },
    },
    yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(55,65,81,0.6)" } },
        axisLabel: { color: "#6B7280" },
    },
    series: [
        {
            name: "Pending",
            type: "bar",
            stack: "status",
            emphasis: { focus: "series" },
            itemStyle: { color: "#fbbf24" },
            data: [3200, 3400, 3600, 3100, 3000, 2800, 2600],
        },
        {
            name: "Approved",
            type: "bar",
            stack: "status",
            itemStyle: { color: "#22c55e" },
            data: [15000, 17000, 19000, 20000, 23000, 25000, 18000],
        },
        {
            name: "Rejected",
            type: "bar",
            stack: "status",
            itemStyle: { color: "#f97316" },
            data: [900, 1100, 1000, 980, 1200, 1020, 980],
        },
        {
            name: "Removed",
            type: "bar",
            stack: "status",
            itemStyle: { color: "#ef4444" },
            data: [500, 650, 700, 800, 900, 880, 760],
        },
    ],
};

const contentTypeOptions = {
    tooltip: {
        trigger: "item",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
    },
    series: [
        {
            type: "pie",
            radius: ["45%", "70%"],
            avoidLabelOverlap: false,
            label: { show: false },
            labelLine: { show: false },
            data: [
                { value: 58, name: "Text", itemStyle: { color: "#38bdf8" } },
                { value: 24, name: "Image", itemStyle: { color: "#22c55e" } },
                { value: 12, name: "Video", itemStyle: { color: "#f97316" } },
                { value: 6, name: "Link", itemStyle: { color: "#a855f7" } },
            ],
        },
    ],
};

const highRiskTrendOptions = {
    grid: { left: 8, right: 8, top: 24, bottom: 16, containLabel: true },
    xAxis: {
        type: "category",
        data: ["W1", "W2", "W3", "W4"],
        axisLine: { lineStyle: { color: "#4B5563" } },
        axisLabel: { color: "#9CA3AF" },
    },
    yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(55,65,81,0.6)" } },
        axisLabel: { color: "#6B7280" },
    },
    series: [
        {
            type: "line",
            smooth: true,
            data: [1.8, 2.1, 2.4, 2.3],
            lineStyle: { color: "#ef4444", width: 2 },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(248,113,113,0.3)" },
                        { offset: 1, color: "rgba(15,23,42,0)" },
                    ],
                },
            },
            symbolSize: 6,
        },
    ],
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
        valueFormatter: (value: number) => `${value.toFixed(1)}%`,
    },
};

const violationsOptions = {
    grid: { left: 8, right: 8, top: 24, bottom: 16, containLabel: true },
    xAxis: {
        type: "category",
        data: ["Spam", "Harassment", "Hate", "Violence", "Misinformation"],
        axisLine: { lineStyle: { color: "#4B5563" } },
        axisLabel: { color: "#9CA3AF", rotate: 20 },
    },
    yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(55,65,81,0.6)" } },
        axisLabel: { color: "#6B7280" },
    },
    series: [
        {
            type: "bar",
            data: [5400, 3200, 2100, 1700, 2600],
            itemStyle: {
                color: (params: { dataIndex: number }) => {
                    const palette = [
                        "#f97316",
                        "#ef4444",
                        "#a855f7",
                        "#22c55e",
                        "#38bdf8",
                    ];
                    return palette[params.dataIndex % palette.length];
                },
            },
        },
    ],
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
    },
};

export default function SuperAdminContentModeration() {
    const [statusFilter, setStatusFilter] = useState<"All" | PostStatus>("All");
    const [typeFilter, setTypeFilter] = useState<"All" | ContentType>("All");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<AllPostRow | null>(MOCK_POSTS[0]);

    const filtered = useMemo(
        () =>
            MOCK_POSTS.filter((post) => {
                if (statusFilter !== "All" && post.status !== statusFilter) {
                    return false;
                }
                if (typeFilter !== "All" && post.type !== typeFilter) {
                    return false;
                }
                if (!search) return true;
                const q = search.toLowerCase();
                return (
                    post.id.toLowerCase().includes(q) ||
                    post.user.toLowerCase().includes(q) ||
                    post.handle.toLowerCase().includes(q) ||
                    post.snippet.toLowerCase().includes(q)
                );
            }),
        [statusFilter, typeFilter, search],
    );

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #2F3336; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #71767B; }
        `,
                }}
            />

            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] flex items-center gap-2">
                        <Layers3 className="w-5 h-5 text-[#38bdf8]" />
                        All Posts
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">
                        Platform-wide content oversight and override control.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#9CA3AF]">
                        <Calendar className="w-4 h-4" />
                        <span>Last 7 days</span>
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as "All" | PostStatus)
                        }
                        className="bg-[#020617] border border-[#1F2937] rounded-full px-2.5 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                    >
                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Removed">Removed</option>
                        <option value="Archived">Archived</option>
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(e.target.value as "All" | ContentType)
                        }
                        className="bg-[#020617] border border-[#1F2937] rounded-full px-2.5 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                    >
                        <option value="All">All Types</option>
                        <option value="Text">Text</option>
                        <option value="Image">Image</option>
                        <option value="Video">Video</option>
                        <option value="Link">Link</option>
                    </select>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#1F2937] text-[#9CA3AF] hover:bg-[#111827]"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[11px] text-[#9CA3AF]">
                        <Activity className="w-3.5 h-3.5 text-[#22c55e]" />
                        Total Posts:{" "}
                        <span className="text-[#E5E7EB]">
                            {KPI.totalPosts.toLocaleString()}
                        </span>
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KpiCard
                        label="Total Posts"
                        value={KPI.totalPosts}
                        delta={8.3}
                        tone="neutral"
                    />
                    <KpiCard
                        label="Pending Moderation"
                        value={KPI.pending}
                        delta={-4.1}
                        tone="warning"
                    />
                    <KpiCard
                        label="Approved"
                        value={KPI.approved}
                        delta={6.7}
                        tone="success"
                    />
                    <KpiCard
                        label="Rejected"
                        value={KPI.rejected}
                        delta={1.2}
                        tone="info"
                    />
                    <KpiCard
                        label="Removed"
                        value={KPI.removed}
                        delta={0.8}
                        tone="danger"
                    />
                    <KpiCard
                        label="High-Risk Content %"
                        value={KPI.highRiskPct}
                        isPercentage
                        delta={0.2}
                        tone="danger"
                    />
                </div>

                <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[12px] font-semibold text-[#E5E7EB] flex items-center gap-1.5">
                                <Filter className="w-4 h-4 text-[#9CA3AF]" />
                                Filters &amp; Search
                            </p>
                            <p className="text-[11px] text-[#9CA3AF]">
                                Narrow down content by status, type, risk, and metadata.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]"
                        >
                            <Trash2 className="w-4 h-4" />
                            Reset filters
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 text-[11px]">
                        <div className="col-span-2 flex items-center gap-2 bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5">
                            <Search className="w-4 h-4 text-[#6B7280]" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by Post ID, username, or keywords"
                                className="flex-1 bg-transparent outline-none text-[#E5E7EB] placeholder:text-[#4B5563] text-[11px]"
                            />
                        </div>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Any status</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                            <option>Removed</option>
                            <option>Archived</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Any type</option>
                            <option>Text</option>
                            <option>Image</option>
                            <option>Video</option>
                            <option>Link</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Risk: Any</option>
                            <option>Low only</option>
                            <option>Medium+</option>
                            <option>High only</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Category: Any</option>
                            <option>Spam</option>
                            <option>Harassment</option>
                            <option>Hate Speech</option>
                            <option>Violence</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Moderator decision: Any</option>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                            <option>Escalated</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>User role: Any</option>
                            <option>User</option>
                            <option>Moderator</option>
                            <option>Admin</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-[460px]">
                    <div className="xl:col-span-3 bg-[#050816] border border-[#1F2937] rounded-xl flex flex-col">
                        <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    All Posts
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    System-wide content list with risk signals.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#b91c1c]/70 bg-[#450a0a] text-[#fecaca]">
                                    <ShieldAlert className="w-3 h-3" />
                                    High risk
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#facc15]/60 bg-[#422006] text-[#fef9c3]">
                                    <AlertTriangle className="w-3 h-3" />
                                    Pending
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full text-[11px] border-collapse">
                                <thead>
                                    <tr className="bg-[#020617] border-b border-[#1F2937] sticky top-0 z-10">
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Post ID
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            User
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Content
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Type
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Status
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Risk
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Decision
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Engagement
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Posted
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Last action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((post) => {
                                        const risk = riskBadge(post.riskScore);
                                        const isHighRisk = post.riskScore >= 80;
                                        return (
                                            <tr
                                                key={post.id}
                                                className={`border-b border-[#111827] cursor-pointer hover:bg-[#020617] ${isHighRisk ? "ring-1 ring-[#b91c1c]/70" : ""}`}
                                                onClick={() => setSelected(post)}
                                            >
                                                <td className="px-3 py-2 text-[#E5E7EB] font-mono">
                                                    {post.id}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                                                            style={{
                                                                backgroundColor: `${post.avatarColor}26`,
                                                                color: post.avatarColor,
                                                            }}
                                                        >
                                                            {post.user
                                                                .split(" ")
                                                                .map((x) => x[0])
                                                                .join("")}
                                                        </div>
                                                        <div>
                                                            <p className="text-[#E5E7EB]">
                                                                {post.user}
                                                            </p>
                                                            <p className="text-[#6B7280] text-[10px]">
                                                                {post.handle}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-[#D1D5DB] max-w-[260px]">
                                                    <div className="line-clamp-2">
                                                        {post.snippet}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 text-[#9CA3AF]">
                                                    {post.type}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${STATUS_COLORS[post.status]}`}
                                                    >
                                                        {post.status}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${risk.className}`}
                                                    >
                                                        <Shield className="w-3 h-3" />
                                                        {post.riskScore}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-[#9CA3AF]">
                                                    {post.moderatorDecision}
                                                </td>
                                                <td className="px-3 py-2 text-[#9CA3AF]">
                                                    <span className="whitespace-nowrap">
                                                        {post.likes} likes
                                                    </span>
                                                    <span className="ml-1.5 whitespace-nowrap">
                                                        • {post.comments} comments
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-[#9CA3AF]">
                                                    {post.postedAt}
                                                </td>
                                                <td className="px-3 py-2 text-[#9CA3AF] max-w-[180px]">
                                                    <div className="line-clamp-2">
                                                        {post.lastAction}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-[#050816] border border-[#1F2937] rounded-xl flex flex-col">
                        <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Post Review
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Drill into content, context, and enforcement history.
                                </p>
                            </div>
                            {selected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#1F2937] bg-[#020617] text-[10px] text-[#9CA3AF]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                                    Selected: {selected.id}
                                </span>
                            )}
                        </div>
                        {selected ? (
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[11px]">
                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
                                                style={{
                                                    backgroundColor: `${selected.avatarColor}26`,
                                                    color: selected.avatarColor,
                                                }}
                                            >
                                                {selected.user
                                                    .split(" ")
                                                    .map((x) => x[0])
                                                    .join("")}
                                            </div>
                                            <div>
                                                <p className="text-[#E5E7EB]">
                                                    {selected.user}
                                                </p>
                                                <p className="text-[10px] text-[#9CA3AF]">
                                                    {selected.handle} • {selected.type}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${STATUS_COLORS[selected.status]}`}
                                        >
                                            {selected.status}
                                        </span>
                                    </div>
                                    <p className="text-[#D1D5DB] text-[11px] leading-relaxed">
                                        {selected.snippet}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            Context
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Comments:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.comments.toLocaleString()}
                                            </span>
                                            , Shares:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.shares.toLocaleString()}
                                            </span>
                                            .
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Category:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.category}
                                            </span>
                                            .
                                        </p>
                                    </div>
                                    <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            AI Insights
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
                                            Risk score:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.riskScore}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Similar past cases show{" "}
                                            <span className="text-[#E5E7EB]">
                                                high enforcement consistency
                                            </span>{" "}
                                            for this category.
                                        </p>
                                    </div>
                                </div>

                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                        Moderation history
                                    </p>
                                    <div className="space-y-1 text-[#9CA3AF]">
                                        <p>
                                            • AI flagged as{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.category}
                                            </span>{" "}
                                            risk.
                                        </p>
                                        <p>
                                            • Moderator decision:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.moderatorDecision}
                                            </span>
                                            .
                                        </p>
                                        {selected.escalated && (
                                            <p>
                                                • Case escalated to{" "}
                                                <span className="text-[#E5E7EB]">
                                                    Super Admin
                                                </span>{" "}
                                                for final review.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-2">
                                    <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                        Enforcement actions
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#022c22] border border-[#16a34a]/60 text-[#bbf7d0] hover:bg-[#064e3b]"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Approve
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#450a0a] border border-[#b91c1c]/70 text-[#fecaca] hover:bg-[#7f1d1d]"
                                        >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            Remove content
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                            Restore content
                                        </button>
                                    </div>
                                    <div className="mt-1">
                                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                                            Override justification
                                        </p>
                                        <textarea
                                            rows={2}
                                            placeholder="Required when overriding moderator decisions. Include policy references and rationale."
                                            className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] placeholder:text-[#4B5563] outline-none focus:ring-1 focus:ring-[#1D9BF0] resize-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#9CA3AF] flex items-start gap-1.5">
                                        <AlertCircle className="w-3 h-3 text-[#f97316] mt-0.5" />
                                        <span>
                                            All overrides are logged with actor, timestamp, IP
                                            address, and device fingerprint and surfaced in Security
                                            &amp; Compliance &rarr; Audit Logs.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[11px] text-[#6B7280]">
                                Select a post from the table to review details.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <AnalyticsCard title="Daily post volume">
                        <ReactECharts
                            option={dailyVolumeOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Status distribution">
                        <ReactECharts
                            option={statusDistributionOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Content type breakdown">
                        <ReactECharts
                            option={contentTypeOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="High-risk content trend">
                        <ReactECharts
                            option={highRiskTrendOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 bg-[#050816] border border-[#1F2937] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Violation categories
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Distribution of enforcement by category.
                                </p>
                            </div>
                        </div>
                        <ReactECharts
                            option={violationsOptions}
                            style={{ width: "100%", height: 220 }}
                            notMerge
                            lazyUpdate
                        />
                    </div>
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Audit timeline (sample)
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Key lifecycle events for high-risk content.
                                </p>
                            </div>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]"
                            >
                                <Download className="w-4 h-4" />
                                Export audit
                            </button>
                        </div>
                        <div className="space-y-3 text-[11px] text-[#D1D5DB]">
                            <AuditItem
                                label="Override: content removed"
                                actor="Alex (Super Admin)"
                                when="2026-03-01 18:41 UTC"
                                details="Override moderator decision on POST-982112. Reason: confirmed spam campaign & policy violation."
                                severity="critical"
                            />
                            <AuditItem
                                label="Escalated for high-risk review"
                                actor="Maya (Moderator)"
                                when="2026-03-01 18:15 UTC"
                                details="Escalated POST-982112 due to coordinated spam indicators."
                                severity="high"
                            />
                            <AuditItem
                                label="AI flagged as spam risk"
                                actor="AI: Risk model v4"
                                when="2026-03-01 18:10 UTC"
                                details="Detected repeated link patterns and suspicious domain reputation."
                                severity="medium"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface KpiCardProps {
    label: string;
    value: number;
    delta: number;
    tone: "success" | "warning" | "danger" | "info" | "neutral";
    isPercentage?: boolean;
}

function KpiCard({ label, value, delta, tone, isPercentage }: KpiCardProps) {
    const isPositive = delta >= 0;
    const color =
        tone === "success"
            ? "text-[#4ade80]"
            : tone === "danger"
            ? "text-[#fca5a5]"
            : tone === "warning"
            ? "text-[#facc15]"
            : tone === "info"
            ? "text-[#38bdf8]"
            : "text-[#E5E7EB]";

    return (
        <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            <div className="flex items-baseline justify-between gap-2">
                <p className={`text-[18px] font-semibold tracking-[-0.04em] ${color}`}>
                    {isPercentage ? `${value.toFixed(1)}%` : value.toLocaleString()}
                </p>
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                        isPositive
                            ? "bg-[#022c22] text-[#bbf7d0] border border-[#16a34a]/60"
                            : "bg-[#450a0a] text-[#fecaca] border border-[#b91c1c]/70"
                    }`}
                >
                    <ArrowUpRight
                        className={`w-3 h-3 ${isPositive ? "" : "rotate-90"}`}
                    />
                    {isPositive ? "+" : ""}
                    {delta.toFixed(1)}%
                </span>
            </div>
        </div>
    );
}

interface AnalyticsCardProps {
    title: string;
    children: React.ReactNode;
}

function AnalyticsCard({ title, children }: AnalyticsCardProps) {
    return (
        <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-3 flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-[#E5E7EB]">{title}</p>
            <div className="flex-1 min-h-[140px]">{children}</div>
        </div>
    );
}

interface AuditItemProps {
    label: string;
    actor: string;
    when: string;
    details: string;
    severity: "medium" | "high" | "critical";
}

function AuditItem({
    label,
    actor,
    when,
    details,
    severity,
}: AuditItemProps) {
    const dotColor =
        severity === "critical"
            ? "bg-[#ef4444]"
            : severity === "high"
            ? "bg-[#f97316]"
            : "bg-[#eab308]";

    return (
        <div className="relative pl-4 border-l border-dashed border-[#1F2937]">
            <span
                className={`absolute -left-[3px] top-1 w-2 h-2 rounded-full ${dotColor}`}
            />
            <p className="text-[11px] font-semibold text-[#E5E7EB] mb-0.5">
                {label}
            </p>
            <p className="text-[10px] text-[#9CA3AF] mb-0.5">
                {actor} • {when}
            </p>
            <p className="text-[11px] text-[#D1D5DB]">{details}</p>
        </div>
    );
}

