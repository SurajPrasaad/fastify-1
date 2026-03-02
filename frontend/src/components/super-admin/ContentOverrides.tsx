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
    UserCheck,
    XCircle,
} from "lucide-react";

type Severity = "Low" | "Medium" | "High" | "Critical";

interface OverrideCase {
    caseId: string;
    postId: string;
    user: string;
    handle: string;
    avatarColor: string;
    moderator: string;
    originalDecision: "Approve" | "Reject" | "Remove";
    violationCategory: string;
    riskScore: number;
    escalated: boolean;
    severity: Severity;
    decisionDate: string;
    overrideStatus: "None" | "Overridden" | "Confirmed";
}

const MOCK_CASES: OverrideCase[] = [
    {
        caseId: "CASE-43012",
        postId: "POST-982341",
        user: "Alex Rivera",
        handle: "@alex_r",
        avatarColor: "#38bdf8",
        moderator: "Maya Chen",
        originalDecision: "Approve",
        violationCategory: "Policy Violation",
        riskScore: 78,
        escalated: true,
        severity: "High",
        decisionDate: "2026-03-02 09:14 UTC",
        overrideStatus: "None",
    },
    {
        caseId: "CASE-42987",
        postId: "POST-982112",
        user: "Jordan Kim",
        handle: "@jk_security",
        avatarColor: "#a855f7",
        moderator: "Luis Romero",
        originalDecision: "Reject",
        violationCategory: "Spam",
        riskScore: 92,
        escalated: true,
        severity: "Critical",
        decisionDate: "2026-03-01 18:41 UTC",
        overrideStatus: "Overridden",
    },
    {
        caseId: "CASE-42962",
        postId: "POST-981903",
        user: "Taylor Lee",
        handle: "@tl_creates",
        avatarColor: "#22c55e",
        moderator: "Maya Chen",
        originalDecision: "Remove",
        violationCategory: "Other",
        riskScore: 18,
        escalated: false,
        severity: "Low",
        decisionDate: "2026-02-29 21:03 UTC",
        overrideStatus: "Confirmed",
    },
    {
        caseId: "CASE-42930",
        postId: "POST-981544",
        user: "Casey Nguyen",
        handle: "@casey_ng",
        avatarColor: "#f97316",
        moderator: "Aria Patel",
        originalDecision: "Reject",
        violationCategory: "Harassment",
        riskScore: 83,
        escalated: true,
        severity: "High",
        decisionDate: "2026-02-28 16:28 UTC",
        overrideStatus: "None",
    },
];

const KPI = {
    decisionsReviewed: 4_820,
    totalOverrides: 382,
    approvalToRemoval: 142,
    removalToRestore: 96,
    moderatorAccuracyImpact: -1.7,
    overrideRate: 7.9,
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

function rowRingClass(severity: Severity, status: OverrideCase["overrideStatus"]) {
    if (status === "Overridden") return "ring-1 ring-[#f97316]/80";
    if (severity === "Critical") return "ring-1 ring-[#b91c1c]/80";
    if (severity === "High") return "ring-1 ring-[#ea580c]/70";
    return "";
}

const overrideRateOptions = {
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
            name: "Override rate",
            type: "line",
            smooth: true,
            data: [6.1, 7.3, 8.2, 7.9],
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
        valueFormatter: (v: number) => `${v.toFixed(1)}%`,
    },
};

const outcomeStackOptions = {
    grid: { left: 8, right: 12, top: 32, bottom: 16, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
    },
    legend: {
        data: ["Approval → Removal", "Removal → Restore", "Escalation"],
        textStyle: { color: "#9CA3AF", fontSize: 10 },
        top: 0,
        right: 0,
    },
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
            name: "Approval → Removal",
            type: "bar",
            stack: "overrides",
            data: [32, 40, 38, 42],
            itemStyle: { color: "#ef4444" },
        },
        {
            name: "Removal → Restore",
            type: "bar",
            stack: "overrides",
            data: [18, 20, 22, 21],
            itemStyle: { color: "#22c55e" },
        },
        {
            name: "Escalation",
            type: "bar",
            stack: "overrides",
            data: [8, 11, 13, 12],
            itemStyle: { color: "#38bdf8" },
        },
    ],
};

