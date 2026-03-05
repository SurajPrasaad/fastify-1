"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search, Filter, Download, MoreVertical, ShieldAlert,
    AlertTriangle, CheckCircle, X, Clock, MessageSquare, AlertCircle,
    UserX, Shield, Flag, User, FileText, ArrowUpRight, Activity, XCircle
} from "lucide-react";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ==========================================
// 1. TYPES & SOURCE DATA
// ==========================================

type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
type ReportStatus = 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';
type ContentType = 'User' | 'Post' | 'Comment';
type Category = 'Spam' | 'Harassment' | 'Hate' | 'Violence' | 'NSFW' | 'Fraud' | 'Other';

interface ReportData {
    id: string; // human-readable report id
    reportId: string; // backend moderation_reports.id
    queueId: string; // moderation_queue.id
    severity: Severity;
    contentType: ContentType;
    reportedEntityId: string;
    reportedEntityName: string;
    reporterCount: number;
    category: Category;
    createdAt: string;
    assignedTo?: string;
    status: ReportStatus;
    sla: string;
    description: string;
    linkedContentStr: string;
}

// ==========================================
// 2. DESIGN TOKENS & STYLES (DevAtlas Dark)
// ==========================================

const customStyles: TableStyles = {
    table: {
        style: {
            backgroundColor: 'transparent',
        },
    },
    tableWrapper: {
        style: {
            backgroundColor: 'transparent',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#16181C',
            borderBottomColor: '#2F3336',
            borderBottomWidth: '1px',
            minHeight: '48px',
        },
    },
    headCells: {
        style: {
            fontSize: '11px',
            fontWeight: '700',
            color: '#71767B',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '16px',
            paddingRight: '16px',
        },
    },
    cells: {
        style: {
            paddingLeft: '16px',
            paddingRight: '16px',
        },
    },
    rows: {
        style: {
            backgroundColor: '#000000',
            color: '#E7E9EA',
            borderBottomColor: '#2F3336',
            minHeight: '64px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: '#16181C',
            color: '#E7E9EA',
            borderBottomColor: '#2F3336',
            outline: 'none',
            transition: 'all 0.15s ease',
        },
    },
    pagination: {
        style: {
            backgroundColor: '#000000',
            color: '#71767B',
            borderTopColor: '#2F3336',
            borderTopWidth: '1px',
            borderTopStyle: 'solid',
            minHeight: '60px',
            fontFamily: 'inherit',
            fontWeight: '600',
            fontSize: '13px',
        },
        pageButtonsStyle: {
            borderRadius: '8px',
            height: '32px',
            width: '32px',
            padding: '4px',
            margin: '0 4px',
            cursor: 'pointer',
            transition: '0.2s',
            color: '#71767B',
            fill: '#71767B',
            backgroundColor: 'transparent',
            '&:disabled': {
                cursor: 'unset',
                color: '#2F3336',
                fill: '#2F3336',
            },
            '&:hover:not(:disabled)': {
                backgroundColor: '#16181C',
                color: '#E7E9EA'
            },
            '&:focus': {
                outline: 'none',
                backgroundColor: '#16181C',
            },
        },
    },
};

// ==========================================
// 3. BADGE COMPONENTS
// ==========================================

const SeverityBadge = ({ severity }: { severity: Severity }) => {
    const config = {
        Low: { color: 'text-[#71767B]', bg: 'bg-[#2F3336]', ring: 'border-transparent' },
        Medium: { color: 'text-[#FFD400]', bg: 'bg-[#FFD400]/10', ring: 'border-[#FFD400]/20' },
        High: { color: 'text-[#F91880]', bg: 'bg-[#F91880]/10', ring: 'border-[#F91880]/20' },
        Critical: { color: 'text-white', bg: 'bg-[#F91880]', ring: 'border-white/20 animate-pulse' }
    };
    const c = config[severity];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${c.bg} ${c.color} ${c.ring}`}>
            {severity}
        </span>
    );
};

const StatusBadge = ({ status }: { status: ReportStatus }) => {
    const config = {
        Pending: 'bg-[#1D9BF0]/10 text-[#1D9BF0] border-[#1D9BF0]/20',
        'Under Review': 'bg-[#8247E5]/10 text-[#8247E5] border-[#8247E5]/20',
        Resolved: 'bg-[#00BA7C]/10 text-[#00BA7C] border-[#00BA7C]/20',
        Rejected: 'bg-[#2F3336] text-[#71767B] border-[#333639]'
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${config[status]}`}>
            {status}
        </span>
    );
};

