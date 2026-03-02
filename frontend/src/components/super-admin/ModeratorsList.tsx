"use client";

import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    ArrowUpRight,
    Check,
    ChevronDown,
    Clock,
    Filter,
    Flag,
    MessageCircle,
    Shield,
    ShieldAlert,
    ThumbsDown,
    ThumbsUp,
    User,
    UserMinus,
    UserX,
    X,
} from "lucide-react";

type Severity = "Low" | "Medium" | "High";
type QueueStatus = "New" | "In Review" | "Escalated" | "Closed";
type QueueCategory = "Spam" | "Harassment" | "Safety" | "NSFW" | "Other";

interface ModerationItem {
    id: string;
    severity: Severity;
    category: QueueCategory;
    source: "Report" | "AI";
    reporter: string;
    createdAt: string;
    snippet: string;
    riskScore: number;
    aiProbability: number;
    assignedToMe: boolean;
    highPriority: boolean;
    slaRisk: boolean;
    status: QueueStatus;
    repeatOffender: boolean;
}

const MOCK_QUEUE: ModerationItem[] = [
    {
        id: "CASE-98213",
        severity: "High",
        category: "Harassment",
        source: "Report",
        reporter: "user_1432",
        createdAt: "3 min ago",
        snippet: "“You should just disappear. Nobody wants you here…”",
        riskScore: 0.93,
        aiProbability: 0.88,
        assignedToMe: true,
        highPriority: true,
        slaRisk: true,
        status: "New",
        repeatOffender: true,
    },
    {
        id: "CASE-98202",
        severity: "Medium",
        category: "Spam",
        source: "AI",
        reporter: "auto-flag",
        createdAt: "12 min ago",
        snippet: "“Make $10,000 a day with this link…”",
        riskScore: 0.81,
        aiProbability: 0.91,
        assignedToMe: false,
        highPriority: false,
        slaRisk: false,
        status: "In Review",
        repeatOffender: false,
    },
    {
        id: "CASE-98177",
        severity: "High",
        category: "Safety",
        source: "Report",
        reporter: "trust-bot",
        createdAt: "24 min ago",
        snippet: "“I’m going to find you and …”",
        riskScore: 0.96,
        aiProbability: 0.92,
        assignedToMe: true,
        highPriority: true,
        slaRisk: true,
        status: "In Review",
        repeatOffender: false,
    },
];

const severityColor: Record<Severity, string> = {
    Low: "bg-[#052e16] text-[#4ade80] border-[#22c55e]/40",
    Medium: "bg-[#451a03] text-[#fbbf24] border-[#f59e0b]/50",
    High: "bg-[#450a0a] text-[#fecaca] border-[#ef4444]/60",
};

const queueKpis = {
    casesResolved: 124,
    avgResponse: "3m 42s",
    sla: "98.4%",
    accuracy: "96.1%",
    escalations: "7.2%",
};

const barCasesResolvedOption = {
    backgroundColor: "transparent",
    grid: { top: 20, left: 30, right: 10, bottom: 20, containLabel: false },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1f2937",
        textStyle: { color: "#e5e7eb", fontSize: 11 },
    },
    xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        axisLine: { lineStyle: { color: "#374151" } },
        axisLabel: { color: "#9ca3af", fontSize: 10 },
        axisTick: { show: false },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
        axisLabel: { color: "#6b7280", fontSize: 10 },
    },
    series: [
        {
            type: "bar",
            barWidth: "45%",
            itemStyle: { color: "#22c55e", borderRadius: [4, 4, 0, 0] },
            data: [72, 96, 88, 110, 134, 64, 58],
        },
    ],
};

const lineResponseTimeOption = {
    backgroundColor: "transparent",
    grid: { top: 20, left: 30, right: 10, bottom: 20, containLabel: false },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",
        borderColor: "#1f2937",
        textStyle: { color: "#e5e7eb", fontSize: 11 },
    },
    xAxis: {
        type: "category",
        data: ["09h", "10h", "11h", "12h", "13h", "14h"],
        axisLine: { lineStyle: { color: "#374151" } },
        axisLabel: { color: "#9ca3af", fontSize: 10 },
        axisTick: { show: false },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
        axisLabel: {
            color: "#6b7280",
            fontSize: 10,
            formatter: (v: number) => `${v}s`,
        },
    },
    series: [
        {
            type: "line",
            smooth: true,
            symbolSize: 4,
            itemStyle: { color: "#38bdf8" },
            lineStyle: { width: 2 },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(56,189,248,0.3)" },
                        { offset: 1, color: "rgba(15,23,42,0)" },
                    ],
                },
            },
            data: [320, 260, 230, 210, 240, 280],
        },
    ],
};