const overriddenCategoryPieOptions = {
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
                { value: 28, name: "Harassment", itemStyle: { color: "#fb7185" } },
                { value: 24, name: "Spam", itemStyle: { color: "#f97316" } },
                { value: 18, name: "Hate Speech", itemStyle: { color: "#a855f7" } },
                { value: 16, name: "Policy Violation", itemStyle: { color: "#38bdf8" } },
                { value: 14, name: "Other", itemStyle: { color: "#22c55e" } },
            ],
        },
    ],
};

const moderatorRateOptions = {
    grid: { left: 8, right: 8, top: 24, bottom: 16, containLabel: true },
    xAxis: {
        type: "category",
        data: ["Maya", "Luis", "Aria", "Jordan", "Priya"],
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
            type: "bar",
            data: [4.1, 9.3, 6.8, 3.2, 2.4],
            itemStyle: {
                color: (params: { dataIndex: number }) => {
                    const palette = ["#22c55e", "#ef4444", "#facc15", "#38bdf8", "#a855f7"];
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
        valueFormatter: (v: number) => `${v.toFixed(1)}%`,
    },
};

export default function SuperAdminContentOverrides() {
    const [moderatorFilter, setModeratorFilter] = useState("Any moderator");
    const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<OverrideCase | null>(
        MOCK_CASES[0] ?? null,
    );

    const filtered = useMemo(
        () =>
            MOCK_CASES.filter((c) => {
                if (severityFilter !== "All" && c.severity !== severityFilter) {
                    return false;
                }
                if (
                    moderatorFilter !== "Any moderator" &&
                    c.moderator !== moderatorFilter
                ) {
                    return false;
                }
                if (!search) return true;
                const q = search.toLowerCase();
                return (
                    c.caseId.toLowerCase().includes(q) ||
                    c.postId.toLowerCase().includes(q) ||
                    c.user.toLowerCase().includes(q) ||
                    c.handle.toLowerCase().includes(q) ||
                    c.moderator.toLowerCase().includes(q)
                );
            }),
        [severityFilter, moderatorFilter, search],
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
                        Override Decisions
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">
                        Review and modify moderation outcomes with full governance visibility.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#9CA3AF]">
                        <Calendar className="w-4 h-4" />
                        <span>Last 7 days</span>
                    </div>
                    <select
                        value={moderatorFilter}
                        onChange={(e) => setModeratorFilter(e.target.value)}
                        className="bg-[#020617] border border-[#1F2937] rounded-full px-2.5 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                    >
                        <option>Any moderator</option>
                        <option>Maya Chen</option>
                        <option>Luis Romero</option>
                        <option>Aria Patel</option>
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
                        Export log
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#1F2937] text-[#9CA3AF] hover:bg-[#111827]"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[11px] text-[#9CA3AF]">
                        <Activity className="w-3.5 h-3.5 text-[#facc15]" />
                        Pending Override Reviews:{" "}
                        <span className="text-[#E5E7EB]">12</span>
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KpiCard
                        label="Decisions reviewed"
                        value={KPI.decisionsReviewed}
                        delta={5.2}
                        tone="neutral"
                    />
                    <KpiCard
                        label="Total overrides"
                        value={KPI.totalOverrides}
                        delta={1.1}
                        tone="warning"
                    />
                    <KpiCard
                        label="Approval → Removal"
                        value={KPI.approvalToRemoval}
                        delta={0.7}
                        tone="danger"
                    />
                    <KpiCard
                        label="Removal → Restore"
                        value={KPI.removalToRestore}
                        delta={0.3}
                        tone="info"
                    />
                    <KpiCard
                        label="Moderator accuracy impact"
                        value={KPI.moderatorAccuracyImpact}
                        delta={-0.4}
                        tone="danger"
                        isPercentage
                    />
                    <KpiCard
                        label="Override rate"
                        value={KPI.overrideRate}
                        delta={0.6}
                        tone="warning"
                        isPercentage
                    />
                </div>

                <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[12px] font-semibold text-[#E5E7EB] flex items-center gap-1.5">
                                <Filter className="w-4 h-4 text-[#9CA3AF]" />
                                Decision filters
                            </p>
                            <p className="text-[11px] text-[#9CA3AF]">
                                Filter override candidates by moderator, severity, and outcome.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]"
                        >
                            <XCircle className="w-4 h-4" />
                            Clear filters
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 text-[11px]">
                        <div className="col-span-2 flex items-center gap-2 bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5">
                            <Search className="w-4 h-4 text-[#6B7280]" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by case ID, post ID, user, or moderator"
                                className="flex-1 bg-transparent outline-none text-[#E5E7EB] placeholder:text-[#4B5563] text-[11px]"
                            />
                        </div>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Override status: Any</option>
                            <option>Pending only</option>
                            <option>Overridden only</option>
                            <option>Confirmed only</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Escalation: Any</option>
                            <option>Escalated</option>
                            <option>Not escalated</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Violation: Any</option>
                            <option>Spam</option>
                            <option>Harassment</option>
                            <option>Hate Speech</option>
                            <option>Policy Violation</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>AI risk: Any</option>
                            <option>Low only</option>
                            <option>Medium+</option>
                            <option>High only</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-[460px]">
                    <div className="xl:col-span-3 bg-[#050816] border border-[#1F2937] rounded-xl flex flex-col">
                        <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Decision review
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Moderator decisions requiring governance review and potential
                                    override.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#b91c1c]/80 bg-[#450a0a] text-[#fecaca]">
                                    <ShieldAlert className="w-3 h-3" />
                                    High risk
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#facc15]/60 bg-[#422006] text-[#fef9c3]">
                                    <AlertTriangle className="w-3 h-3" />
                                    Escalated
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full text-[11px] border-collapse">
                                <thead>
                                    <tr className="bg-[#020617] border-b border-[#1F2937] sticky top-0 z-10">
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Case ID
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Post ID
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            User
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Moderator
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Original decision
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Category
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            AI risk
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Escalation
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Severity
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Decision date
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Override status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((c) => (
                                        <tr
                                            key={c.caseId}
                                            className={`border-b border-[#111827] cursor-pointer hover:bg-[#020617] ${rowRingClass(c.severity, c.overrideStatus)}`}
                                            onClick={() => setSelected(c)}
                                        >
                                            <td className="px-3 py-2 text-[#E5E7EB] font-mono">
                                                {c.caseId}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {c.postId}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                                                        style={{
                                                            backgroundColor: `${c.avatarColor}26`,
                                                            color: c.avatarColor,
                                                        }}
                                                    >
                                                        {c.user
                                                            .split(" ")
                                                            .map((x) => x[0])
                                                            .join("")}
                                                    </div>
                                                    <div>
                                                        <p className="text-[#E5E7EB]">{c.user}</p>
                                                        <p className="text-[#6B7280] text-[10px]">
                                                            {c.handle}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {c.moderator}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {c.originalDecision}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {c.violationCategory}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#1F2937] text-[10px] text-[#E5E7EB]">
                                                    <Shield className="w-3 h-3 text-[#38bdf8]" />
                                                    {c.riskScore}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {c.escalated ? "Escalated" : "—"}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${severityBadgeClass(c.severity)}`}
                                                >
                                                    {c.severity}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {c.decisionDate}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {c.overrideStatus}
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
                                    Override review workspace
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Compare content, AI signals, and moderator judgement before
                                    overriding.
                                </p>
                            </div>
                            {selected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#1F2937] bg-[#020617] text-[10px] text-[#9CA3AF]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
                                    Case: {selected.caseId}
                                </span>
                            )}
                        </div>
                        {selected ? (
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[11px]">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-1 border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            Case metadata
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Case ID:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.caseId}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Moderator:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.moderator}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Decision time:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.decisionDate}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Original decision:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.originalDecision}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Category:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.violationCategory}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Escalation:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.escalated ? "Yes" : "No"}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="col-span-1 border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            Content &amp; context
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            User:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.user} ({selected.handle})
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Conversation thread and reporter notes available in
                                            full moderation workspace.
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Historical decisions for similar content:{" "}
                                            <span className="text-[#E5E7EB]">
                                                high consistency
                                            </span>{" "}
                                            with current outcome.
                                        </p>
                                    </div>
                                    <div className="col-span-1 border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            AI vs moderator signals
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
                                            AI risk score:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.riskScore}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            AI confidence:{" "}
                                            <span className="text-[#E5E7EB]">92%</span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Moderator confidence note:{" "}
                                            <span className="text-[#E5E7EB]">
                                                "Aligned with policy reference 3.2"
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                        Override actions
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#022c22] border border-[#16a34a]/60 text-[#bbf7d0] hover:bg-[#064e3b]"
                                        >
                                            <UserCheck className="w-3.5 h-3.5" />
                                            Confirm moderator decision
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#450a0a] border border-[#b91c1c]/80 text-[#fecaca] hover:bg-[#7f1d1d]"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            Override &amp; remove content
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Override &amp; restore content
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Issue warning / temp suspend
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                            Escalate further
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#450a0a] border border-[#b91c1c]/80 text-[#fecaca] hover:bg-[#7f1d1d]"
                                        >
                                            <Gavel className="w-3.5 h-3.5" />
                                            Permanently ban (Super Admin)
                                        </button>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[11px] text-[#9CA3AF] mb-1">
                                                    Final violation category
                                                </p>
                                                <select className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] outline-none">
                                                    <option>Keep existing</option>
                                                    <option>Spam</option>
                                                    <option>Harassment</option>
                                                    <option>Hate Speech</option>
                                                    <option>Violence</option>
                                                    <option>Policy Violation</option>
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-[#9CA3AF] mb-1">
                                                    Governance note
                                                </p>
                                                <input
                                                    placeholder="Optional note for policy review boards"
                                                    className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] placeholder:text-[#4B5563] outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-[#9CA3AF] mb-1">
                                                Override justification (required)
                                            </p>
                                            <textarea
                                                rows={2}
                                                placeholder="Explain why the moderator decision is being changed. Reference specific policy clauses and risk assessment."
                                                className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] placeholder:text-[#4B5563] outline-none focus:ring-1 focus:ring-[#1D9BF0] resize-none"
                                            />
                                        </div>
                                        <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-2.5 space-y-1.5 text-[10px] text-[#E5E7EB]">
                                            <p className="font-semibold flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 text-[#f97316]" />
                                                Override confirmation
                                            </p>
                                            <p className="text-[#9CA3AF]">
                                                ☐ I understand this will replace the moderator’s decision.
                                            </p>
                                            <p className="text-[#9CA3AF]">
                                                ☐ This action will be logged permanently with my ID, IP
                                                address, and device fingerprint.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                        Decision audit trail (sample)
                                    </p>
                                    <div className="space-y-2 text-[#D1D5DB]">
                                        <AuditItem
                                            label="Report submitted"
                                            actor={`${selected.handle} reported content`}
                                            when="T0"
                                            details="User-submitted report describing violation concerns."
                                            severity="medium"
                                        />
                                        <AuditItem
                                            label="Moderator decision"
                                            actor={`${selected.moderator} (Moderator)`}
                                            when="T1"
                                            details={`Applied decision "${selected.originalDecision}" for category ${selected.violationCategory}.`}
                                            severity="high"
                                        />
                                        <AuditItem
                                            label="Override initiated"
                                            actor="Alex (Super Admin)"
                                            when="T2"
                                            details="Override review opened from governance console."
                                            severity="high"
                                        />
                                        <AuditItem
                                            label="Final enforcement"
                                            actor="Alex (Super Admin)"
                                            when="T3"
                                            details="Final platform decision recorded with justification and policy references."
                                            severity="critical"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[11px] text-[#6B7280]">
                                Select a case from the table to review and override.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <AnalyticsCard title="Override rate over time">
                        <ReactECharts
                            option={overrideRateOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Override outcomes">
                        <ReactECharts
                            option={outcomeStackOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Most overridden categories">
                        <ReactECharts
                            option={overriddenCategoryPieOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Override rate by moderator">
                        <ReactECharts
                            option={moderatorRateOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
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

