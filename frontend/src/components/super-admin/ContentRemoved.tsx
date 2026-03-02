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
    Gavel,
    Layers3,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    Trash2,
    Undo2,
} from "lucide-react";

type Severity = "Low" | "Medium" | "High" | "Critical";
type RemovalSource =
    | "AI System"
    | "Moderator"
    | "Admin"
    | "Super Admin"
    | "User Self-Deletion";
type ContentType = "Text" | "Image" | "Video" | "Link";

interface RemovedContentRow {
    id: string;
    user: string;
    handle: string;
    avatarColor: string;
    snippet: string;
    type: ContentType;
    violationCategory: string;
    severity: Severity;
    removedBy: string;
    removalSource: RemovalSource;
    riskScore: number;
    removalDate: string;
    appealStatus: "None" | "Submitted" | "In Review" | "Resolved";
    escalated: boolean;
    archived: boolean;
}

const MOCK_REMOVED: RemovedContentRow[] = [
    {
        id: "POST-972310",
        user: "Jordan Kim",
        handle: "@jk_security",
        avatarColor: "#a855f7",
        snippet: "Buy followers now, instant growth guaranteed! Limited offer: ...",
        type: "Link",
        violationCategory: "Spam",
        severity: "High",
        removedBy: "AI + Moderator",
        removalSource: "AI System",
        riskScore: 94,
        removalDate: "2026-03-01 18:41 UTC",
        appealStatus: "None",
        escalated: true,
        archived: false,
    },
    {
        id: "POST-972122",
        user: "Casey Nguyen",
        handle: "@casey_ng",
        avatarColor: "#f97316",
        snippet: "You are worthless and shouldn't be here...",
        type: "Text",
        violationCategory: "Harassment",
        severity: "Critical",
        removedBy: "Maya (Moderator)",
        removalSource: "Moderator",
        riskScore: 97,
        removalDate: "2026-03-01 13:22 UTC",
        appealStatus: "Submitted",
        escalated: true,
        archived: false,
    },
    {
        id: "POST-971904",
        user: "Taylor Lee",
        handle: "@tl_creates",
        avatarColor: "#22c55e",
        snippet: "New artwork drop: exploring color, light, and motion in digital media.",
        type: "Image",
        violationCategory: "Other",
        severity: "Low",
        removedBy: "System (policy window)",
        removalSource: "User Self-Deletion",
        riskScore: 4,
        removalDate: "2026-02-28 09:11 UTC",
        appealStatus: "None",
        escalated: false,
        archived: true,
    },
    {
        id: "POST-971544",
        user: "Alex Rivera",
        handle: "@alex_r",
        avatarColor: "#38bdf8",
        snippet:
            "Certain groups are clearly inferior and should not have a voice here...",
        type: "Text",
        violationCategory: "Hate Speech",
        severity: "Critical",
        removedBy: "Alex (Super Admin)",
        removalSource: "Super Admin",
        riskScore: 99,
        removalDate: "2026-02-27 21:03 UTC",
        appealStatus: "Resolved",
        escalated: true,
        archived: false,
    },
];

const KPI = {
    totalRemoved: 3107,
    removedToday: 184,
    highSeverity: 622,
    aiTriggered: 1820,
    moderatorRemovals: 820,
    adminOverrides: 74,
};

function severityBadgeClass(severity: Severity) {
    if (severity === "Critical") {
        return "bg-[#450a0a] text-[#fecaca] border-[#b91c1c]/80";
    }
    if (severity === "High") {
        return "bg-[#7c2d12] text-[#fed7aa] border-[#ea580c]/80";
    }
    if (severity === "Medium") {
        return "bg-[#422006] text-[#fef9c3] border-[#eab308]/70";
    }
    return "bg-[#020617] text-[#9ca3af] border-[#4b5563]";
}

function severityRowRing(severity: Severity, archived: boolean) {
    if (archived) return "bg-black/40 opacity-80";
    if (severity === "Critical") return "ring-1 ring-[#b91c1c]/80";
    if (severity === "High") return "ring-1 ring-[#ea580c]/70";
    return "";
}

const removalTrendOptions = {
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
            name: "Removed posts",
            type: "line",
            smooth: true,
            data: [380, 420, 460, 510, 540, 520, 480],
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(248,113,113,0.35)" },
                        { offset: 1, color: "rgba(15,23,42,0)" },
                    ],
                },
            },
            lineStyle: { color: "#ef4444", width: 2 },
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