const pieDecisionOption = {
    backgroundColor: "transparent",
    tooltip: {
        trigger: "item",
        backgroundColor: "#020617",
        borderColor: "#1f2937",
        textStyle: { color: "#e5e7eb", fontSize: 11 },
    },
    series: [
        {
            type: "pie",
            radius: ["55%", "80%"],
            avoidLabelOverlap: false,
            label: { show: false },
            itemStyle: { borderColor: "#020617", borderWidth: 2 },
            data: [
                { value: 52, name: "Approve", itemStyle: { color: "#22c55e" } },
                { value: 28, name: "Reject", itemStyle: { color: "#f97373" } },
                { value: 14, name: "Warn", itemStyle: { color: "#facc15" } },
                { value: 6, name: "Escalate", itemStyle: { color: "#38bdf8" } },
            ],
        },
    ],
};

const areaWorkloadOption = {
    backgroundColor: "transparent",
    grid: { top: 20, left: 30, right: 10, bottom: 20, containLabel: false },
    tooltip: {
        trigger: "axis",
        backgroundColor: "#020617",   
        borderColor: "#1f2937",
        textStyle: { color: "#e5e7eb", fontSize: 11 },
    },
    xAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri"],
        axisLine: { lineStyle: { color: "#374151" } },
        axisLabel: { color: "#9ca3af", fontSize: 10 },
        axisTick: { show: false },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
        axisLabel: { color: "#6b7280", fontSize: 10 },
    },
    series: [
        {
            type: "line",
            smooth: true,
            symbol: "circle",
            symbolSize: 3,
            itemStyle: { color: "#6366f1" },
            lineStyle: { width: 2 },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(99,102,241,0.4)" },
                        { offset: 1, color: "rgba(15,23,42,0)" },
                    ],
                },
            },
            data: [24, 32, 29, 36, 41],
        },
    ],
};

