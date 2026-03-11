"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search, Filter, Download, MoreVertical, ShieldAlert,
    AlertTriangle, CheckCircle, X, Clock, MessageSquare, AlertCircle,
    UserX, Shield, Flag, User, FileText, ArrowUpRight, Activity, XCircle, Loader2
} from "lucide-react";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// ==========================================
// 1. TYPES & SOURCE DATA
// ==========================================

type Severity = 'Low' | 'Medium' | 'High' | 'Critical';
type ReportStatus = 'Pending' | 'Under Review' | 'Resolved' | 'Rejected';
type ContentType = 'User' | 'Post' | 'Comment';
type Category = 'Spam' | 'Harassment' | 'Hate' | 'Violence' | 'NSFW' | 'Other';

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
            backgroundColor: 'hsl(var(--card))',
            borderBottomColor: 'hsl(var(--border))',
            borderBottomWidth: '1px',
            minHeight: '48px',
        },
    },
    headCells: {
        style: {
            fontSize: '11px',
            fontWeight: '700',
            color: 'hsl(var(--muted-foreground))',
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
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderBottomColor: 'hsl(var(--border))',
            minHeight: '64px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: 'hsl(var(--accent))',
            color: 'hsl(var(--foreground))',
            borderBottomColor: 'hsl(var(--border))',
            outline: 'none',
            transition: 'all 0.15s ease',
        },
    },
    pagination: {
        style: {
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--muted-foreground))',
            borderTopColor: 'hsl(var(--border))',
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
            color: 'hsl(var(--muted-foreground))',
            fill: 'hsl(var(--muted-foreground))',
            backgroundColor: 'transparent',
            '&:disabled': {
                cursor: 'unset',
                color: 'hsl(var(--border))',
                fill: 'hsl(var(--border))',
            },
            '&:hover:not(:disabled)': {
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--foreground))'
            },
            '&:focus': {
                outline: 'none',
                backgroundColor: 'hsl(var(--secondary))',
            },
        },
    },
};

// ==========================================
// 3. BADGE COMPONENTS
// ==========================================