const ContentTypeIcon = ({ type }: { type: ContentType }) => {
    const icons = {
        User: User,
        Post: FileText,
        Comment: MessageSquare
    };
    const Icon = icons[type];
    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#16181C] border border-[#2F3336] rounded-md text-[11px] text-[#E7E9EA]">
            <Icon className="w-3 h-3 text-[#71767B]" />
            {type}
        </div>
    );
};

// Map backend report category enum to UI label
const mapBackendCategoryToUi = (category: string): Category => {
    switch (category) {
        case "SPAM":
            return "Spam";
        case "HARASSMENT":
            return "Harassment";
        case "HATE_SPEECH":
            return "Hate";
        case "INAPPROPRIATE":
        case "CHILD_SAFETY":
            return "NSFW";
        default:
            return "Other";
    }
};

// Map UI category filter to backend enum
const mapFilterCategoryToBackend = (category: string): string | undefined => {
    switch (category) {
        case "Spam":
            return "SPAM";
        case "Fraud":
            return "OTHER";
        case "Hate":
            return "HATE_SPEECH";
        case "Harassment":
            return "HARASSMENT";
        case "NSFW":
            // NSFW groups multiple backend categories (INAPPROPRIATE, CHILD_SAFETY),
            // so we fetch all categories from the backend and filter client-side.
            return "INAPPROPRIATE, CHILD_SAFETY";
        default:
            return undefined;
    }
};

// Derive severity from priority / reports count
const computeSeverity = (priority: number, reports: number): Severity => {
    const score = Math.max(priority || 0, reports || 0);
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 30) return "Medium";
    return "Low";
};

const mapQueueItemToReport = (row: any): ReportData => {
    const category = mapBackendCategoryToUi(row.category);
    const severity = computeSeverity(row.priority ?? 0, row.reports ?? 0);
    const reporterCount = row.reports ?? 1;
    const createdAt = row.createdAt ? new Date(row.createdAt).toLocaleString() : "";
    const sla = row.createdAt
        ? (() => {
              const diffMs = Date.now() - new Date(row.createdAt).getTime();
              const diffH = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
              return `${diffH}h ago`;
          })()
        : "-";

    const status: ReportStatus = row.status === "PENDING"
        ? row.assignedToId
            ? "Under Review"
            : "Pending"
        : row.status === "RESOLVED"
        ? "Resolved"
        : "Rejected";

    const contentType: ContentType = row.postId
        ? "Post"
        : row.commentId
        ? "Comment"
        : "User";

    const reportedEntityId = row.postId || row.commentId || row.targetUserId || row.reportId;
    const reportedEntityName =
        row.authorName ||
        row.content?.slice(0, 40) ||
        (contentType === "User" ? "@user" : "Reported content");

    return {
        id: row.reportId ?? row.id,
        reportId: row.reportId ?? row.id,
        queueId: row.id,
        severity,
        contentType,
        reportedEntityId,
        reportedEntityName,
        reporterCount,
        category,
        createdAt,
        assignedTo: row.assignedToId ?? "Unassigned",
        status,
        sla,
        description: row.reason ?? "",
        linkedContentStr: row.content || "",
    };
};

// ==========================================
// 4. DRAWER COMPONENT
// ==========================================