const SuspensionModal = ({
    open,
    onClose,
    repeatOffender,
}: {
    open: boolean;
    onClose: () => void;
    repeatOffender: boolean;
}) => {
    const [duration, setDuration] = useState("24h");
    const [reason, setReason] =
        useState<"Spam" | "Harassment" | "Safety" | "Other">("Harassment");
    const [ack, setAck] = useState(false);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
                <div className="relative w-full max-w-md bg-black border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between bg-[#020617]">
                    <div>
                        <h2 className="text-[16px] font-semibold text-[#E5E7EB] flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#facc15]" />
                            Temporary Suspension
                        </h2>
                        <p className="text-[12px] text-[#9CA3AF]">
                            This action is time-bound and reversible.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-[#6B7280] hover:text-[#E5E7EB] hover:bg-[#111827]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-5 py-4 space-y-3 max-h-[360px] overflow-y-auto">
                    {repeatOffender && (
                        <div className="border border-[#facc15]/60 bg-[#422006]/70 rounded-xl p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#facc15] mt-0.5" />
                            <p className="text-[11px] text-[#fef9c3]">
                                This user appears to be a repeat offender. Consider
                                escalation if violations persist after suspension.
                            </p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                            Duration <span className="text-[#f97316]">*</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                                {["24h", "3d", "7d"].map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setDuration(opt)}
                                    className={`px-3 py-1.5 rounded-full text-[12px] border ${
                                        duration === opt
                                            ? "bg-[#facc15]/10 border-[#facc15] text-[#facc15]"
                                            : "bg-[#020617] border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                    }`}
                                >
                                    {opt === "24h" && "24 Hours"}
                                    {opt === "3d" && "3 Days"}
                                    {opt === "7d" && "7 Days (Max)"}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                            Reason category <span className="text-[#f97316]">*</span>
                        </p>
                        <select
                            value={reason}
                            onChange={(e) =>
                                setReason(
                                    e.target.value as "Spam" | "Harassment" | "Safety" | "Other",
                                )
                            }
                            className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                        >
                            <option>Spam</option>
                            <option>Harassment</option>
                            <option>Safety</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                            Internal justification note{" "}
                            <span className="text-[#f97316]">*</span>
                        </p>
                        <textarea
                            rows={3}
                            className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
                            placeholder="Summarize why a temporary suspension is appropriate based on current violations."
                        />
                    </div>
                    <label className="flex items-start gap-2 text-[11px] text-[#D1D5DB]">
                        <input
                                type="checkbox"
                            checked={ack}
                            onChange={(e) => setAck(e.target.checked)}
                            className="mt-0.5"
                        />
                        <span>
                            I understand this action is limited in duration and will be
                            logged for review by Admin/Super Admin.
                        </span>
                    </label>
                </div>
                <div className="px-5 py-3 border-t border-[#111827] bg-[#020617] flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!ack}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#facc15] text-black hover:bg-[#fde047] disabled:bg-[#1F2937] disabled:text-[#6B7280]"
                    >
                        <Clock className="w-4 h-4" />
                        Confirm Suspension ({duration})
                    </button>
                </div>
            </div>
        </div>
    );
};

const EscalateModal = ({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) => {
    const [priority, setPriority] = useState("High");

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg bg-black border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between bg-[#020617]">
                    <div>
                        <h2 className="text-[16px] font-semibold text-[#E5E7EB] flex items-center gap-2">
                            Escalate to Admin
                        </h2>
                            <p className="text-[12px] text-[#9CA3AF]">
                            Lock this case and send to Admin for higher-level review.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-[#6B7280] hover:text-[#E5E7EB] hover:bg-[#111827]"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="px-5 py-4 space-y-3 max-h-[360px] overflow-y-auto">
                    <div>
                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                            Reason summary <span className="text-[#f97316]">*</span>
                        </p>
                        <textarea
                            rows={3}
                            className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
                            placeholder="Summarize why this case requires Admin review (severity, ambiguity, legal risk, etc.)."
                        />
                    </div>
                    <div>
                            <p className="text-[11px] text-[#9CA3AF] mb-1">
                            Priority <span className="text-[#f97316]">*</span>
                        </p>
                        <div className="flex gap-2">
                            {["High", "Medium", "Low"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPriority(p)}
                                    className={`px-3 py-1.5 rounded-full text-[12px] border ${
                                        priority === p
                                            ? "bg-[#38bdf8]/10 border-[#38bdf8] text-[#e0f2fe]"
                                            : "bg-[#020617] border-[#1F2937] text-[#E5E7EB] hover:bg-[#111827]"
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                            Evidence (links, IDs, etc.)
                        </p>
                        <textarea
                            rows={3}
                            className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
                            placeholder="Paste relevant post IDs, message links, case IDs, or external references that support this escalation."
                        />
                    </div>
                </div>
                <div className="px-5 py-3 border-t border-[#111827] bg-[#020617] flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
                    >
                        Cancel
                    </button>
                    <button
                            type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#38bdf8] text-black hover:bg-[#0ea5e9]"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        Escalate ({priority})
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function SuperAdminModeratorsList() {
    const [selected, setSelected] = useState<ModerationItem | null>(
        MOCK_QUEUE[0] ?? null,
    );
    const [filterTab, setFilterTab] = useState<
        "All Reports" | "Assigned" | "High Priority" | "AI Flagged" | "SLA Risk"
    >("All Reports");
    const [suspensionOpen, setSuspensionOpen] = useState(false);
    const [escalateOpen, setEscalateOpen] = useState(false);

    const queue = useMemo(
        () =>
            MOCK_QUEUE.filter((item) => {
                if (filterTab === "Assigned") return item.assignedToMe;
                if (filterTab === "High Priority") return item.highPriority;
                if (filterTab === "AI Flagged") return item.source === "AI";
                if (filterTab === "SLA Risk") return item.slaRisk;
                return true;
            }),
        [filterTab],
    );

    return (
 
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">

            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#38bdf8]\" />
                        Moderator Workbench
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5\">
                        High-focus moderation queue for pre-publish content review.
                    </p>
                </div>
                <div className="flex items-center gap-3\">
                    <div className="hidden md:flex items-center gap-3 text-[11px] text-[#9ca3af]\">
                        <span className="inline-flex items-center gap-1\">
                            <Activity className="w-3.5 h-3.5 text-[#22c55e]\" />
                            {queueKpis.casesResolved} cases today
                        </span>
                        <span className="inline-flex items-center gap-1\">
                            <Clock className="w-3.5 h-3.5 text-[#38bdf8]\" />
                            Avg response {queueKpis.avgResponse}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4\">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4\">
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col gap-2\">
                        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]\">
                            Cases Resolved
                        </p>
                        <p className="text-[22px] font-bold text-[#e5e7eb]">
                            {queueKpis.casesResolved}
                        </p>
                        <div className="h-24 w-full relative">
                            <ReactECharts
                                option={barCasesResolvedOption}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                }}
                            />
                        </div>
                    </div>
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col gap-2\">
                        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]">
                            Response Time
                        </p>
                        <p className="text-[22px] font-bold text-[#e5e7eb]\">
                            {queueKpis.avgResponse}
                        </p>
                        <div className="h-24 w-full relative">
                            <ReactECharts
                                option={lineResponseTimeOption}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                }}
                            />
                        </div>
                    </div>
                            <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col gap-2">
                        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]">
                            Decision Mix
                        </p>
                        <p className="text-[22px] font-bold text-[#e5e7eb]">
                            {queueKpis.accuracy}
                        </p>
                        <div className="h-24 w-full relative flex items-center justify-center">
                            <ReactECharts
                                option={pieDecisionOption}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                }}
                            />
                        </div>
                    </div>
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col gap-2">
                            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]">
                            Weekly Workload
                        </p>
                        <p className="text-[22px] font-bold text-[#e5e7eb]">
                            {queueKpis.escalations} escalations
                        </p>
                        <div className="h-24 w-full relative">
                            <ReactECharts
                                option={areaWorkloadOption}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                }}
                            />
                        </div>
                    </div>
                </div>

                        <div className="flex flex-col xl:flex-row gap-4 h-[540px] max-h-[70vh]">
                    <div className="xl:w-1/4 w-full flex flex-col bg-[#050816] border border-[#1F2937] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#1F2937] flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]">
                                    Moderation Queue
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] text-[#e5e7eb] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]\"
                                >
                                    <Filter className="w-3.5 h-3.5 text-[#9ca3af]" />
                                    Filters
                                </button>
                            </div>
                            <div className="flex gap-1 text-[11px]">
                                {(
                                    [
                                        "All Reports",
                                        "Assigned",
                                        "High Priority",
                                        "AI Flagged",
                                        "SLA Risk",
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setFilterTab(tab)}
                                        className={`px-2.5 py-1 rounded-full border ${
                                            filterTab === tab
                                                ? "bg-[#111827] border-[#38bdf8] text-[#e0f2fe]"
                                                : "bg-transparent border-transparent text-[#9ca3af] hover:bg-[#020617]"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-[#111827]">
                            {queue.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelected(item)}
                                    className={`w-full text-left px-4 py-3 flex flex-col gap-1 hover:bg-[#020617] ${
                                        selected?.id === item.id ? "bg-[#020617]" : ""
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[12px] font-mono text-[#e5e7eb]">
                                            {item.id}
                                        </span>
                                        <span
                                            className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${severityColor[item.severity]}`}
                                        >
                                            {item.severity}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-[#e5e7eb] line-clamp-2">
                                        {item.snippet}
                                    </p>
                                    <div className="flex items-center justify-between text-[11px] text-[#9ca3af]\">
                                        <span className="inline-flex items-center gap-1">
                                            <Flag className="w-3 h-3\" />
                                            {item.category}
                                        </span>
                                        <span>{item.createdAt}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="xl:w-1/2 w-full flex flex-col bg-[#050816] border border-[#1F2937] rounded-xl overflow-hidden\">
                        <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between\">
                            <div>
                                <div className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]\">
                                    Content Review
                                </div>
                                {selected && (
                                    <p className="text-[12px] text-[#9ca3af]\">
                                        Reviewing {selected.id} from {selected.reporter}
                                    </p>
                                )}
                            </div>
                            {selected && (
                                <div className="flex items-center gap-3 text-[11px] text-[#9ca3af]\">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#020617] border border-[#1F2937]\">
                                        <Activity className="w-3 h-3 text-[#38bdf8]\" />
                                        AI risk {Math.round(selected.riskScore * 100)}%
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#020617] border border-[#1F2937]\">
                                        <Shield className="w-3 h-3 text-[#facc15]\" />
                                        Violation {Math.round(selected.aiProbability * 100)}%
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4\">
                            {selected ? (
                                <div>
                                    <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2\">
                                        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]">
                                            Content
                                        </p>
                                        <p className="text-[13px] text-[#e5e7eb]\">
                                            {selected.snippet}
                                        </p>
                                        <p className="text-[11px] text-[#9ca3af]\">
                                            Highlighted segment shows the most likely violation area
                                            based on AI and reporter feedback.
                                        </p>
                                    </div>
                                        <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2\">
                                        <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]\">
                                            Context Thread
                                        </p>
                                        <div className="space-y-1.5 text-[12px] text-[#d1d5db]\">
                                            <p>
                                                <span className="text-[#60a5fa]\">@author</span>: Original
                                                post providing context for this content.
                                            </p>
                                            <p>
                                                <span className="text-[#f97316]\">@reporter</span>: User
                                                describing why they flagged this content.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center text-[#6b7280] gap-2">
                                    <MessageCircle className="w-8 h-8 opacity-40\" />
                                    <p className="text-[13px]">
                                        Select a case from the queue to begin review.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="xl:w-1/4 w-full flex flex-col bg-[#050816] border border-[#1F2937] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#1F2937]">
                            <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]\">
                                Decision Panel
                            </p>
                            <p className="text-[11px] text-[#6b7280]\">
                                Moderators can take operational actions within strict
                                permissions.
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3\">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#022c22] text-[#6ee7b7] border border-[#10b981]/40 hover:bg-[#064e3b]"
                                >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#450a0a] text-[#fecaca] border border-[#7f1d1d] hover:bg-[#7f1d1d]"
                                >
                                    <ThumbsDown className="w-3.5 h-3.5" />
                                    Reject
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#111827] text-[#e5e7eb] border border-[#1f2937] hover:bg-[#1f2937]"
                                >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Remove Content
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#422006] text-[#facc15] border border-[#facc15]/40 hover:bg-[#713f12]"
                                >
                                    <Shield className="w-3.5 h-3.5" />
                                    Issue Warning
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSuspensionOpen(true)}
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#020617] text-[#e5e7eb] border border-[#1f2937] hover:bg-[#111827]\"
                                >
                                    <Clock className="w-3.5 h-3.5" />
                                    Temp Suspend
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEscalateOpen(true)}
                                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#0b1120] text-[#e0f2fe] border border-[#1d4ed8]/60 hover:bg-[#1d283a]\"
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                    Escalate
                                </button>
                            </div>

                            <div className="border border-[#1f2937] rounded-xl bg-[#020617] p-3 space-y-2\">
                                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]\">
                                    Violation Category
                                </p>
                                <select className="w-full bg-[#020617] border border-[#1f2937] rounded-full px-3 py-1.5 text-[12px] text-[#e5e7eb] focus:ring-1 focus:ring-[#1d9bf0] outline-none\">
                                    <option>Harassment / Bullying</option>
                                    <option>Hate Speech</option>
                                    <option>Threats / Safety Risk</option>
                                    <option>Spam / Scam</option>
                                    <option>NSFW / Sexual</option>
                                    <option>Other Policy</option>
                                </select>
                            </div>

                            <div className="border border-[#1f2937] rounded-xl bg-[#020617] p-3 space-y-2\">
                                <p className="text-[11px] font-semibold text-[#9ca3af] uppercase tracking-[0.16em]\">
                                    Internal Notes
                                </p>
                                <textarea
                                    rows={4}
                                    className="w-full rounded-xl bg-[#020617] border border-[#1f2937] text-[12px] text-[#e5e7eb] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1d9bf0]\"
                                    placeholder="Summarize your decision and any follow-up context for Admin / Super Admin review."
                                />
                            </div>

                            <div className="border border-[#1f2937] rounded-xl bg-[#020617] p-3 space-y-2 text-[11px] text-[#9ca3af]">
                                <p className="font-semibold uppercase tracking-[0.16em]">
                                    Permissions
                                </p>
                                <ul className="space-y-1.5">   
                                    <li>Moderators cannot permanently ban users.</li>
                                    <li>Role changes and system settings are restricted.</li>
                                    <li>
                                        Severe or ambiguous cases must be escalated to Admin.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <SuspensionModal
                open={suspensionOpen}
                onClose={() => setSuspensionOpen(false)}
                repeatOffender={!!selected?.repeatOffender}
            />
            <EscalateModal open={escalateOpen} onClose={() => setEscalateOpen(false)} />
        </div>

    );
}