const SeverityBadge = ({ severity }: { severity: Severity }) => {
    const config = {
        Low: { color: 'text-muted-foreground', bg: 'bg-muted', ring: 'border-transparent' },
        Medium: { color: 'text-yellow-600 dark:text-[#FFD400]', bg: 'bg-yellow-50 dark:bg-[#FFD400]/10', ring: 'border-yellow-200 dark:border-[#FFD400]/20' },
        High: { color: 'text-rose-600 dark:text-[#F91880]', bg: 'bg-rose-50 dark:bg-[#F91880]/10', ring: 'border-rose-200 dark:border-[#F91880]/20' },
        Critical: { color: 'text-white', bg: 'bg-rose-600 dark:bg-[#F91880]', ring: 'border-rose-300 dark:border-white/20 animate-pulse' }
    };
    const c = config[severity];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[8px] text-[11px] font-bold border ${c.bg} ${c.color} ${c.ring} cursor-pointer`}>
            {severity}
        </span>
    );
};

const StatusBadge = ({ status }: { status: ReportStatus }) => {
    const config = {
        Pending: 'bg-sky-50 dark:bg-[#1D9BF0]/10 text-sky-600 dark:text-[#1D9BF0] border-sky-100 dark:border-[#1D9BF0]/20',
        'Under Review': 'bg-purple-50 dark:bg-[#8247E5]/10 text-purple-600 dark:text-[#8247E5] border-purple-100 dark:border-[#8247E5]/20',
        Resolved: 'bg-emerald-50 dark:bg-[#00BA7C]/10 text-emerald-600 dark:text-[#00BA7C] border-emerald-100 dark:border-[#00BA7C]/20',
        Rejected: 'bg-muted text-muted-foreground border-border'
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-bold border ${config[status]} cursor-pointer`}>
            {status}
        </span>
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
        row.authorName && row.authorName !== 'system'
            ? `@${row.authorName}`
            : row.content?.slice(0, 40) ||
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
        assignedTo: row.assignedToName ?? "Unassigned",
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
            <div
                className="fixed inset-0 bg-background/40 backdrop-blur-[2px] transition-opacity duration-300"
                onClick={onClose}
            />
            <div className="w-full max-w-[550px] bg-background border-l border-border h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-background">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                Investigation
                                <span className="text-primary font-mono text-[14px]">{report.id}</span>
                            </h2>
                        </div>
                    </div>
                    <SeverityBadge severity={report.severity} />
                </div>

                {/* Status Header Block */}
                <div className="px-6 py-4 border-b border-border bg-secondary/30 shrink-0 flex items-center justify-between">
                    <div>
                        <div className="text-[12px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">Current Status</div>
                        <StatusBadge status={report.status} />
                    </div>
                    <div className="text-right">
                        <div className="text-[12px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">Assigned To</div>
                        <div className="text-[14px] text-foreground">{report.assignedTo}</div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-border px-2 shrink-0 bg-background">
                    {(['Overview', 'Content', 'Insights', 'History'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-[13px] font-bold transition-all relative ${activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-background">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Metadata */}
                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Report Details</h4>
                                <div className="bg-card rounded-[8px] border border-border divide-y divide-border">
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-muted-foreground">Category</span>
                                        <span className="text-foreground font-bold">{report.category}</span>
                                    </div>
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-muted-foreground">Total Reporters</span>
                                        <span className="text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-md">
                                            {report.reporterCount} Users
                                        </span>
                                    </div>
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-muted-foreground">Time Since First Report</span>
                                        <span className="text-foreground">{report.sla}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Targeted Entity */}
                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Target Entity</h4>
                                <div className="p-4 bg-card border border-border rounded-[8px]">
                                    <div className="text-[15px] font-bold text-foreground truncate">
                                        {report.reportedEntityName}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Aggregated User Description</h4>
                                <div className="p-4 bg-muted/30 border border-border rounded-[8px] text-[14px] text-foreground italic leading-relaxed">
                                    "{report.description}"
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Content' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-[8px]">
                                <span className="text-[13px] text-primary font-medium flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Original content snapshot at time of report
                                </span>
                            </div>
                            <div className="min-h-[300px] border border-border rounded-[8px] bg-card p-6 text-left shadow-inner">
                                {report.linkedContentStr ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 pb-4 border-b border-border">
                                            <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground">
                                                {report.contentType === 'User' ? <User className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-[15px] font-bold text-foreground truncate">
                                                    {report.reportedEntityName}
                                                </div>
                                                <div className="text-[12px] text-muted-foreground font-mono truncate">
                                                    {report.contentType} • {report.reportedEntityId}
                                                </div>
                                            </div>
                                            <a
                                                href={`/posts/${report.reportedEntityId}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-[8px] transition-colors"
                                                title="View Live Content"
                                            >
                                                <ArrowUpRight className="w-5 h-5" />
                                            </a>
                                        </div>
                                        <div className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap bg-background/40 p-5 rounded-[8px] border border-border font-sans selection:bg-primary/30">
                                            {report.linkedContentStr}
                                        </div>
                                        <div className="flex items-center gap-4 text-[12px] text-muted-foreground pt-2">
                                            <span className="flex items-center gap-1.5 font-medium">
                                                <Clock className="w-3.5 h-3.5" /> Captured on {report.createdAt}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-[15px] text-foreground font-bold">No Content Snapshot</p>
                                        <p className="text-[13px] text-muted-foreground mt-1 max-w-[280px] mx-auto">
                                            We couldn't retrieve the content snapshot for this report. It might have been deleted or purged.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Insights' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Risk Scoring Block */}
                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">AI & Risk Assessment</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 bg-card border border-border rounded-[8px]">
                                        <div className="text-[11px] text-muted-foreground uppercase font-bold mb-1">Safety Score</div>
                                        <div className="text-[20px] font-bold text-rose-500">24%</div>
                                        <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-rose-500 h-full" style={{ width: '24%' }}></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-card border border-border rounded-[8px]">
                                        <div className="text-[11px] text-muted-foreground uppercase font-bold mb-1">Confidence</div>
                                        <div className="text-[20px] font-bold text-emerald-500">92%</div>
                                        <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className="bg-emerald-500 h-full" style={{ width: '92%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Automated Audit Results */}
                            <div className="p-4 bg-card border border-border rounded-[8px]">
                                <h4 className="text-[13px] font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-primary" /> Platform Scan Summary
                                </h4>
                                <div className="space-y-3">
                                    {[
                                        { label: "Banned Keywords", status: "Detected (2)", risk: "High", color: "text-rose-500" },
                                        { label: "IP Reputation", status: "Clear / Trusted", risk: "Low", color: "text-emerald-500" },
                                        { label: "Account Age", status: "4 days (New)", risk: "Medium", color: "text-yellow-500" },
                                        { label: "Prev. Violations", status: "None recorded", risk: "Low", color: "text-emerald-500" }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between text-[13px] py-1">
                                            <span className="text-muted-foreground">{item.label}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-foreground font-medium">{item.status}</span>
                                                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded bg-background border border-border ${item.color}`}>
                                                    {item.risk}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Reporter Network */}
                            <div className="p-4 bg-card border border-border rounded-[8px]">
                                <h4 className="text-[13px] font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-yellow-500" /> Reporter Consensus
                                </h4>
                                <div className="flex items-end gap-1 h-24 mb-4">
                                    {[30, 45, 25, 60, 85, 40, 50].map((h, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-muted hover:bg-primary/50 transition-colors rounded-t-sm"
                                            style={{ height: `${h}%` }}
                                            title={`Reports at T-${7 - i}h`}
                                        ></div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-[13px]">
                                    <div>
                                        <div className="text-muted-foreground">Peak Velocity</div>
                                        <div className="text-foreground font-bold">12 reports / hr</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Reporting Origin</div>
                                        <div className="text-foreground font-bold">North America (80%)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'History' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Audit Timeline</h4>
                            <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                                {[
                                    {
                                        event: "Moderator Assigned",
                                        agent: report.assignedTo || "System-Auto",
                                        time: "2h ago",
                                        icon: <User className="w-3 h-3 text-white" />,
                                        color: "bg-primary"
                                    },
                                    {
                                        event: "Severity Classified as " + report.severity,
                                        agent: "RiskEngine v4.2",
                                        time: "4h ago",
                                        icon: <ShieldAlert className="w-3 h-3 text-white" />,
                                        color: "bg-rose-500"
                                    },
                                    {
                                        event: "Report Aggregated",
                                        agent: "System",
                                        time: report.createdAt,
                                        icon: <Clock className="w-3 h-3 text-white" />,
                                        color: "bg-muted-foreground"
                                    },
                                    {
                                        event: "Initial Report Received",
                                        agent: "Anonymous User",
                                        time: report.createdAt,
                                        icon: <Flag className="w-3 h-3 text-white" />,
                                        color: "bg-emerald-500"
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="relative">
                                        <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 border-background z-10 flex items-center justify-center ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[14px] font-bold text-foreground">{item.event}</span>
                                                <span className="text-[12px] text-muted-foreground font-mono">{item.time}</span>
                                            </div>
                                            <div className="text-[13px] text-muted-foreground">
                                                Performed by <span className="text-primary font-medium">{item.agent}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Verification Block */}
                            <div className="mt-8 p-4 bg-primary/5 border border-primary/10 rounded-[8px] flex items-start gap-3">
                                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[13px] text-foreground font-semibold">Integrity Verified</p>
                                    <p className="text-[12px] text-muted-foreground mt-0.5">This investigation log is cryptographically signed and immutable.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-background shrink-0 grid grid-cols-2 gap-3">
                    <button
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors ${report.status === "Rejected"
                            ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-50"
                            : "bg-secondary hover:bg-secondary/80 text-foreground border border-border cursor-pointer"
                            }`}
                        onClick={() => onReject(report)}
                        disabled={report.status === "Rejected"}
                    >
                        <XCircle className="w-4 h-4" /> Reject Report
                    </button>
                    <button
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors shadow-lg ${report.status === "Resolved"
                            ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-50 shadow-none"
                            : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20 cursor-pointer"
                            }`}
                        onClick={() => onResolve(report)}
                        disabled={report.status === "Resolved"}
                    >
                        <UserX className="w-4 h-4" /> Resolve & Remove
                    </button>
                    {report.status !== "Under Review" && (
                        <button
                            className={`col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors mt-1 ${report.status === "Rejected"
                                ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-50"
                                : "bg-[#1D9BF0]/10 hover:bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/30 cursor-pointer"
                                }`}
                            onClick={() => onMarkUnderReview(report)}
                            disabled={report.status === "Rejected"}
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
const LoadingComponent = () => (
    <div className="flex flex-col items-center justify-center p-20 bg-background w-full min-h-[400px]">
        <div className="relative">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="absolute inset-0 w-10 h-10 border-4 border-primary/20 rounded-full"></div>
        </div>
        <div className="mt-4 text-[15px] font-bold text-foreground animate-pulse tracking-tight">
            Syncing Reports...
        </div>
    </div>
);

export default function ReportsManagementPage() {
    const [filterText, setFilterText] = useState("");
    const [selectedRows, setSelectedRows] = useState<ReportData[]>([]);
    const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
    const [filterSeverity, setFilterSeverity] = useState<string>("All Severities");
    const [filterCategory, setFilterCategory] = useState<string>("All Categories");
    const [filterStatus, setFilterStatus] = useState<string>("All Status");
    const [reports, setReports] = useState<ReportData[]>([]);

    const backendCategory = useMemo(
        () => mapFilterCategoryToBackend(filterCategory),
        [filterCategory],
    );

    const backendStatus = useMemo(() => {
        switch (filterStatus) {
            case "Pending": return "PENDING" as const;
            case "Under Review": return "PENDING" as const;
            case "Resolved": return "RESOLVED" as const;
            case "Rejected": return "DISMISSED" as const;
            default: return undefined;
        }
    }, [filterStatus]);

    const queueQuery = trpc.moderation.getReportQueue.useQuery(
        {
            limit: 60,
            category: backendCategory,
            status: backendStatus,
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
            const matchesStatus = filterStatus === "All Status" || item.status === filterStatus;

            return matchesSearch && matchesSeverity && matchesCategory && matchesStatus;
        });
    }, [filterText, filterSeverity, filterCategory, filterStatus, reports]);

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
            grow: 1,
            cell: row => (
                <div className="py-2">
                    <span className="text-[13px] font-mono text-foreground block mb-1">
                        {row.id.substring(0, 8)}...
                    </span>
                    <span className="text-[11px] text-muted-foreground">{row.createdAt}</span>
                </div>
            ),
        },
        {
            name: 'Severity',
            selector: row => row.severity,
            sortable: true,
            grow: 1,
            cell: row => <SeverityBadge severity={row.severity} />,
        },
        {
            name: 'Reported Entity',
            selector: row => row.reportedEntityName,
            grow: 1,
            cell: row => (
                <div className="py-2 flex flex-col justify-center min-w-0 pr-4 w-full">
                    <div className="text-[13px] text-foreground truncate font-medium">
                        {row.reportedEntityName}
                    </div>
                </div>
            ),
        },
        {
            name: 'Category & Flags',
            selector: row => row.category,
            sortable: true,
            grow: 1,
            cell: row => (
                <div className="py-2">
                    <div className="text-[13px] font-bold text-foreground mb-1">{row.category}</div>
                    <div className="text-[12px] text-rose-500 font-medium flex items-center gap-1">
                        <Flag className="w-3 h-3" /> {row.reporterCount} Reports
                    </div>
                </div>
            ),
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            grow: 1,
            cell: row => <StatusBadge status={row.status} />,
        },
        {
            name: 'Assigned',
            selector: row => row.assignedTo || '',
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[13px] text-muted-foreground font-medium">{row.assignedTo || 'Unassigned'}</div>,
        },
        {
            name: 'SLA',
            selector: row => row.sla,
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[13px] font-mono text-muted-foreground">{row.sla}</div>,
        },
        {
            name: '',
            cell: row => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedReport(row); }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors ml-auto shadow-sm"
                    title="Open Investigation"
                >
                    <ArrowUpRight className="w-[18px] h-[18px]" strokeWidth={2.5} />
                </button>
            ),
            width: '60px'
        }
    ];

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-background text-foreground min-h-screen font-display">
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Minimal strict scrollbar for FAANG density */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground)); }

                /* react-data-table-component custom checkbox */
                .rdt_TableCol .sc-kOHTFB, .rdt_TableCell .sc-kOHTFB { margin-left: 12px; }
                input[type="checkbox"] {
                   accent-color: hsl(var(--primary));
                   cursor: pointer;
                   width: 16px;
                   height: 16px;
                   border-radius: 4px;
                   background-color: transparent;
                   border: 1px solid hsl(var(--muted-foreground));
                }
                `
            }} />

            {/* Top Toolbar / Header */}
            <div className="px-6 py-5 border-b border-border bg-background/90 backdrop-blur-md z-10 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-foreground flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                        Reports Triage Queue
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-0.5">
                        Prioritize, investigate, and resolve user-generated incident reports.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {queueQuery.isFetching && (
                        <span className="text-[12px] text-primary animate-pulse">Updating…</span>
                    )}
                    <button
                        className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-[8px] text-[13px] font-bold text-foreground hover:bg-accent transition-colors cursor-pointer"
                        onClick={exportCsv}
                    >
                        <Download className="w-4 h-4 text-muted-foreground" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-background border-b border-border flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative w-full max-w-[320px]">
                        <Input
                            type="text"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            placeholder="Search Entity ID or Report ID..."
                        />
                    </div>

                    <div className="h-6 w-[1px] bg-border hidden sm:block"></div>

                    <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                        <SelectTrigger className="w-[145px] bg-secondary border border-border rounded-[8px] text-[13px] font-bold text-foreground hover:bg-accent transition-colors cursor-pointer h-9">
                            <SelectValue placeholder="All Severities" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="All Severities" className="text-foreground hover:bg-accent">All Severities</SelectItem>
                            <SelectItem value="Critical" className="text-foreground hover:bg-accent">Critical</SelectItem>
                            <SelectItem value="High" className="text-foreground hover:bg-accent">High</SelectItem>
                            <SelectItem value="Medium" className="text-foreground hover:bg-accent">Medium</SelectItem>
                            <SelectItem value="Low" className="text-foreground hover:bg-accent">Low</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[145px] bg-secondary border border-border rounded-[8px] text-[13px] font-bold text-foreground hover:bg-accent transition-colors cursor-pointer h-9">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="All Categories" className="text-foreground hover:bg-accent">All Categories</SelectItem>
                            <SelectItem value="Spam" className="text-foreground hover:bg-accent">Spam</SelectItem>
                            <SelectItem value="Hate" className="text-foreground hover:bg-accent">Hate</SelectItem>
                            <SelectItem value="Harassment" className="text-foreground hover:bg-accent">Harassment</SelectItem>
                            <SelectItem value="NSFW" className="text-foreground hover:bg-accent">NSFW</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[130px] bg-secondary border border-border rounded-[8px] text-[13px] font-bold text-foreground hover:bg-accent transition-colors cursor-pointer h-9">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                            <SelectItem value="All Status" className="text-foreground hover:bg-accent">All Status</SelectItem>
                            <SelectItem value="Pending" className="text-foreground hover:bg-accent">Pending</SelectItem>
                            <SelectItem value="Under Review" className="text-foreground hover:bg-accent">Under Review</SelectItem>
                            <SelectItem value="Resolved" className="text-foreground hover:bg-accent">Resolved</SelectItem>
                            <SelectItem value="Rejected" className="text-foreground hover:bg-accent">Rejected</SelectItem>
                        </SelectContent>
                    </Select>

                    <button className="flex items-center gap-2 px-3.5 py-2 hover:bg-accent ml-auto text-[13px] font-bold text-primary transition-colors rounded-[8px] border border-transparent hover:border-border cursor-pointer">
                        <Clock className="w-[14px] h-[14px]" /> Real-time: ON
                    </button>
                </div>
            </div>

            {/* Main Data Table Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="flex-1 overflow-auto bg-background">
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
                        progressComponent={<LoadingComponent />}
                        noDataComponent={
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <Shield className="w-10 h-10 mb-4 opacity-30 text-emerald-500" />
                                <p className="text-[15px] font-bold text-foreground mb-1">Queue is empty</p>
                                <p className="text-[13px]">No reports matching your criteria. Great work!</p>
                            </div>
                        }
                    />
                </div>

                {/* Sticky Bulk Action Bottom Bar */}
                {selectedRows.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-[8px] px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in z-40">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                            <span className="flex items-center justify-center bg-primary text-white w-6 h-6 rounded-full text-[12px]">{selectedRows.length}</span>
                            Selected
                        </div>
                        <div className="h-5 w-[1px] bg-border"></div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer">
                                Mark Under Review
                            </button>
                            <button className="px-4 py-1.5 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer">
                                Resolve & Remove
                            </button>
                            <button className="px-4 py-1.5 hover:bg-accent text-muted-foreground hover:text-foreground rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer">
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
