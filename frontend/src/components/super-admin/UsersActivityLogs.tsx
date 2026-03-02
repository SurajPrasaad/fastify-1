"use client";

import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    Calendar,
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    Filter,
    Lock,
    MapPin,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    Smartphone,
    User,
    UserX,
    X,
} from "lucide-react";

type Role = "User" | "Moderator" | "Admin" | "Super Admin";
type RiskLevel = "Low" | "Medium" | "High";
type Status = "Success" | "Failure" | "Suspicious";
type ActionType =
    | "Login"
    | "Logout"
    | "Post Created"
    | "Post Edited"
    | "Post Deleted"
    | "Role Updated"
    | "Account Suspended"
    | "Appeal Submitted"
    | "Risk Flag Triggered";

interface ActivityLog {
    id: string;
    timestamp: string;
    userId: string;
    userEmail: string;
    userHandle: string;
    role: Role;
    action: ActionType;
    targetType: "Post" | "Account" | "System";
    targetId: string;
    riskLevel: RiskLevel;
    ip: string;
    device: string;
    status: Status;
    location: string;
    sessionId: string;
    suspiciousSignals: string[];
    metadata: Record<string, unknown>;
}

const mockLogs: ActivityLog[] = [
    {
        id: "LOG-982134",
        timestamp: "2026-03-02T09:12:33Z",
        userId: "USR-0001",
        userEmail: "alex.m@company.com",
        userHandle: "@amorgan_official",
        role: "Moderator",
        action: "Risk Flag Triggered",
        targetType: "Post",
        targetId: "POST-442918",
        riskLevel: "High",
        ip: "13.54.221.10",
        device: "MacOS • Chrome",
        status: "Success",
        location: "US-West (Oregon)",
        sessionId: "sess_9fd3a2b7",
        suspiciousSignals: ["Rapid triage burst", "Model override"],
        metadata: {
            modelVersion: "mod-v7.3",
            riskScore: 0.94,
            previousRiskScore: 0.72,
            reasonCodes: ["HATE", "COORDINATED"],
        },
    },
    {
        id: "LOG-982129",
        timestamp: "2026-03-02T09:10:02Z",
        userId: "USR-0242",
        userEmail: "user242@example.com",
        userHandle: "@user_242",
        role: "User",
        action: "Login",
        targetType: "System",
        targetId: "AUTH",
        riskLevel: "Medium",
        ip: "185.22.19.44",
        device: "iOS • Safari",
        status: "Suspicious",
        location: "DE (Frankfurt)",
        sessionId: "sess_d2b14ef0",
        suspiciousSignals: ["IP country change", "Failed attempts > 3"],
        metadata: {
            failedAttempts: 4,
            previousIp: "10.0.0.1",
            mfaChallenged: true,
        },
    },
];

while (mockLogs.length < 80) {
    const base = mockLogs[mockLogs.length % 2];
    mockLogs.push({
        ...base,
        id: `LOG-${982000 + mockLogs.length}`,
        timestamp: new Date(Date.now() - mockLogs.length * 120000).toISOString(),
    });
}

const tableStyles: TableStyles = {
    table: { style: { backgroundColor: "transparent" } },
    tableWrapper: { style: { backgroundColor: "transparent" } },
    headRow: {
        style: {
            backgroundColor: "#16181C",
            borderBottomColor: "#2F3336",
            borderBottomWidth: "1px",
            minHeight: "44px",
        },
    },
    headCells: {
        style: {
            fontSize: "11px",
            fontWeight: 700,
            color: "#71767B",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            paddingLeft: "14px",
            paddingRight: "14px",
        },
    },
    rows: {
        style: {
            backgroundColor: "#000000",
            color: "#E7E9EA",
            borderBottomColor: "#2F3336",
            minHeight: "60px",
            fontFamily: "inherit",
            cursor: "pointer",
        },
        highlightOnHoverStyle: {
            backgroundColor: "#16181C",
            borderBottomColor: "#2F3336",
            outline: "none",
            transition: "all 0.15s ease",
        },
    },
    cells: {
        style: {
            paddingLeft: "14px",
            paddingRight: "14px",
        },
    },
    pagination: {
        style: {
            backgroundColor: "#000000",
            color: "#71767B",
            borderTopColor: "#2F3336",
            borderTopWidth: "1px",
            borderTopStyle: "solid",
            minHeight: "56px",
            fontFamily: "inherit",
            fontSize: "13px",
        },
        pageButtonsStyle: {
            borderRadius: "999px",
            height: "30px",
            width: "30px",
            padding: "4px",
            margin: "0 3px",
            cursor: "pointer",
            color: "#71767B",
            fill: "#71767B",
            backgroundColor: "transparent",
        },
    },
};