const sourceBreakdownOptions = {
    grid: { left: 8, right: 12, top: 32, bottom: 16, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
    },
    xAxis: {
        type: "category",
        data: ["AI", "Moderator", "Admin", "Super Admin", "User self-delete"],
        axisLine: { lineStyle: { color: "#4B5563" } },
        axisLabel: { color: "#9CA3AF", interval: 0, rotate: 18 },
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
            data: [1820, 820, 240, 74, 153],
            itemStyle: {
                color: (params: { dataIndex: number }) => {
                    const palette = [
                        "#38bdf8",
                        "#f97316",
                        "#6366f1",
                        "#f43f5e",
                        "#9ca3af",
                    ];
                    return palette[params.dataIndex % palette.length];
                },
            },
        },
    ],
};

const categoryPieOptions = {
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
                { value: 32, name: "Spam", itemStyle: { color: "#f97316" } },
                { value: 21, name: "Harassment", itemStyle: { color: "#fb7185" } },
                { value: 18, name: "Hate Speech", itemStyle: { color: "#a855f7" } },
                { value: 11, name: "Violence", itemStyle: { color: "#ef4444" } },
                { value: 18, name: "Other", itemStyle: { color: "#22c55e" } },
            ],
        },
    ],
};

const highSeverityTrendOptions = {
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
            data: [120, 138, 152, 146],
            lineStyle: { color: "#f97316", width: 2 },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(249,115,22,0.35)" },
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
    },
};

const topOffendersOptions = {
    grid: { left: 8, right: 8, top: 24, bottom: 16, containLabel: true },
    xAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "rgba(55,65,81,0.6)" } },
        axisLabel: { color: "#6B7280" },
    },
    yAxis: {
        type: "category",
        data: ["@spam_bot42", "@user123", "@noise_acc", "@repeat_flag", "@fraud_acc"],
        axisLine: { lineStyle: { color: "#4B5563" } },
        axisLabel: { color: "#9CA3AF" },
    },
    series: [
        {
            type: "bar",
            data: [84, 32, 27, 21, 19],
            itemStyle: { color: "#ef4444" },
        },
    ],
};

