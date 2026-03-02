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
    UserCheck,
    XCircle,
} from "lucide-react";

type AppealStatus = "Pending" | "Approved" | "Rejected" | "Modified" | "Closed";
type EnforcementType =
    | "Content Removal"
    | "Temporary Suspension"
    | "Permanent Ban"
    | "Account Restriction"
    | "Override Decision";
type Severity = "Low" | "Medium" | "High" | "Critical";

interface AppealRow {
    id: string;
    user: string;
    handle: string;
    avatarColor: string;
    enforcementType: EnforcementType;
    originalDecision: string;
    violationCategory: string;
    severity: Severity;
    submittedDate: string;
    daysPending: number;
    slaStatus: "Within SLA" | "At Risk" | "Breached";
    status: AppealStatus;
}

const MOCK_APPEALS: AppealRow[] = [
    {
        id: "APL-43012",
        user: "Alex Rivera",
        handle: "@alex_r",
        avatarColor: "#38bdf8",
        enforcementType: "Content Removal",
        originalDecision: "Removed for hate speech",
        violationCategory: "Hate Speech",
        severity: "High",
        submittedDate: "2026-03-02 09:12 UTC",
        daysPending: 1,
        slaStatus: "Within SLA",
        status: "Pending",
    },
    {
        id: "APL-42987",
        user: "Jordan Kim",
        handle: "@jk_security",
        avatarColor: "#a855f7",
        enforcementType: "Permanent Ban",
        originalDecision: "Account banned for coordinated spam",
        violationCategory: "Spam",
        severity: "Critical",
        submittedDate: "2026-03-01 18:41 UTC",
        daysPending: 2,
        slaStatus: "Breached",
        status: "Pending",
    },
    {
        id: "APL-42945",
        user: "Taylor Lee",
        handle: "@tl_creates",
        avatarColor: "#22c55e",
        enforcementType: "Content Removal",
        originalDecision: "Removed for graphic content",
        violationCategory: "Violence",
        severity: "Medium",
        submittedDate: "2026-02-29 21:03 UTC",
        daysPending: 3,
        slaStatus: "At Risk",
        status: "Modified",
    },
    {
        id: "APL-42910",
        user: "Riya Patel",
        handle: "@riyap",
        avatarColor: "#facc15",
        enforcementType: "Account Restriction",
        originalDecision: "Feature-limited for 7 days",
        violationCategory: "Policy Violation",
        severity: "Low",
        submittedDate: "2026-02-28 16:28 UTC",
        daysPending: 5,
        slaStatus: "Within SLA",
        status: "Rejected",
    },
];

const KPI = {
    totalAppeals: 1_284,
    pending: 142,
    approved: 382,
    rejected: 640,
    avgResolutionHrs: 18.4,
    successRate: 29.8,
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

function rowRingClass(row: AppealRow) {
    if (row.slaStatus === "Breached") return "ring-1 ring-[#b91c1c]/80";
    if (row.severity === "High" || row.severity === "Critical") {
        return "ring-1 ring-[#f97316]/80";
    }
    if (row.status === "Closed") return "bg-black/40 opacity-80";
    return "";
}

const appealsVolumeOptions = {
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
            name: "Appeals",
            type: "line",
            smooth: true,
            data: [120, 148, 172, 164, 190, 210, 180],
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(56,189,248,0.35)" },
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

const outcomeStackOptions = {
    grid: { left: 8, right: 12, top: 32, bottom: 16, containLabel: true },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1F2937",
        textStyle: { color: "#E5E7EB", fontSize: 11 },
    },
    legend: {
        data: ["Approved", "Rejected", "Modified"],
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
            name: "Approved",
            type: "bar",
            stack: "outcomes",
            data: [32, 38, 40, 44],
            itemStyle: { color: "#22c55e" },
        },
        {
            name: "Rejected",
            type: "bar",
            stack: "outcomes",
            data: [58, 62, 64, 60],
            itemStyle: { color: "#ef4444" },
        },
        {
            name: "Modified",
            type: "bar",
            stack: "outcomes",
            data: [12, 16, 18, 20],
            itemStyle: { color: "#facc15" },
        },
    ],
};