const riskColorClasses: Record<RiskLevel, string> = {
    Low: "bg-[#00BA7C]/10 text-[#00BA7C] border-[#00BA7C]/30",
    Medium: "bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/30",
    High: "bg-[#F97373]/10 text-[#F97373] border-[#F97373]/40 shadow-[0_0_20px_rgba(248,113,113,0.35)]",
};

const statusPillClasses: Record<Status, string> = {
    Success: "bg-[#00BA7C]/10 text-[#00BA7C] border-[#00BA7C]/30",
    Failure: "bg-[#F97373]/10 text-[#F97373] border-[#F97373]/40",
    Suspicious: "bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/40",
};

const activityVolumeConfig = {
    backgroundColor: "transparent",
    tooltip: {
        trigger: "axis",
        backgroundColor: "#16181C",
        borderColor: "#2F3336",
        textStyle: { color: "#E7E9EA", fontSize: 12 },
        axisPointer: { type: "shadow" },
    },
    grid: { top: 20, right: 8, bottom: 20, left: 32, containLabel: false },
    xAxis: {
        type: "category",
        data: ["00h", "04h", "08h", "12h", "16h", "20h"],
        axisLine: { lineStyle: { color: "#2F3336" } },
        axisTick: { show: false },
        axisLabel: { color: "#71767B", fontSize: 10, margin: 8 },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#2F3336", type: "dashed" } },
        axisLabel: { color: "#71767B", fontSize: 10 },
    },
    series: [
        {
            name: "Events",
            type: "line",
            smooth: true,
            symbolSize: 4,
            itemStyle: { color: "#1D9BF0" },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(29,155,240,0.25)" },
                        { offset: 1, color: "rgba(29,155,240,0)" },
                    ],
                },
            },
            data: [3200, 4100, 5100, 6200, 5800, 4500],
        },
    ],
};

const actionsByTypeConfig = {
    backgroundColor: "transparent",
    tooltip: {
        trigger: "axis",
        backgroundColor: "#16181C",
        borderColor: "#2F3336",
        textStyle: { color: "#E7E9EA", fontSize: 12 },
    },
    grid: { top: 20, right: 8, bottom: 20, left: 8, containLabel: true },
    xAxis: {
        type: "category",
        data: ["Login", "Posts", "Edits", "Deletes", "Appeals"],
        axisLine: { lineStyle: { color: "#2F3336" } },
        axisTick: { show: false },
        axisLabel: { color: "#71767B", fontSize: 10, margin: 8 },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#2F3336", type: "dashed" } },
        axisLabel: { color: "#71767B", fontSize: 10 },
    },
    series: [
        {
            type: "bar",
            barWidth: "45%",
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            data: [
                { value: 8200, itemStyle: { color: "#1D9BF0" } },
                { value: 5400, itemStyle: { color: "#22C55E" } },
                { value: 3100, itemStyle: { color: "#FBBF24" } },
                { value: 1800, itemStyle: { color: "#F97373" } },
                { value: 900, itemStyle: { color: "#A855F7" } },
            ],
        },
    ],
};