export default function SuperAdminContentRemoved() {
    const [sourceFilter, setSourceFilter] = useState<"All" | RemovalSource>("All");
    const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
    const [typeFilter, setTypeFilter] = useState<"All" | ContentType>("All");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<RemovedContentRow | null>(
        MOCK_REMOVED[0] ?? null,
    );

    const filtered = useMemo(
        () =>
            MOCK_REMOVED.filter((row) => {
                if (sourceFilter !== "All" && row.removalSource !== sourceFilter) {
                    return false;
                }
                if (severityFilter !== "All" && row.severity !== severityFilter) {
                    return false;
                }
                if (typeFilter !== "All" && row.type !== typeFilter) {
                    return false;
                }
                if (!search) return true;
                const q = search.toLowerCase();
                return (
                    row.id.toLowerCase().includes(q) ||
                    row.user.toLowerCase().includes(q) ||
                    row.handle.toLowerCase().includes(q) ||
                    row.snippet.toLowerCase().includes(q)
                );
            }),
        [sourceFilter, severityFilter, typeFilter, search],
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
                        <Layers3 className="w-5 h-5 text-[#f97373]" />
                        Removed Content
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">
                        Policy enforcement and content removal oversight.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#9CA3AF]">
                        <Calendar className="w-4 h-4" />
                        <span>Last 7 days</span>
                    </div>
                    <select
                        value={sourceFilter}
                        onChange={(e) =>
                            setSourceFilter(e.target.value as "All" | RemovalSource)
                        }
                        className="bg-[#020617] border border-[#1F2937] rounded-full px-2.5 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                    >
                        <option value="All">All sources</option>
                        <option value="AI System">AI system</option>
                        <option value="Moderator">Moderator</option>
                        <option value="Admin">Admin</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="User Self-Deletion">User self-deletion</option>
                    </select>
                    <select
                        value={severityFilter}
                        onChange={(e) =>
                            setSeverityFilter(e.target.value as "All" | Severity)
                        }
                        className="bg-[#020617] border border-[#1F2937] rounded-full px-2.5 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                    >
                        <option value="All">All severities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                    >
                        <Download className="w-4 h-4" />
                        Export report
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#1F2937] text-[#9CA3AF] hover:bg-[#111827]"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[11px] text-[#9CA3AF]">
                        <Activity className="w-3.5 h-3.5 text-[#f97373]" />
                        Total Removed:{" "}
                        <span className="text-[#E5E7EB]">
                            {KPI.totalRemoved.toLocaleString()}
                        </span>
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KpiCard
                        label="Total removed posts"
                        value={KPI.totalRemoved}
                        delta={5.4}
                        tone="danger"
                    />
                    <KpiCard
                        label="Removed today"
                        value={KPI.removedToday}
                        delta={1.8}
                        tone="warning"
                    />
                    <KpiCard
                        label="High-severity removals"
                        value={KPI.highSeverity}
                        delta={0.9}
                        tone="danger"
                    />
                    <KpiCard
                        label="AI-triggered removals"
                        value={KPI.aiTriggered}
                        delta={7.1}
                        tone="info"
                    />
                    <KpiCard
                        label="Moderator removals"
                        value={KPI.moderatorRemovals}
                        delta={-2.6}
                        tone="neutral"
                    />
                    <KpiCard
                        label="Admin overrides"
                        value={KPI.adminOverrides}
                        delta={0.4}
                        tone="info"
                    />
                </div>

                <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[12px] font-semibold text-[#E5E7EB] flex items-center gap-1.5">
                                <Filter className="w-4 h-4 text-[#9CA3AF]" />
                                Advanced filters
                            </p>
                            <p className="text-[11px] text-[#9CA3AF]">
                                Filter removed content by source, severity, category, and more.
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
                            <option>Violation: Any</option>
                            <option>Spam</option>
                            <option>Hate Speech</option>
                            <option>Violence</option>
                            <option>Harassment</option>
                            <option>Fraud</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Escalated: Any</option>
                            <option>Escalated only</option>
                            <option>Not escalated</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Appeal: Any</option>
                            <option>Appeal submitted</option>
                            <option>No appeal</option>
                        </select>
                        <select
                            value={typeFilter}
                            onChange={(e) =>
                                setTypeFilter(e.target.value as "All" | ContentType)
                            }
                            className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none"
                        >
                            <option value="All">Content type: Any</option>
                            <option value="Text">Text</option>
                            <option value="Image">Image</option>
                            <option value="Video">Video</option>
                            <option value="Link">Link</option>
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
                                    Removed content
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    High-risk removals with severity and source indicators.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#b91c1c]/80 bg-[#450a0a] text-[#fecaca]">
                                    <ShieldAlert className="w-3 h-3" />
                                    Critical
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#ea580c]/70 bg-[#7c2d12] text-[#fed7aa]">
                                    <AlertTriangle className="w-3 h-3" />
                                    High
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
                                            Violation
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Severity
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Removed by
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Source
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Risk
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Removal date
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Appeal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`border-b border-[#111827] cursor-pointer hover:bg-[#020617] ${severityRowRing(row.severity, row.archived)}`}
                                            onClick={() => setSelected(row)}
                                        >
                                            <td className="px-3 py-2 text-[#E5E7EB] font-mono">
                                                {row.id}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                                                        style={{
                                                            backgroundColor: `${row.avatarColor}26`,
                                                            color: row.avatarColor,
                                                        }}
                                                    >
                                                        {row.user
                                                            .split(" ")
                                                            .map((x) => x[0])
                                                            .join("")}
                                                    </div>
                                                    <div>
                                                        <p className="text-[#E5E7EB]">
                                                            {row.user}
                                                        </p>
                                                        <p className="text-[#6B7280] text-[10px]">
                                                            {row.handle}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-[#D1D5DB] max-w-[220px]">
                                                <div className="line-clamp-2">
                                                    {row.snippet}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.type}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.violationCategory}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${severityBadgeClass(row.severity)}`}
                                                >
                                                    {row.severity}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.removedBy}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.removalSource}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#1F2937] text-[10px] text-[#E5E7EB]">
                                                    <Shield className="w-3 h-3 text-[#38bdf8]" />
                                                    {row.riskScore}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.removalDate}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.appealStatus}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-[#050816] border border-[#1F2937] rounded-xl flex flex-col">
                        <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Content review &amp; restoration
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Inspect violations, context, and take restoration or purge
                                    actions.
                                </p>
                            </div>
                            {selected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#1F2937] bg-[#020617] text-[10px] text-[#9CA3AF]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#f97373]" />
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
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${severityBadgeClass(selected.severity)}`}
                                        >
                                            {selected.severity}
                                        </span>
                                    </div>
                                    <p className="text-[#D1D5DB] text-[11px] leading-relaxed">
                                        {selected.snippet}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            Removal details
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Removed by:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.removedBy}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Source:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.removalSource}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Removal date:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.removalDate}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            AI explanation
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
                                            Risk score:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.riskScore}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Model flagged this as{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.violationCategory}
                                            </span>{" "}
                                            with high confidence based on language,
                                            meta-patterns, and account history.
                                        </p>
                                    </div>
                                </div>

                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                        Enforcement audit (sample)
                                    </p>
                                    <div className="space-y-1 text-[#9CA3AF]">
                                        <p>• AI model flagged content as high-risk.</p>
                                        <p>
                                            • Moderator reviewed and{" "}
                                            <span className="text-[#E5E7EB]">
                                                confirmed violation
                                            </span>
                                            .
                                        </p>
                                        {selected.escalated && (
                                            <p>
                                                • Case{" "}
                                                <span className="text-[#E5E7EB]">
                                                    escalated to Admin / Super Admin
                                                </span>{" "}
                                                for final decision.
                                            </p>
                                        )}
                                        <p>• Removal logged to Security &amp; Compliance.</p>
                                    </div>
                                </div>

                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-2">
                                    <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                        Decision actions
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#022c22] border border-[#16a34a]/60 text-[#bbf7d0] hover:bg-[#064e3b]"
                                        >
                                            <Undo2 className="w-3.5 h-3.5" />
                                            Restore content
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Confirm removal
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                            Escalate case
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#450a0a] border border-[#b91c1c]/80 text-[#fecaca] hover:bg-[#7f1d1d]"
                                        >
                                            <Gavel className="w-3.5 h-3.5" />
                                            Permanently purge
                                        </button>
                                    </div>
                                    <div className="mt-1 space-y-2">
                                        <div>
                                            <p className="text-[11px] text-[#9CA3AF] mb-1">
                                                Restoration / purge justification
                                            </p>
                                            <textarea
                                                rows={2}
                                                placeholder="Required for restore or purge. Include policy references, legal considerations, and rationale."
                                                className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] placeholder:text-[#4B5563] outline-none focus:ring-1 focus:ring-[#1D9BF0] resize-none"
                                            />
                                        </div>
                                        <p className="text-[10px] text-[#9CA3AF] flex items-start gap-1.5">
                                            <AlertCircle className="w-3 h-3 text-[#f97316] mt-0.5" />
                                            <span>
                                                Purging content is irreversible and restricted to
                                                Super Admins. Audit history is always retained for
                                                compliance review.
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[11px] text-[#6B7280]">
                                Select a removed item from the table to review details.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <AnalyticsCard title="Removal trend over time">
                        <ReactECharts
                            option={removalTrendOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Removal source breakdown">
                        <ReactECharts
                            option={sourceBreakdownOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Violation categories">
                        <ReactECharts
                            option={categoryPieOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="High-severity removals">
                        <ReactECharts
                            option={highSeverityTrendOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Top offending accounts
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Users with the highest volume of removals.
                                </p>
                            </div>
                        </div>
                        <ReactECharts
                            option={topOffendersOptions}
                            style={{ width: "100%", height: 220 }}
                            notMerge
                            lazyUpdate
                        />
                    </div>
                    <div className="xl:col-span-2 bg-[#050816] border border-[#1F2937] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Enforcement audit timeline (sample)
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    End-to-end lifecycle for a high-risk removed post.
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
                                label="Content submitted"
                                actor="@jk_security (User)"
                                when="2026-03-01 18:02 UTC"
                                details="Post created and queued for pre-moderation review."
                                severity="medium"
                            />
                            <AuditItem
                                label="AI flagged for spam risk"
                                actor="AI: Risk model v4"
                                when="2026-03-01 18:03 UTC"
                                details="Detected suspicious link pattern and prior domain reputation issues."
                                severity="high"
                            />
                            <AuditItem
                                label="Moderator removed content"
                                actor="Maya (Moderator)"
                                when="2026-03-01 18:12 UTC"
                                details="Confirmed spam campaign and removed post under anti-spam policy."
                                severity="high"
                            />
                            <AuditItem
                                label="Super Admin override review"
                                actor="Alex (Super Admin)"
                                when="2026-03-01 18:41 UTC"
                                details="Reviewed enforcement decision, confirmed removal, and documented legal/regional considerations."
                                severity="critical"
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
}

function KpiCard({ label, value, delta, tone }: KpiCardProps) {
    const isPositive = delta <= 0 && tone === "danger" ? false : delta >= 0;
    let color = "text-[#E5E7EB]";
    if (tone === "success") color = "text-[#4ade80]";
    else if (tone === "danger") color = "text-[#fca5a5]";
    else if (tone === "warning") color = "text-[#facc15]";
    else if (tone === "info") color = "text-[#38bdf8]";

    return (
        <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            <div className="flex items-baseline justify-between gap-2">
                <p className={`text-[18px] font-semibold tracking-[-0.04em] ${color}`}>
                    {value.toLocaleString()}
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
    let dotColor = "bg-[#eab308]";
    if (severity === "high") dotColor = "bg-[#f97316]";
    else if (severity === "critical") dotColor = "bg-[#ef4444]";

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