const enforcementPieOptions = {
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
                { value: 42, name: "Content removal", itemStyle: { color: "#38bdf8" } },
                {
                    value: 24,
                    name: "Temporary suspension",
                    itemStyle: { color: "#f97316" },
                },
                { value: 18, name: "Permanent ban", itemStyle: { color: "#ef4444" } },
                {
                    value: 10,
                    name: "Account restriction",
                    itemStyle: { color: "#a855f7" },
                },
                {
                    value: 6,
                    name: "Override decision",
                    itemStyle: { color: "#22c55e" },
                },
            ],
        },
    ],
};

const moderatorSuccessOptions = {
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
            data: [21.4, 34.2, 18.6, 14.3, 11.8],
            itemStyle: {
                color: (params: { dataIndex: number }) => {
                    const palette = ["#22c55e", "#f97316", "#38bdf8", "#a855f7", "#e5e7eb"];
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

export default function SuperAdminAppealsWorkspace() {
    const [statusFilter, setStatusFilter] = useState<"All" | AppealStatus>("All");
    const [enforcementFilter, setEnforcementFilter] = useState<
        "All" | EnforcementType
    >("All");
    const [severityFilter, setSeverityFilter] = useState<"All" | Severity>("All");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState<AppealRow | null>(
        MOCK_APPEALS[0] ?? null,
    );

    const filtered = useMemo(
        () =>
            MOCK_APPEALS.filter((row) => {
                if (statusFilter !== "All" && row.status !== statusFilter) {
                    return false;
                }
                if (
                    enforcementFilter !== "All" &&
                    row.enforcementType !== enforcementFilter
                ) {
                    return false;
                }
                if (severityFilter !== "All" && row.severity !== severityFilter) {
                    return false;
                }
                if (!search) return true;
                const q = search.toLowerCase();
                return (
                    row.id.toLowerCase().includes(q) ||
                    row.user.toLowerCase().includes(q) ||
                    row.handle.toLowerCase().includes(q)
                );
            }),
        [statusFilter, enforcementFilter, severityFilter, search],
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
                        Appeals
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">
                        User-submitted enforcement review requests across content and accounts.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value as "All" | AppealStatus)
                        }
                        className="bg-[#020617] border border-[#1F2937] rounded-full px-2.5 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                    >
                        <option value="All">All statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Modified">Modified</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <select
                        value={enforcementFilter}
                        onChange={(e) =>
                            setEnforcementFilter(
                                e.target.value as "All" | EnforcementType,
                            )
                        }
                        className="bg-[#020617] border border-[#1F2937] rounded-full px-2.5 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                    >
                        <option value="All">All enforcement</option>
                        <option value="Content Removal">Content removal</option>
                        <option value="Temporary Suspension">
                            Temporary suspension
                        </option>
                        <option value="Permanent Ban">Permanent ban</option>
                        <option value="Account Restriction">
                            Account restriction
                        </option>
                        <option value="Override Decision">Override decision</option>
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
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#9CA3AF]">
                        <Calendar className="w-4 h-4" />
                        <span>Last 30 days</span>
                    </div>
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
                        <Activity className="w-3.5 h-3.5 text-[#facc15]" />
                        Pending Appeals:{" "}
                        <span className="text-[#E5E7EB]">
                            {KPI.pending.toLocaleString()}
                        </span>
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    <KpiCard
                        label="Total appeals"
                        value={KPI.totalAppeals}
                        delta={4.6}
                        tone="info"
                    />
                    <KpiCard
                        label="Pending review"
                        value={KPI.pending}
                        delta={1.2}
                        tone="warning"
                    />
                    <KpiCard
                        label="Approved appeals"
                        value={KPI.approved}
                        delta={0.8}
                        tone="success"
                    />
                    <KpiCard
                        label="Rejected appeals"
                        value={KPI.rejected}
                        delta={-1.5}
                        tone="danger"
                    />
                    <KpiCard
                        label="Avg resolution time (hrs)"
                        value={KPI.avgResolutionHrs}
                        delta={-3.2}
                        tone="success"
                        isDecimal
                    />
                    <KpiCard
                        label="Appeal success rate"
                        value={KPI.successRate}
                        delta={0.9}
                        tone="info"
                        isPercentage
                    />
                </div>

                <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[12px] font-semibold text-[#E5E7EB] flex items-center gap-1.5">
                                <Filter className="w-4 h-4 text-[#9CA3AF]" />
                                Appeals queue filters
                            </p>
                            <p className="text-[11px] text-[#9CA3AF]">
                                Filter appeals by user, enforcement type, and SLA risk.
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
                                placeholder="Search by appeal ID, user, or enforcement type"
                                className="flex-1 bg-transparent outline-none text-[#E5E7EB] placeholder:text-[#4B5563] text-[11px]"
                            />
                        </div>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>SLA: Any</option>
                            <option>Within SLA</option>
                            <option>At risk</option>
                            <option>Breached</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Repeat appeals: Any</option>
                            <option>Repeat only</option>
                            <option>First-time only</option>
                        </select>
                        <select className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[#E5E7EB] outline-none">
                            <option>Abuse-of-appeal: Any</option>
                            <option>Flagged</option>
                            <option>Not flagged</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 h-[460px]">
                    <div className="xl:col-span-3 bg-[#050816] border border-[#1F2937] rounded-xl flex flex-col">
                        <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Appeals queue
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Structured list of user appeals ordered by SLA and risk.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#b91c1c]/80 bg-[#450a0a] text-[#fecaca]">
                                    <ShieldAlert className="w-3 h-3" />
                                    SLA breach
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#facc15]/60 bg-[#422006] text-[#fef9c3]">
                                    <AlertTriangle className="w-3 h-3" />
                                    High severity
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="min-w-full text-[11px] border-collapse">
                                <thead>
                                    <tr className="bg-[#020617] border-b border-[#1F2937] sticky top-0 z-10">
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Appeal ID
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            User
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Enforcement type
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Original decision
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Category
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Severity
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Submitted
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Days pending
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            SLA status
                                        </th>
                                        <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                            Appeal status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`border-b border-[#111827] cursor-pointer hover:bg-[#020617] ${rowRingClass(row)}`}
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
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.enforcementType}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF] max-w-[220px]">
                                                <div className="line-clamp-2">
                                                    {row.originalDecision}
                                                </div>
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
                                                {row.submittedDate}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.daysPending}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.slaStatus}
                                            </td>
                                            <td className="px-3 py-2 text-[#9CA3AF]">
                                                {row.status}
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
                                    Appeal review workspace
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Re-evaluate enforcement decisions with content, context, and
                                    user appeal side by side.
                                </p>
                            </div>
                            {selected && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#1F2937] bg-[#020617] text-[10px] text-[#9CA3AF]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
                                    Appeal: {selected.id}
                                </span>
                            )}
                        </div>
                        {selected ? (
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-[11px]">
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="col-span-1 border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            Appeal metadata
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Appeal ID:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.id}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Enforcement type:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.enforcementType}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Submitted:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.submittedDate}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Days pending:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.daysPending}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Violation category:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.violationCategory}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF] flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
                                            Risk score:{" "}
                                            <span className="text-[#E5E7EB]">82</span>
                                        </p>
                                    </div>
                                    <div className="col-span-1 border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            Content &amp; enforcement
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            User:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.user} ({selected.handle})
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Original decision:{" "}
                                            <span className="text-[#E5E7EB]">
                                                {selected.originalDecision}
                                            </span>
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Moderator notes and AI explanation are available in full
                                            case view for policy-level inspection.
                                        </p>
                                    </div>
                                    <div className="col-span-1 border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                        <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                            User appeal
                                        </p>
                                        <p className="text-[11px] text-[#D1D5DB]">
                                            &quot;I believe this enforcement was applied in
                                            error because the context of my post was satirical and
                                            not intended to harm.&quot;
                                        </p>
                                        <p className="text-[11px] text-[#9CA3AF]">
                                            Evidence: 2 attachments (screenshots, prior thread)
                                        </p>
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
                                            <UserCheck className="w-3.5 h-3.5" />
                                            Uphold original decision
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Reinstate content / account
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Reduce penalty / remove suspension
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full bg-[#020617] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                        >
                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                            Escalate to Super Admin
                                        </button>
                                    </div>
                                    <div className="mt-2 space-y-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[11px] text-[#9CA3AF] mb-1">
                                                    Policy reference
                                                </p>
                                                <select className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] outline-none">
                                                    <option>Select policy</option>
                                                    <option>Hate speech 3.2</option>
                                                    <option>Harassment 2.4</option>
                                                    <option>Spam &amp; fraud 1.9</option>
                                                    <option>Violence 4.1</option>
                                                </select>
                                            </div>
                                            <div>
                                                <p className="text-[11px] text-[#9CA3AF] mb-1">
                                                    Fairness / governance note
                                                </p>
                                                <input
                                                    placeholder="Optional note for fairness audits"
                                                    className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] placeholder:text-[#4B5563] outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-[#9CA3AF] mb-1">
                                                Final justification (required)
                                            </p>
                                            <textarea
                                                rows={2}
                                                placeholder="Explain the reasoning behind this appeal decision. Reference risk, policy, and user history."
                                                className="w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2.5 py-1.5 text-[11px] text-[#E5E7EB] placeholder:text-[#4B5563] outline-none focus:ring-1 focus:ring-[#1D9BF0] resize-none"
                                            />
                                        </div>
                                        <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-2.5 space-y-1.5 text-[10px] text-[#E5E7EB]">
                                            <p className="font-semibold flex items-center gap-1.5">
                                                <AlertCircle className="w-3.5 h-3.5 text-[#f97316]" />
                                                Reversal confirmation
                                            </p>
                                            <p className="text-[#9CA3AF]">
                                                ☐ I confirm the original enforcement is overturned.
                                            </p>
                                            <p className="text-[#9CA3AF]">
                                                ☐ This action will be permanently logged with my ID,
                                                IP address, device fingerprint, and policy reference.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-[#E5E7EB]">
                                        Appeal decision audit trail (sample)
                                    </p>
                                    <div className="space-y-2 text-[#D1D5DB]">
                                        <AuditItem
                                            label="Original enforcement"
                                            actor="Moderator decision applied"
                                            when="T0"
                                            details="Content removed and account flagged under hate speech policy 3.2."
                                            severity="medium"
                                        />
                                        <AuditItem
                                            label="Appeal submitted"
                                            actor={`${selected.user} (${selected.handle})`}
                                            when="T1"
                                            details="User appealed enforcement, providing additional context and screenshots."
                                            severity="medium"
                                        />
                                        <AuditItem
                                            label="Reviewer assignment"
                                            actor="Assigned to Admin: Maya"
                                            when="T2"
                                            details="Appeal routed based on severity and enforcement type."
                                            severity="high"
                                        />
                                        <AuditItem
                                            label="Appeal decision"
                                            actor="Maya (Admin)"
                                            when="T3"
                                            details="Decision logged with justification, fairness note, and policy references."
                                            severity="critical"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-[11px] text-[#6B7280]">
                                Select an appeal from the queue to review and decide.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <AnalyticsCard title="Appeals volume over time">
                        <ReactECharts
                            option={appealsVolumeOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Outcome distribution">
                        <ReactECharts
                            option={outcomeStackOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Enforcement type breakdown">
                        <ReactECharts
                            option={enforcementPieOptions}
                            style={{ width: "100%", height: 180 }}
                            notMerge
                            lazyUpdate
                        />
                    </AnalyticsCard>
                    <AnalyticsCard title="Appeal success rate by moderator">
                        <ReactECharts
                            option={moderatorSuccessOptions}
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
    isDecimal?: boolean;
}

function KpiCard({
    label,
    value,
    delta,
    tone,
    isPercentage,
    isDecimal,
}: KpiCardProps) {
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

    let displayValue: string;
    if (isPercentage) {
        displayValue = `${value.toFixed(1)}%`;
    } else if (isDecimal) {
        displayValue = value.toFixed(1);
    } else {
        displayValue = value.toLocaleString();
    }

    return (
        <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-3 flex flex-col gap-1.5">
            <p className="text-[11px] text-[#9CA3AF]">{label}</p>
            <div className="flex items-baseline justify-between gap-2">
                <p className={`text-[18px] font-semibold tracking-[-0.04em] ${color}`}>
                    {displayValue}
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