const InvestigationDrawer = ({
    report,
    onClose,
    onReject,
    onResolve,
    onMarkUnderReview,
}: {
    report: ReportData | null;
    onClose: () => void;
    onReject: (report: ReportData) => void;
    onResolve: (report: ReportData) => void;
    onMarkUnderReview: (report: ReportData) => void;
}) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Content' | 'Insights' | 'History'>('Overview');

    if (!report) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-[550px] bg-black border-l border-[#2F3336] h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-[#2F3336] flex items-center justify-between shrink-0 bg-[#000000]">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-[18px] font-bold text-[#E7E9EA] flex items-center gap-2">
                                Investigation
                                <span className="text-[#1D9BF0] font-mono text-[14px]">{report.id}</span>
                            </h2>
                        </div>
                    </div>
                    <SeverityBadge severity={report.severity} />
                </div>

                {/* Status Header Block */}
                <div className="px-6 py-4 border-b border-[#2F3336] bg-[#16181C]/50 shrink-0 flex items-center justify-between">
                    <div>
                        <div className="text-[12px] text-[#71767B] mb-1 uppercase tracking-wider font-bold">Current Status</div>
                        <StatusBadge status={report.status} />
                    </div>
                    <div className="text-right">
                        <div className="text-[12px] text-[#71767B] mb-1 uppercase tracking-wider font-bold">Assigned To</div>
                        <div className="text-[14px] text-[#E7E9EA]">{report.assignedTo}</div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-[#2F3336] px-2 shrink-0 bg-[#000000]">
                    {(['Overview', 'Content', 'Insights', 'History'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-[13px] font-bold transition-all relative ${activeTab === tab ? 'text-[#1D9BF0]' : 'text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C]'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D9BF0] rounded-t-full"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-[#000000]">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Metadata */}
                            <div>
                                <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Report Details</h4>
                                <div className="bg-[#16181C] rounded-xl border border-[#2F3336] divide-y divide-[#2F3336]">
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-[#71767B]">Category</span>
                                        <span className="text-[#E7E9EA] font-bold">{report.category}</span>
                                    </div>
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-[#71767B]">Total Reporters</span>
                                        <span className="text-[#1D9BF0] font-bold px-2 py-0.5 bg-[#1D9BF0]/10 rounded-md">
                                            {report.reporterCount} Users
                                        </span>
                                    </div>
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-[#71767B]">Time Since First Report</span>
                                        <span className="text-[#E7E9EA]">{report.sla}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Targeted Entity */}
                            <div>
                                <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Target Entity</h4>
                                <div className="p-4 bg-[#16181C] border border-[#2F3336] rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ContentTypeIcon type={report.contentType} />
                                        <span className="text-[13px] font-mono text-[#71767B]">{report.reportedEntityId}</span>
                                    </div>
                                    <div className="text-[15px] font-bold text-[#E7E9EA] truncate">
                                        {report.reportedEntityName}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Aggregated User Description</h4>
                                <div className="p-4 bg-[#2F3336]/30 border border-[#2F3336] rounded-xl text-[14px] text-[#E7E9EA] italic leading-relaxed">
                                    "{report.description}"
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Content' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between p-3 bg-[#1D9BF0]/10 border border-[#1D9BF0]/20 rounded-xl">
                                <span className="text-[13px] text-[#1D9BF0] font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Original content snapshot at time of report
                                </span>
                            </div>
                            <div className="h-64 border border-[#2F3336] rounded-xl bg-[#16181C] flex items-center justify-center p-6 text-center shadow-inner">
                                <div>
                                    <Search className="w-12 h-12 text-[#2F3336] mx-auto mb-4" />
                                    <p className="text-[14px] text-[#E7E9EA] font-semibold">Live Content Preview Loader</p>
                                    <p className="text-[12px] text-[#71767B] mt-1">Requires authentication to iframe isolated content.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'Insights' || activeTab === 'History') && (
                        <div className="flex flex-col items-center justify-center h-48 text-center animate-in fade-in duration-200">
                            <Activity className="w-8 h-8 text-[#2F3336] mb-3" />
                            <p className="text-[14px] text-[#71767B] font-medium">Detailed {activeTab.toLowerCase()} tracing coming soon.</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#2F3336] bg-[#000000] shrink-0 grid grid-cols-2 gap-3">
                    <button
                        className="flex items-center justify-center gap-2 py-2.5 bg-[#16181C] hover:bg-[#333639] text-[#E7E9EA] border border-[#2F3336] rounded-xl text-[13px] font-bold transition-colors"
                        onClick={() => onReject(report)}
                    >
                        <XCircle className="w-4 h-4" /> Reject Report
                    </button>
                    <button
                        className="flex items-center justify-center gap-2 py-2.5 bg-[#F91880] hover:bg-[#F91880]/80 text-white rounded-xl text-[13px] font-bold transition-colors shadow-[0_0_15px_rgba(249,24,128,0.3)]"
                        onClick={() => onResolve(report)}
                    >
                        <UserX className="w-4 h-4" /> Resolve & Remove
                    </button>
                    {report.status !== "Under Review" && (
                        <button
                            className="col-span-2 flex items-center justify-center gap-2 py-2.5 bg-[#1D9BF0]/10 hover:bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/30 rounded-xl text-[13px] font-bold transition-colors mt-1"
                            onClick={() => onMarkUnderReview(report)}
                        >
                            <Clock className="w-4 h-4" /> Mark Under Review
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 5. MAIN PAGE COMPONENT
// ==========================================

export default function ReportsManagementPage() {
    const [filterText, setFilterText] = useState("");
    const [selectedRows, setSelectedRows] = useState<ReportData[]>([]);
    const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<string>("All Severities");
    const [filterCategory, setFilterCategory] = useState<string>("All Categories");
    const [reports, setReports] = useState<ReportData[]>([]);

    const backendCategory = useMemo(
        () => mapFilterCategoryToBackend(filterCategory),
        [filterCategory],
    );

    const queueQuery = trpc.moderation.getReportQueue.useQuery(
        {
            limit: 60,
            category: backendCategory,
        },
        {
            refetchInterval: 60_000,
        },
    );

    const resolveMutation = trpc.moderation.resolveReport.useMutation();
    const assignTaskMutation = trpc.moderation.assignTask.useMutation();

    useEffect(() => {
        if (queueQuery.data) {
            const mapped = (queueQuery.data as any[]).map(mapQueueItemToReport);
            setReports(mapped);
        }
    }, [queueQuery.data]);

    const filteredData = useMemo(() => {
        return reports.filter(item => {
            const matchesSearch =
                item.id.toLowerCase().includes(filterText.toLowerCase()) ||
                item.reportedEntityName.toLowerCase().includes(filterText.toLowerCase()) ||
                item.reportedEntityId.toLowerCase().includes(filterText.toLowerCase());

            const matchesSeverity = filterSeverity === "All Severities" || item.severity === filterSeverity;
            const matchesCategory = filterCategory === "All Categories" || item.category === filterCategory;

            return matchesSearch && matchesSeverity && matchesCategory;
        });
    }, [filterText, filterSeverity, filterCategory, reports]);

    const handleRowSelected = ({ selectedRows }: { selectedRows: ReportData[] }) => {
        setSelectedRows(selectedRows);
    };

    const handleReject = (report: ReportData) => {
        resolveMutation.mutate(
            {
                reportId: report.reportId,
                action: "APPROVE",
                resolution: "Report rejected as not actionable from admin panel",
            },
            {
                onSuccess: () => {
                    toast.success("Report rejected");
                    queueQuery.refetch();
                    setSelectedReport(null);
                },
                onError: (err: any) => {
                    toast.error(err?.message ?? "Failed to reject report");
                },
            },
        );
    };

    const handleResolve = (report: ReportData) => {
        resolveMutation.mutate(
            {
                reportId: report.reportId,
                action: "SOFT_DELETE",
                resolution: "Resolved and content removed from admin panel",
            },
            {
                onSuccess: () => {
                    toast.success("Report resolved and content removed");
                    queueQuery.refetch();
                    setSelectedReport(null);
                },
                onError: (err: any) => {
                    toast.error(err?.message ?? "Failed to resolve report");
                },
            },
        );
    };

    const handleMarkUnderReview = (report: ReportData) => {
        assignTaskMutation.mutate(
            { queueId: report.queueId },
            {
                onSuccess: () => {
                    toast.success("Report marked as under review");
                    queueQuery.refetch();
                    setSelectedReport((prev) =>
                        prev && prev.id === report.id ? { ...prev, status: "Under Review" } : prev,
                    );
                },
                onError: (err: any) => {
                    toast.error(err?.message ?? "Failed to mark report under review");
                },
            },
        );
    };

    const exportCsv = () => {
        const rows = filteredData;
        if (!rows.length) {
            toast.error("No reports to export");
            return;
        }
        const headers = [
            "id",
            "severity",
            "category",
            "status",
            "contentType",
            "reportedEntityId",
            "reportedEntityName",
            "reporterCount",
            "assignedTo",
            "createdAt",
            "sla",
        ];
        const csvRows = rows.map((r) =>
            [
                r.id,
                r.severity,
                r.category,
                r.status,
                r.contentType,
                r.reportedEntityId,
                r.reportedEntityName,
                r.reporterCount,
                r.assignedTo ?? "",
                r.createdAt,
                r.sla,
            ]
                .map((c) => `"${String(c).replaceAll('"', '""')}"`)
                .join(","),
        );
        const csv = [headers.join(","), ...csvRows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reports-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const columns: TableColumn<ReportData>[] = [
        {
            name: 'Report ID',
            selector: row => row.id,
            cell: row => (
                <div className="py-2">
                    <span className="text-[13px] font-mono text-[#E7E9EA] block mb-1">{row.id}</span>
                    <span className="text-[11px] text-[#71767B]">{row.createdAt}</span>
                </div>
            ),
            width: '120px'
        },
        {
            name: 'Severity',
            selector: row => row.severity,
            sortable: true,
            cell: row => <SeverityBadge severity={row.severity} />,
            width: '100px'
        },
        {
            name: 'Reported Entity',
            selector: row => row.reportedEntityName,
            cell: row => (
                <div className="py-2 flex flex-col justify-center min-w-0 pr-4 w-full">
                    <div className="flex items-center gap-2 mb-1">
                        <ContentTypeIcon type={row.contentType} />
                        <span className="text-[11px] text-[#71767B] font-mono truncate">{row.reportedEntityId}</span>
                    </div>
                    <div className="text-[13px] text-[#E7E9EA] truncate font-medium">
                        {row.reportedEntityName}
                    </div>
                </div>
            ),
            width: '300px'
        },
        {
            name: 'Category & Flags',
            selector: row => row.category,
            sortable: true,
            cell: row => (
                <div className="py-2">
                    <div className="text-[13px] font-bold text-[#E7E9EA] mb-1">{row.category}</div>
                    <div className="text-[12px] text-[#F91880] font-medium flex items-center gap-1">
                        <Flag className="w-3 h-3" /> {row.reporterCount} Reports
                    </div>
                </div>
            ),
            width: '160px'
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            cell: row => <StatusBadge status={row.status} />,
            width: '130px'
        },
        {
            name: 'Assigned',
            selector: row => row.assignedTo || '',
            sortable: true,
            cell: row => <div className="text-[13px] text-[#71767B] font-medium">{row.assignedTo}</div>,
            width: '140px'
        },
        {
            name: 'SLA',
            selector: row => row.sla,
            sortable: true,
            cell: row => <div className="text-[13px] font-mono text-[#71767B]">{row.sla}</div>,
            width: '100px'
        },
        {
            name: '',
            cell: row => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedReport(row); }}
                    className="p-2 text-[#71767B] hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10 rounded-full transition-colors ml-auto shadow-sm"
                    title="Open Investigation"
                >
                    <ArrowUpRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
            ),
            button: true,
            width: '60px'
        }
    ];

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] text-[#E7E9EA] h-[100vh] font-display">
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Minimal strict scrollbar for FAANG density */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2F3336; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #71767B; }

                /* react-data-table-component custom checkbox */
                .rdt_TableCol .sc-kOHTFB, .rdt_TableCell .sc-kOHTFB { margin-left: 12px; }
                input[type="checkbox"] {
                   accent-color: #1D9BF0;
                   cursor: pointer;
                   width: 16px;
                   height: 16px;
                   border-radius: 4px;
                   background-color: transparent;
                   border: 1px solid #71767B;
                }
                `
            }} />

            {/* Top Toolbar / Header */}
            <div className="px-6 py-5 border-b border-[#2F3336] bg-[#000000]/90 backdrop-blur-md z-10 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#E7E9EA] flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-[#F91880]" />
                        Reports Triage Queue
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">
                        Prioritize, investigate, and resolve user-generated incident reports.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {queueQuery.isFetching && (
                        <span className="text-[12px] text-[#1D9BF0] animate-pulse">Updating…</span>
                    )}
                    <button
                        className="flex items-center gap-2 px-3 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors"
                        onClick={exportCsv}
                    >
                        <Download className="w-4 h-4 text-[#71767B]" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-[#000000] border-b border-[#2F3336] flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative w-full max-w-[280px]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[#71767B]" />
                        </span>
                        <input
                            type="text"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="block w-full pl-9 pr-4 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] text-[#E7E9EA] placeholder-[#71767B] focus:ring-1 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] outline-none transition-all"
                            placeholder="Search Entity ID or Report ID..."
                        />
                    </div>

                    <div className="h-6 w-[1px] bg-[#2F3336] hidden sm:block"></div>

                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="bg-[#16181C] border border-[#2F3336] py-2 px-3.5 rounded-full text-[13px] font-bold text-[#E7E9EA] focus:ring-1 focus:ring-[#1D9BF0] outline-none cursor-pointer hover:bg-[#2F3336] transition-colors appearance-none"
                    >
                        <option>All Severities</option>
                        <option>Critical</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                    </select>

                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-[#16181C] border border-[#2F3336] py-2 px-3.5 rounded-full text-[13px] font-bold text-[#E7E9EA] focus:ring-1 focus:ring-[#1D9BF0] outline-none cursor-pointer hover:bg-[#2F3336] transition-colors appearance-none"
                    >
                        <option>All Categories</option>
                        <option>Spam</option>
                        <option>Fraud</option>
                        <option>Hate</option>
                        <option>Harassment</option>
                        <option>NSFW</option>
                    </select>

                    <button className="flex items-center gap-2 px-3.5 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors">
                        <Filter className="w-[14px] h-[14px] text-[#71767B]" /> More
                    </button>

                    <button className="flex items-center gap-2 px-3.5 py-2 hover:bg-[#16181C] ml-auto text-[13px] font-bold text-[#1D9BF0] transition-colors rounded-full border border-transparent hover:border-[#2F3336]">
                        <Clock className="w-[14px] h-[14px]" /> Real-time: ON
                    </button>
                </div>
            </div>

            {/* Main Data Table Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="flex-1 overflow-auto bg-[#000000]">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        progressPending={queueQuery.isLoading}
                        pagination
                        paginationPerPage={15}
                        paginationRowsPerPageOptions={[15, 30, 50, 100]}
                        selectableRows
                        onSelectedRowsChange={handleRowSelected}
                        customStyles={customStyles}
                        highlightOnHover
                        pointerOnHover
                        onRowClicked={(row) => setSelectedReport(row)}
                        noDataComponent={
                            <div className="p-12 text-center text-[#71767B] flex flex-col items-center">
                                <Shield className="w-10 h-10 mb-4 opacity-30 text-[#00BA7C]" />
                                <p className="text-[15px] font-bold text-[#E7E9EA] mb-1">Queue is empty</p>
                                <p className="text-[13px]">No reports matching your criteria. Great work!</p>
                            </div>
                        }
                    />
                </div>

                {/* Sticky Bulk Action Bottom Bar */}
                {selectedRows.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#16181C] border border-[#2F3336] shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-full px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in z-40">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-[#E7E9EA]">
                            <span className="flex items-center justify-center bg-[#1D9BF0] text-white w-6 h-6 rounded-full text-[12px]">{selectedRows.length}</span>
                            Selected
                        </div>
                        <div className="h-5 w-[1px] bg-[#2F3336]"></div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 hover:bg-[#1D9BF0]/10 text-[#71767B] hover:text-[#1D9BF0] rounded-full text-[13px] font-bold transition-colors">
                                Mark Under Review
                            </button>
                            <button className="px-4 py-1.5 hover:bg-[#F91880]/10 text-[#71767B] hover:text-[#F91880] rounded-full text-[13px] font-bold transition-colors">
                                Resolve & Remove
                            </button>
                            <button className="px-4 py-1.5 hover:bg-[#333639] text-[#71767B] hover:text-[#E7E9EA] rounded-full text-[13px] font-bold transition-colors">
                                Reject Valid
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-over Investigation Drawer */}
            <InvestigationDrawer
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
                onReject={handleReject}
                onResolve={handleResolve}
                onMarkUnderReview={handleMarkUnderReview}
            />
        </div>
    );
}