const rolesPieConfig = {
    backgroundColor: "transparent",
    tooltip: {
        trigger: "item",
        backgroundColor: "#16181C",
        borderColor: "#2F3336",
        textStyle: { color: "#E7E9EA", fontSize: 12 },
    },
    legend: { show: false },
    series: [
        {
            name: "Roles",
            type: "pie",
            radius: ["55%", "82%"],
            avoidLabelOverlap: false,
            itemStyle: { borderColor: "#000000", borderWidth: 2 },
            label: { show: false },
            data: [
                { value: 68, name: "User", itemStyle: { color: "#1D9BF0" } },
                { value: 18, name: "Moderator", itemStyle: { color: "#22C55E" } },
                { value: 10, name: "Admin", itemStyle: { color: "#FBBF24" } },
                { value: 4, name: "Super Admin", itemStyle: { color: "#F97373" } },
            ],
        },
    ],
};

const JsonInspector = ({ data }: { data: Record<string, unknown> }) => {
    const pretty = JSON.stringify(data, null, 2);
    const handleCopy = () => {
        if (globalThis.navigator?.clipboard) {
            void globalThis.navigator.clipboard.writeText(pretty);
        }
    };
    return (
        <div className="mt-3 bg-[#050608] border border-[#2F3336] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#2F3336]">
                <span className="text-[11px] font-mono text-[#71767B] uppercase tracking-[0.12em]">
                    Raw Metadata
                </span>
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#2F3336] text-[11px] text-[#E7E9EA] hover:bg-[#111827]"
                >
                    <Copy className="w-3.5 h-3.5 text-[#71767B]" />
                    Copy JSON
                </button>
            </div>
            <pre className="max-h-64 overflow-auto text-[11px] leading-5 font-mono text-[#E5E7EB] bg-transparent px-3 py-2">
                {pretty}
            </pre>
        </div>
    );
};

const TimelineDrawer = ({
    log,
    onClose,
}: {
    log: ActivityLog | null;
    onClose: () => void;
}) => {
    if (!log) return null;
    const rapidBurst = log.suspiciousSignals.includes("Rapid triage burst");
    const ipChange = log.suspiciousSignals.includes("IP country change");

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="w-full max-w-[520px] bg-black border-l border-[#2F3336] h-full shadow-2xl relative flex flex-col">
                <div className="px-6 py-4 border-b border-[#2F3336] bg-[#000000] flex items-center justify-between">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#E7E9EA] flex items-center gap-2">
                            User Timeline
                            <span className="text-[12px] font-mono text-[#71767B]">
                                {log.userId}
                            </span>
                        </h2>
                        <p className="text-[12px] text-[#71767B]">
                            Forensic view of recent activity and risk signals.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-[#2F3336] bg-[#050608] flex items-center justify-between">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#111827] border border-[#1F2937] flex items-center justify-center">
                            <User className="w-4 h-4 text-[#E7E9EA]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-bold text-[#E7E9EA]">
                                    {log.userEmail}
                                </span>
                                <span className="text-[12px] text-[#71767B]">
                                    {log.userHandle}
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#111827] border border-[#1F2937] text-[#E7E9EA]">
                                    <Shield className="w-3 h-3 mr-1 text-[#71767B]" />
                                    {log.role}
                                </span>
                                <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] ${riskColorClasses[log.riskLevel]}`}
                                >
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Risk: {log.riskLevel}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[11px] text-[#71767B]">
                        <span className="inline-flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5" />
                            {log.device}
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {log.location}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    <div>
                        <h3 className="text-[12px] font-bold text-[#71767B] uppercase tracking-[0.16em] mb-3">
                            Chronological Activity
                        </h3>
                        <div className="relative pl-4">
                            <div className="absolute left-1 top-0 bottom-0 w-px bg-[#1F2937]" />
                            <div className="space-y-4">
                                <div className="relative flex gap-3">
                                    <div className="absolute -left-[7px] top-2 w-3.5 h-3.5 rounded-full bg-[#1D9BF0]" />
                                    <div className="flex-1 bg-[#020617] border border-[#1D9BF0]/40 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[13px]">
                                                <Lock className="w-4 h-4 text-[#1D9BF0]" />
                                                <span className="font-semibold text-[#E7E9EA]">
                                                    {log.action}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-[#71767B] font-mono">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-[12px] text-[#9CA3AF]">
                                            Target: {log.targetType} {log.targetId}
                                        </div>
                                        {(rapidBurst || ipChange) && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {rapidBurst && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#F97373]/10 text-[#F97373] border border-[#F97373]/40">
                                                        <Activity className="w-3 h-3" /> Rapid action burst
                                                    </span>
                                                )}
                                                {ipChange && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/40">
                                                        <AlertCircle className="w-3 h-3" /> IP
                                                        country change
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="relative flex gap-3 opacity-80">
                                    <div className="absolute -left-[7px] top-2 w-3.5 h-3.5 rounded-full bg-[#374151]" />
                                    <div className="flex-1 bg-[#020617] border border-[#111827] rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[13px]">
                                                <Activity className="w-4 h-4 text-[#71767B]" />
                                                <span className="font-semibold text-[#E7E9EA]">
                                                    Prior activity
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-[#71767B] font-mono">
                                                -3m
                                            </span>
                                        </div>
                                        <div className="mt-1 text-[12px] text-[#9CA3AF]">
                                            Suspicious login attempts or content edits would
                                            appear here.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-[12px] font-bold text-[#71767B] uppercase tracking-[0.16em] mb-3">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-[#2F3336] text-[13px] font-semibold text-[#E7E9EA] hover:bg-[#1F2937]"
                            >
                                <UserX className="w-4 h-4 text-[#F97373]" />
                                Suspend User
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-[#2F3336] text-[13px] font-semibold text-[#E7E9EA] hover:bg-[#1F2937]"
                            >
                                <ShieldAlert className="w-4 h-4 text-[#FBBF24]" />
                                Escalate Case
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#111827] border border-[#2F3336] text-[13px] font-semibold text-[#E7E9EA] hover:bg-[#1F2937]"
                            >
                                <AlertCircle className="w-4 h-4 text-[#1D9BF0]" />
                                Flag for Review
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#F3F4F6] text-[13px] font-semibold text-black hover:bg-white"
                            >
                                View Full Profile
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <JsonInspector data={log.metadata} />
                </div>
            </div>
        </div>
    );
};

export default function SuperAdminUsersActivityLogs() {
    const [filtersOpen, setFiltersOpen] = useState(true);
    const [selected, setSelected] = useState<ActivityLog | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("All roles");
    const [riskFilter, setRiskFilter] = useState<string>("Any risk");
    const [actionFilter, setActionFilter] = useState<string>("All actions");
    const [statusFilter, setStatusFilter] = useState<string>("Any status");

    const filteredLogs = useMemo(
        () =>
            mockLogs.filter((log) => {
                const s = search.toLowerCase();
                const matchesSearch =
                    !s ||
                    log.userEmail.toLowerCase().includes(s) ||
                    log.userHandle.toLowerCase().includes(s) ||
                    log.userId.toLowerCase().includes(s) ||
                    log.ip.toLowerCase().includes(s);
                const matchesRole =
                    roleFilter === "All roles" || log.role === roleFilter;
                const matchesRisk =
                    riskFilter === "Any risk" || log.riskLevel === riskFilter;
                const matchesAction =
                    actionFilter === "All actions" || log.action === actionFilter;
                const matchesStatus =
                    statusFilter === "Any status" || log.status === statusFilter;
                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesRisk &&
                    matchesAction &&
                    matchesStatus
                );
            }),
        [search, roleFilter, riskFilter, actionFilter, statusFilter],
    );

    const columns: TableColumn<ActivityLog>[] = [
        {
            name: "",
            width: "40px",
            cell: () => (
                <button
                    type="button"
                    className="p-1 rounded-full text-[#4B5563] hover:text-[#E5E7EB] hover:bg-[#1F2937]"
                    aria-label="Open timeline"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            ),
        },
        {
            name: "Timestamp",
            sortable: true,
            selector: (row) => row.timestamp,
            cell: (row) => (
                <div className="flex flex-col py-1">
                    <span className="text-[13px] font-mono text-[#E5E7EB]">
                        {new Date(row.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                        {new Date(row.timestamp).toLocaleDateString()}
                    </span>
                </div>
            ),
            width: "140px",
        },
        {
            name: "User",
            sortable: true,
            selector: (row) => row.userEmail,
            cell: (row) => (
                <div className="flex flex-col py-1 min-w-0">
                    <span className="text-[13px] font-medium text-[#E5E7EB] truncate">
                        {row.userEmail}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                        {row.userHandle} • {row.userId}
                    </span>
                </div>
            ),
            minWidth: "220px",
        },
        {
            name: "Role",
            selector: (row) => row.role,
            cell: (row) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#111827] border border-[#1F2937] text-[#E5E7EB]">
                    {row.role}
                </span>
            ),
            width: "110px",
        },
        {
            name: "Action",
            sortable: true,
            selector: (row) => row.action,
            cell: (row) => (
                <div className="flex flex-col py-1">
                    <span className="text-[13px] text-[#E5E7EB] font-medium">
                        {row.action}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                        {row.targetType} {row.targetId}
                    </span>
                </div>
            ),
            minWidth: "200px",
        },
        {
            name: "Risk",
            selector: (row) => row.riskLevel,
            cell: (row) => (
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${riskColorClasses[row.riskLevel]}`}
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 bg-current" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
                    </span>
                    {row.riskLevel}
                </span>
            ),
            width: "110px",
        },
        {
            name: "IP / Device",
            selector: (row) => row.ip,
            cell: (row) => (
                <div className="flex flex-col py-1">
                    <span className="text-[13px] font-mono text-[#E5E7EB]">
                        {row.ip}
                    </span>
                    <span className="text-[11px] text-[#6B7280]">{row.device}</span>
                </div>
            ),
            minWidth: "190px",
        },
        {
            name: "Status",
            selector: (row) => row.status,
            cell: (row) => (
                <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusPillClasses[row.status]}`}
                >
                    {row.status === "Success" && (
                        <Activity className="w-3 h-3 text-[#00BA7C]" />
                    )}
                    {row.status === "Failure" && (
                        <AlertTriangle className="w-3 h-3 text-[#F97373]" />
                    )}
                    {row.status === "Suspicious" && (
                        <ShieldAlert className="w-3 h-3 text-[#FBBF24]" />
                    )}
                    {row.status}
                </span>
            ),
            width: "130px",
        },
    ];

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
                        <Activity className="w-5 h-5 text-[#1D9BF0]" />
                        User Activity Logs
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">
                        Platform-wide behavioral tracking and audit history.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111827] border border-[#2F3336] text-[12px] font-semibold text-[#E5E7EB] hover:bg-[#1F2937]"
                    >
                        <Calendar className="w-4 h-4 text-[#9CA3AF]" />
                        Last 24 hours
                        <ChevronDown className="w-3 h-3 text-[#6B7280]" />
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111827] border border-[#1F2937] text-[12px] font-semibold text-[#E5E7EB] hover:bg-[#1F2937]"
                    >
                        <RefreshCw className="w-3.5 h-3.5 text-[#9CA3AF]" />
                        Refresh
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E5E7EB] text-[12px] font-semibold text-black hover:bg-white"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV / JSON
                    </button>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111827] border border-[#1F2937] text-[11px] font-mono text-[#9CA3AF]">
                        {filteredLogs.length.toString().padStart(3, "0")} records
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[180px]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                                Volume
                            </span>
                            <span className="text-[11px] text-[#6B7280]">Events / hour</span>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ReactECharts
                                option={activityVolumeConfig}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                }}
                            />
                        </div>
                    </div>
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[180px]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                                Actions by Type
                            </span>
                            <span className="text-[11px] text-[#6B7280]">Last 24h</span>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ReactECharts
                                option={actionsByTypeConfig}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                }}
                            />
                        </div>
                    </div>
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex items-center justify-between min-h-[180px]">
                        <div className="flex-1">
                            <span className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                                Role Distribution
                            </span>
                            <div className="mt-3 space-y-1.5 text-[12px] text-[#E5E7EB]">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#1D9BF0]" />
                                    Users
                                    <span className="ml-auto text-[#9CA3AF]">68%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                                    Moderators
                                    <span className="ml-auto text-[#9CA3AF]">18%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
                                    Admins
                                    <span className="ml-auto text-[#9CA3AF]">10%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#F97373]" />
                                    Super Admin
                                    <span className="ml-auto text-[#9CA3AF]">4%</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-[120px] h-[120px] relative">
                            <ReactECharts
                                option={rolesPieConfig}
                                style={{
                                    height: "100%",
                                    width: "100%",
                                    position: "absolute",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[#050816] border border-[#1F2937] rounded-xl">
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 border-b border-[#1F2937] text-[12px] font-semibold text-[#E5E7EB]"
                    >
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-[#9CA3AF]" />
                            Advanced Filters
                            <span className="text-[11px] text-[#6B7280]">
                                User / action / role / risk / IP / device / status
                            </span>
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 text-[#6B7280] transition-transform ${
                                filtersOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>
                    {filtersOpen && (
                        <div className="px-4 py-3 grid grid-cols-1 xl:grid-cols-6 gap-3">
                            <div className="col-span-2">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-[#6B7280]" />
                                    </span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="block w-full pl-9 pr-3 py-2 bg-[#020617] border border-[#1F2937] rounded-full text-[13px] text-[#E5E7EB] placeholder-[#6B7280] focus:ring-1 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] outline-none"
                                        placeholder="Search user, email, ID, or IP…"
                                    />
                                </div>
                            </div>
                            <div>
                                <select
                                    value={actionFilter}
                                    onChange={(e) => setActionFilter(e.target.value)}
                                    className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-2 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                                >
                                    <option>All actions</option>
                                    <option>Login</option>
                                    <option>Logout</option>
                                    <option>Post Created</option>
                                    <option>Post Edited</option>
                                    <option>Post Deleted</option>
                                    <option>Role Updated</option>
                                    <option>Account Suspended</option>
                                    <option>Appeal Submitted</option>
                                    <option>Risk Flag Triggered</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-2 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                                >
                                    <option>All roles</option>
                                    <option>User</option>
                                    <option>Moderator</option>
                                    <option>Admin</option>
                                    <option>Super Admin</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    value={riskFilter}
                                    onChange={(e) => setRiskFilter(e.target.value)}
                                    className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-2 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                                >
                                    <option>Any risk</option>
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            </div>
                            <div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-2 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                                >
                                    <option>Any status</option>
                                    <option>Success</option>
                                    <option>Failure</option>
                                    <option>Suspicious</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setRoleFilter("All roles");
                                        setRiskFilter("Any risk");
                                        setActionFilter("All actions");
                                        setStatusFilter("Any status");
                                    }}
                                    className="px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#1D9BF0] text-white hover:bg-[#3B82F6]"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-[#000000] border border-[#1F2937] rounded-xl overflow-hidden">
                    <DataTable
                        columns={columns}
                        data={filteredLogs}
                        customStyles={tableStyles}
                        highlightOnHover
                        pointerOnHover
                        pagination
                        paginationPerPage={20}
                        paginationRowsPerPageOptions={[20, 50, 100]}
                        onRowClicked={(row) => setSelected(row)}
                        noDataComponent={
                            <div className="py-14 flex flex-col items-center text-center text-[#6B7280]">
                                <Shield className="w-10 h-10 mb-3 opacity-40" />
                                <p className="text-[14px] font-semibold text-[#E5E7EB]">
                                    No activity logs match the current filters.
                                </p>
                                <p className="text-[12px]">
                                    Adjust your filters or date range to broaden the search.
                                </p>
                            </div>
                        }
                    />
                </div>
            </div>

            <TimelineDrawer log={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
