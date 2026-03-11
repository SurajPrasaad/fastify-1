"use client";

import React, { useState, useMemo, useEffect } from "react";
import ReactECharts from 'echarts-for-react';
import { useTheme } from "next-themes";
import {
    Search, Filter, Download, MoreVertical, ShieldAlert,
    Ban, CheckCircle, X, Image as ImageIcon, Video, FileText,
    MessageSquare, Heart, Share2, AlertTriangle, Eye, ArrowUpRight,
    Flag, RotateCcw, AlertCircle, TrendingUp, Loader2,
    Clock
} from "lucide-react";
import DataTable, { TableColumn, TableStyles, createTheme } from "react-data-table-component";

// Register custom dark theme using CSS variables
createTheme('devatlas', {
    text: {
        primary: 'hsl(var(--foreground))',
        secondary: 'hsl(var(--muted-foreground))',
    },
    background: {
        default: 'transparent',
    },
    context: {
        background: 'hsl(var(--secondary))',
        text: 'hsl(var(--foreground))',
    },
    divider: {
        default: 'hsl(var(--border))',
    },
    button: {
        default: 'hsl(var(--foreground))',
        hover: 'hsl(var(--secondary))',
        focus: 'hsl(var(--primary))',
        disabled: 'hsl(var(--muted-foreground) / 0.3)',
    },
}, 'dark');
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Image from "next/image";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// ==========================================
// 1. TYPES
// ==========================================

type PostType = "Text" | "Image" | "Video";
type PostStatus = "PUBLISHED" | "FLAGGED" | "UNDER_REVIEW" | "RESTRICTED" | "DELETED" | "DRAFT" | "ARCHIVED";
type Visibility = 'PUBLIC' | 'PRIVATE' | 'FOLLOWERS' | 'GEO_RESTRICTED';
type RiskLevel = 'Low' | 'Medium' | 'High';

interface PostData {
    id: string;
    authorName: string;
    authorHandle: string;
    authorAvatar: string;
    content: string;
    thumbnail?: string;
    type: PostType;
    status: PostStatus;
    visibility: Visibility;
    risk: RiskLevel;
    likes: number;
    comments: number;
    shares: number;
    reports: number;
    reportBreakdown?: Record<string, number>;
    createdAt: string;
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
            backgroundColor: 'hsl(var(--secondary))',
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
            minHeight: '72px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: 'hsl(var(--secondary))',
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
                color: 'hsl(var(--muted-foreground) / 0.3)',
                fill: 'hsl(var(--muted-foreground) / 0.3)',
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

const formatNumber = (num: number) => {
    return num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString();
};

const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

const mapBackendPostToRow = (post: any): PostData => {
    const statusMap: Record<string, PostStatus> = {
        PUBLISHED: "PUBLISHED",
        FLAGGED: "FLAGGED",
        UNDER_REVIEW: "UNDER_REVIEW",
        RESTRICTED: "RESTRICTED",
        DELETED: "DELETED",
        DRAFT: "DRAFT",
        ARCHIVED: "ARCHIVED",
        PENDING_REVIEW: "UNDER_REVIEW",
        REJECTED: "DELETED",
        NEEDS_REVISION: "UNDER_REVIEW",
        REMOVED: "DELETED",
    };

    const rawStatus = (post.status as string) || "PUBLISHED";
    const status = statusMap[rawStatus] ?? "PUBLISHED";

    const priority = Number(post.priorityScore ?? 0);
    const risk: RiskLevel = priority >= 80 ? "High" : priority >= 40 ? "Medium" : "Low";

    const mediaUrls = (post.mediaUrls as string[]) || [];
    const hasMedia = mediaUrls.length > 0;
    const thumbnail = hasMedia ? mediaUrls[0] : undefined;
    const type: PostType = hasMedia ? "Image" : "Text";

    return {
        id: post.id,
        authorName: post.author?.name ?? "Unknown",
        authorHandle: post.author?.username ? `@${post.author.username}` : "@unknown",
        authorAvatar: post.author?.avatarUrl ?? "/avatar-placeholder.png",
        content: post.content ?? "",
        thumbnail,
        type,
        status,
        visibility: (post.visibility as any) || "PUBLIC",
        risk,
        likes: Number(post.likes ?? 0),
        comments: Number(post.comments ?? 0),
        shares: Number(post.shares ?? 0),
        reports: Number(post.reportsCount ?? 0),
        reportBreakdown: post.reportBreakdown ?? {},
        createdAt: formatDate(post.createdAt),
    };
};

// ==========================================
// 3. BADGE COMPONENTS
// ==========================================

const PostTypeBadge = ({ type }: { type: PostType }) => {
    const config = {
        Text: { icon: FileText, color: 'text-muted-foreground', bg: 'bg-secondary' },
        Image: { icon: ImageIcon, color: 'text-[#1D9BF0]', bg: 'bg-[#1D9BF0]/10' },
        Video: { icon: Video, color: 'text-[#8247E5]', bg: 'bg-[#8247E5]/10' }
    };
    const { icon: Icon, color, bg } = config[type];
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-[8px] text-[11px] font-bold ${bg} ${color} w-fit cursor-pointer`}>
            <Icon className="w-3 h-3" />
            {type}
        </div>
    );
};

const StatusBadge = ({ status }: { status: PostStatus }) => {
    const styles: Record<PostStatus, string> = {
        PUBLISHED: 'bg-[#00BA7C]/10 text-[#00BA7C] border-[#00BA7C]/20',
        FLAGGED: 'bg-[#FFD400]/10 text-[#FFD400] border-[#FFD400]/20',
        UNDER_REVIEW: 'bg-[#1D9BF0]/10 text-[#1D9BF0] border-[#1D9BF0]/20',
        RESTRICTED: 'bg-[#8247E5]/10 text-[#8247E5] border-[#8247E5]/20',
        DELETED: 'bg-[#F91880]/10 text-[#F91880] border-[#F91880]/20',
        DRAFT: 'bg-[#71767B]/10 text-[#71767B] border-[#71767B]/20',
        ARCHIVED: 'bg-[#2F3336]/10 text-[#2F3336] border-[#2F3336]/20'
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-[8px] text-[11px] font-bold border ${styles[status]} cursor-pointer`}>
            {status.replace('_', ' ')}
        </span>
    );
};

const RiskBadge = ({ risk, reports }: { risk: RiskLevel, reports: number }) => {
    if (reports === 0) return <span className="text-muted-foreground text-[12px]">-</span>;
    const isHigh = risk === 'High' || reports > 50;

    return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] ${isHigh ? 'bg-[#F91880]/10 text-[#F91880]' : 'bg-[#FFD400]/10 text-[#FFD400]'} cursor-pointer`}>
            <Flag className="w-3 h-3" />
            <span className="text-[12px] font-bold">{reports}</span>
        </div>
    );
};

// ==========================================
// 4. DRAWER COMPONENT
// ==========================================

const PostDrawer = ({
    post,
    onClose,
    onDelete,
    onRestore,
    onEscalate,
}: {
    post: PostData | null;
    onClose: () => void;
    onDelete: (post: PostData) => void;
    onRestore: (post: PostData) => void;
    onEscalate: (post: PostData) => void;
}) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Engagement' | 'Moderation'>('Overview');
    const { theme } = useTheme();

    if (!post) return null;

    const engagementChartOption = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "axis",
            backgroundColor: theme === "dark" ? "#16181C" : "#FFFFFF",
            borderColor: theme === "dark" ? "#2F3336" : "#E2E8F0",
            borderWidth: 1,
            textStyle: { color: theme === "dark" ? "#E7E9EA" : "#0F172A", fontSize: 13 },
            axisPointer: { type: "shadow" },
        },
        grid: { top: 20, right: 10, bottom: 20, left: 10, containLabel: true },
        xAxis: {
            type: "category",
            data: ["Likes", "Comments", "Shares"],
            axisLine: { lineStyle: { color: theme === "dark" ? "#2F3336" : "#E2E8F0" } },
            axisTick: { show: false },
            axisLabel: { color: theme === "dark" ? "#71767B" : "#64748B", fontSize: 11 },
        },
        yAxis: {
            type: "value",
            splitLine: { lineStyle: { color: theme === "dark" ? "#2F3336" : "#F1F5F9", type: "dashed" } },
            axisLabel: { color: theme === "dark" ? "#71767B" : "#64748B", fontSize: 11 },
        },
        series: [
            {
                type: "bar",
                barWidth: "45%",
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: (params: any) => {
                        const colors = ["#F91880", "#1D9BF0", "#00BA7C"];
                        return colors[params.dataIndex];
                    }
                },
                data: [post.likes, post.comments, post.shares],
            },
        ],
    };

    const moderationDonutOption = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "item",
            backgroundColor: theme === "dark" ? "#16181C" : "#FFFFFF",
            borderColor: theme === "dark" ? "#2F3336" : "#E2E8F0",
            borderWidth: 1,
            textStyle: { color: theme === "dark" ? "#E7E9EA" : "#0F172A", fontSize: 12 },
        },
        legend: {
            orient: 'horizontal',
            bottom: '0%',
            left: 'center',
            textStyle: { color: "#71767B", fontSize: 10 },
            icon: 'circle'
        },
        series: [
            {
                name: 'Report Category',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: '#16181C',
                    borderWidth: 2
                },
                label: { show: false },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: theme === "dark" ? "#E7E9EA" : "#0F172A"
                    }
                },
                labelLine: { show: false },
                data: post.reportBreakdown && Object.keys(post.reportBreakdown).length > 0
                    ? Object.entries(post.reportBreakdown).map(([category, count]) => ({
                        value: count,
                        name: category.toLowerCase().replace('_', ' '),
                        itemStyle: {
                            color: category === 'SPAM' ? '#FFD400' :
                                category === 'HARASSMENT' ? '#F91880' :
                                    category === 'HATE_SPEECH' ? '#FF7A00' : '#1D9BF0'
                        }
                    }))
                    : [{ value: 1, name: 'None', itemStyle: { color: '#2F3336' } }]
            }
        ]
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-[500px] bg-background border-l border-border h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-background">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-[18px] font-bold text-foreground">Post Details</h2>
                    </div>
                    <div className="flex gap-2">
                        <a href="#" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors">
                            <ArrowUpRight className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-border px-2 shrink-0 bg-background">
                    {(['Overview', 'Engagement', 'Moderation'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-[13px] font-bold transition-all relative ${activeTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
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
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide bg-background">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Author Info */}
                            <div className="flex items-center justify-between bg-secondary/40 p-4 rounded-[8px] border border-border">
                                <div className="flex items-center gap-3">
                                    <Image src={post.authorAvatar} alt={post.authorName} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                                    <div>
                                        <div className="text-[14px] font-bold text-foreground">{post.authorName}</div>
                                        <div className="text-[13px] text-muted-foreground">{post.authorHandle}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[12px] text-muted-foreground mb-1">{post.createdAt}</div>
                                    <StatusBadge status={post.status} />
                                </div>
                            </div>

                            {/* Post Content */}
                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Content</h4>
                                <div className="bg-secondary/40 rounded-[8px] border border-border p-4">
                                    <p className="text-[15px] text-foreground leading-relaxed mb-4 whitespace-pre-wrap">
                                        {post.content}
                                    </p>

                                    {post.thumbnail && (
                                        <div className="rounded-lg overflow-hidden border border-border relative">
                                            <Image src={post.thumbnail} width={500} height={300} className="w-full h-auto object-cover max-h-[300px]" alt="Post Media preview" />
                                            {post.type === 'Video' && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                        <Video className="w-6 h-6 text-white" fill="white" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Metadata */}
                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Metadata</h4>
                                <div className="bg-secondary/40 rounded-[8px] border border-border divide-y divide-border">

                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-muted-foreground">Type</span>
                                        <PostTypeBadge type={post.type} />
                                    </div>
                                    <div className="flex justify-between p-3.5 text-[14px]">
                                        <span className="text-muted-foreground">Visibility</span>
                                        <span className="text-foreground">Public</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Engagement' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-secondary/40 rounded-[8px] border border-border p-4 text-center">
                                    <Heart className="w-5 h-5 text-[#F91880] mx-auto mb-2" />
                                    <div className="text-[20px] font-bold text-foreground">{formatNumber(post.likes)}</div>
                                    <div className="text-[12px] text-muted-foreground">Likes</div>
                                </div>
                                <div className="bg-secondary/40 rounded-[8px] border border-border p-4 text-center">
                                    <MessageSquare className="w-5 h-5 text-[#1D9BF0] mx-auto mb-2" />
                                    <div className="text-[20px] font-bold text-foreground">{formatNumber(post.comments)}</div>
                                    <div className="text-[12px] text-muted-foreground">Comments</div>
                                </div>
                                <div className="bg-secondary/40 rounded-[8px] border border-border p-4 text-center">
                                    <Share2 className="w-5 h-5 text-[#00BA7C] mx-auto mb-2" />
                                    <div className="text-[20px] font-bold text-foreground">{formatNumber(post.shares)}</div>
                                    <div className="text-[12px] text-muted-foreground">Shares</div>
                                </div>
                            </div>

                            <div className="bg-secondary/40 rounded-[8px] border border-border p-6 lg:p-8">
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Engagement Distribution
                                </h4>
                                <div className="h-[240px] w-full">
                                    <ReactECharts
                                        option={engagementChartOption}
                                        style={{ height: '100%', width: '100%' }}
                                        opts={{ renderer: 'svg' }}
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-4 text-center italic">
                                    Live metrics captured from post interaction logs.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Moderation' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {post.reports > 0 ? (
                                <>
                                    <div className={`p-4 rounded-[8px] border ${post.risk === 'High' ? 'bg-[#F91880]/10 border-[#F91880]/30' : 'bg-[#FFD400]/10 border-[#FFD400]/30'}`}>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <ShieldAlert className={`w-5 h-5 ${post.risk === 'High' ? 'text-[#F91880]' : 'text-[#FFD400]'}`} />
                                                <span className={`font-bold text-[15px] ${post.risk === 'High' ? 'text-[#F91880]' : 'text-[#FFD400]'}`}>
                                                    System Alert: {post.risk} Risk Level
                                                </span>
                                            </div>
                                            <p className={`text-[13px] ${post.risk === 'High' ? 'text-[#F91880]/80' : 'text-[#FFD400]/80'}`}>
                                                This post has amassed {post.reports} user reports in a short timeframe, triggering automated analysis.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Report Distribution
                                        </h4>
                                        <div className="bg-secondary/40 rounded-[8px] border border-border p-4 flex flex-col gap-6">
                                            <div className="h-[200px] w-full">
                                                <ReactECharts
                                                    option={moderationDonutOption}
                                                    style={{ height: '100%', width: '100%' }}
                                                    opts={{ renderer: 'svg' }}
                                                />
                                            </div>

                                            <div className="divide-y divide-border border-t border-border -mx-4">
                                                {post.reportBreakdown && Object.keys(post.reportBreakdown).length > 0 ? (
                                                    Object.entries(post.reportBreakdown).map(([category, count]) => (
                                                        <div key={category} className="flex justify-between items-center p-3.5 px-4">
                                                            <span className="text-[14px] text-foreground capitalize">{category.toLowerCase().replace('_', ' ')}</span>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full ${category === 'SPAM' ? 'bg-[#FFD400]' :
                                                                            category === 'HARASSMENT' ? 'bg-[#F91880]' : 'bg-[#1D9BF0]'
                                                                            }`}
                                                                        style={{ width: `${Math.min(100, (Number(count) / post.reports) * 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-[13px] text-muted-foreground w-4">{count}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-center text-muted-foreground text-[13px]">
                                                        No specific category data available.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-8 bg-secondary/40 rounded-[8px] border border-border">
                                    <CheckCircle className="w-10 h-10 text-[#00BA7C] mx-auto mb-3" />
                                    <div className="text-[15px] font-bold text-foreground mb-1">Clean Record</div>
                                    <div className="text-[13px] text-muted-foreground text-center">This post currently has zero active reports or moderation strikes.</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-background shrink-0 grid grid-cols-2 gap-3">
                    {post.status === "DELETED" ? (
                        <button
                            className="flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-[#00BA7C]/10 text-[#00BA7C] border border-border hover:border-[#00BA7C]/50 rounded-[8px] text-[13px] font-bold transition-colors"
                            onClick={() => onRestore(post)}
                        >
                            <RotateCcw className="w-4 h-4" /> Restore Content
                        </button>
                    ) : (
                        <button
                            className="flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-[#F91880]/10 text-[#F91880] border border-border hover:border-[#F91880]/50 rounded-[8px] text-[13px] font-bold transition-colors"
                            onClick={() => onDelete(post)}
                        >
                            <Ban className="w-4 h-4" /> Remove Post
                        </button>
                    )}
                    <button
                        className="flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground rounded-[8px] text-[13px] font-bold transition-colors shadow-sm"
                        onClick={() => onEscalate(post)}
                    >
                        <AlertCircle className="w-4 h-4" /> Escalate to Tier 2
                    </button>
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
            Syncing Content...
        </div>
    </div>
);

export default function PostsManagementPage() {
    const [filterText, setFilterText] = useState("");
    const [selectedRows, setSelectedRows] = useState<PostData[]>([]);
    const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("All Status");
    const [filterType, setFilterType] = useState<string>("All Types");
    const [posts, setPosts] = useState<PostData[]>([]);

    const listQuery = trpc.admin.posts.list.useQuery({ limit: 200, offset: 0 });

    useEffect(() => {
        if (listQuery.data) {
            // Handle raw tRPC response structure defensivly (checking for result.data nesting)
            const raw = listQuery.data as any;
            const dataArray = Array.isArray(raw) && raw[0]?.result?.data
                ? raw[0].result.data
                : Array.isArray(raw) ? raw : [];

            const items = dataArray.map(mapBackendPostToRow);
            setPosts(items);
        }
    }, [listQuery.data]);

    const filteredData = useMemo(() => {
        return posts.filter(item => {
            const matchesSearch =
                item.authorName.toLowerCase().includes(filterText.toLowerCase()) ||
                item.authorHandle.toLowerCase().includes(filterText.toLowerCase()) ||
                item.id.toLowerCase().includes(filterText.toLowerCase()) ||
                item.content.toLowerCase().includes(filterText.toLowerCase());

            const matchesStatus = filterStatus === "All Status" || item.status === filterStatus;
            const matchesType = filterType === "All Types" || item.type === filterType;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [filterText, filterStatus, filterType, posts]);

    const handleRowSelected = ({ selectedRows }: { selectedRows: PostData[] }) => {
        setSelectedRows(selectedRows);
    };

    const moderateMutation = trpc.admin.posts.moderate.useMutation();
    const bulkModerateMutation = trpc.admin.posts.bulkModerate.useMutation();

    const updateStatusLocally = (ids: string[], status: PostStatus) => {
        setPosts(prev =>
            prev.map(p => (ids.includes(p.id) ? { ...p, status } : p)),
        );
    };

    const handleDelete = (post: PostData) => {
        moderateMutation.mutate({
            postId: post.id,
            action: "DELETE",
            reason: "Removed from admin dashboard",
        });
        toast.success("Post removed");
        updateStatusLocally([post.id], "DELETED");
    };

    const handleRestore = (post: PostData) => {
        moderateMutation.mutate({
            postId: post.id,
            action: "RESTORE",
            reason: "Restored from admin dashboard",
        });
        toast.success("Post restored");
        updateStatusLocally([post.id], "PUBLISHED");
    };

    const handleEscalate = (post: PostData) => {
        moderateMutation.mutate({
            postId: post.id,
            action: "ESCALATE",
            reason: "Escalated from admin dashboard",
        });
        toast.success("Post escalated to Tier 2");
        updateStatusLocally([post.id], "UNDER_REVIEW");
    };

    const handleBulkApprove = () => {
        const ids = selectedRows.map(r => r.id);
        if (!ids.length) return;
        bulkModerateMutation.mutate({
            postIds: ids,
            action: "APPROVE",
            reason: "Bulk approve from admin dashboard",
        });
        toast.success("Posts approved");
        updateStatusLocally(ids, "PUBLISHED");
        setSelectedRows([]);
    };

    const handleBulkRemove = () => {
        const ids = selectedRows.map(r => r.id);
        if (!ids.length) return;
        bulkModerateMutation.mutate({
            postIds: ids,
            action: "DELETE",
            reason: "Bulk remove from admin dashboard",
        });
        toast.success("Posts removed");
        updateStatusLocally(ids, "DELETED");
        setSelectedRows([]);
    };

    const columns: TableColumn<PostData>[] = [
        {
            name: 'Post',
            selector: row => row.content,
            sortable: true,
            grow: 1,
            width: '650px',
            cell: row => (
                <div className="flex items-center gap-3 py-3 w-full">
                    {row.thumbnail ? (
                        <div className="relative shrink-0 w-12 h-12 rounded-[8px] overflow-hidden border border-border bg-secondary">
                            <img src={row.thumbnail} className="w-full h-full object-cover" alt="Thumb" />
                            {row.type === 'Video' && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Video className="w-4 h-4 text-white" fill="white" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="shrink-0 w-12 h-12 rounded-[8px] border border-border bg-secondary flex items-center justify-center">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] text-foreground line-clamp-2 leading-relaxed mb-1" title={row.content}>
                            {row.status === 'DELETED' ? <span className="text-[#F91880] italic">[Content Removed]</span> : row.content}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>{row.id}</span>
                            <span>•</span>
                            <PostTypeBadge type={row.type} />
                        </div>
                    </div>
                </div>
            ),
        },
        {
            name: 'Author',
            selector: row => row.authorName,
            sortable: true,
            width: '180px',
            grow: 1,
            cell: row => (
                <div className="flex items-center gap-2.5 py-2">
                    <img className="w-8 h-8 rounded-full border border-border object-cover" src={row.authorAvatar} alt={row.authorName} />
                    <div className="min-w-0">
                        <div className="text-[13px] font-bold text-foreground truncate">{row.authorName}</div>
                        <div className="text-[12px] text-muted-foreground truncate">{row.authorHandle}</div>
                    </div>
                </div>
            ),
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            width: '150px',
            grow: 1,
            cell: row => <StatusBadge status={row.status} />,
        },
        {
            name: 'Flags',
            selector: row => row.reports,
            sortable: true,
            grow: 1,
            cell: row => <RiskBadge risk={row.risk} reports={row.reports} />,
        },
        {
            name: 'Engagement',
            selector: row => row.likes,
            sortable: true,
            grow: 1,
            cell: row => (
                <div className="flex items-center gap-2 text-muted-foreground text-[12px] font-medium">
                    <div className="flex items-center gap-1.5 w-[55px] whitespace-nowrap" title="Likes">
                        <Heart className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatNumber(row.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-[55px] whitespace-nowrap" title="Comments">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatNumber(row.comments)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-[50px] whitespace-nowrap" title="Shares">
                        <Share2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{formatNumber(row.shares)}</span>
                    </div>
                </div>
            ),
        },
        {
            name: 'Date',
            selector: row => row.createdAt,
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[13px] font-medium text-muted-foreground">{row.createdAt}</div>,
        },
        {
            name: '',
            cell: row => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPost(row); }}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors ml-auto"
                >
                    <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2} />
                </button>
            ),
            width: '48px'
        }
    ];

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-background text-foreground h-[100vh] font-display">

            {/* Top Toolbar / Header */}
            <div className="px-6 py-5 border-b border-border bg-background/90 backdrop-blur-md z-10 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-foreground flex items-center gap-2">
                        Content Moderation
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Review reported posts, manage multimedia content, and escalate severe cases.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-[8px] text-[13px] font-bold text-foreground hover:bg-muted transition-colors">
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
                            placeholder="Search keywords, @handle, or ID..."
                        />
                    </div>

                    <div className="h-6 w-[1px] bg-border hidden sm:block"></div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[130px] bg-secondary border border-border rounded-[8px] text-[13px] font-bold text-foreground">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Status">All Status</SelectItem>
                            <SelectItem value="PUBLISHED">Active</SelectItem>
                            <SelectItem value="FLAGGED">Flagged</SelectItem>
                            <SelectItem value="UNDER_REVIEW">Reviewing</SelectItem>
                            <SelectItem value="DELETED">Removed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-[130px] bg-secondary border border-border rounded-[8px] text-[13px] font-bold text-foreground">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All Types">All Types</SelectItem>
                            <SelectItem value="Text">Text</SelectItem>
                            <SelectItem value="Image">Image</SelectItem>
                            <SelectItem value="Video">Video</SelectItem>
                        </SelectContent>
                    </Select>

                </div>
            </div>

            {/* Main Data Table Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="flex-1 overflow-auto bg-background">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        progressPending={listQuery.isLoading}
                        pagination
                        paginationPerPage={15}
                        paginationRowsPerPageOptions={[15, 30, 50, 100]}
                        selectableRows
                        onSelectedRowsChange={handleRowSelected}
                        customStyles={customStyles}
                        theme="devatlas"
                        highlightOnHover
                        pointerOnHover
                        onRowClicked={(row) => setSelectedPost(row)}
                        progressComponent={<LoadingComponent />}
                        noDataComponent={
                            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                                <Search className="w-10 h-10 mb-4 opacity-50" />
                                <p className="text-[15px] font-bold text-foreground mb-1">No posts found</p>
                                <p className="text-[13px]">Try adjusting your search criteria or review queue.</p>
                            </div>
                        }
                    />
                </div>

                {/* Sticky Bulk Action Bottom Bar */}
                {selectedRows.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#16181C] border border-[#2F3336] shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-[8px] px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in z-40">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-[#E7E9EA]">
                            <span className="flex items-center justify-center bg-[#1D9BF0] text-white w-6 h-6 rounded-full text-[12px]">{selectedRows.length}</span>
                            Selected
                        </div>
                        <div className="h-5 w-[1px] bg-[#2F3336]"></div>
                        <div className="flex items-center gap-2">
                            <button
                                className="px-4 py-1.5 hover:bg-[#00BA7C]/10 text-[#71767B] hover:text-[#00BA7C] rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer"
                                onClick={handleBulkApprove}
                            >
                                Approve All
                            </button>
                            <button
                                className="px-4 py-1.5 hover:bg-[#F91880]/10 text-[#71767B] hover:text-[#F91880] rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer"
                                onClick={handleBulkRemove}
                            >
                                Remove All
                            </button>
                            <button className="px-4 py-1.5 bg-[#E7E9EA] text-black hover:bg-white rounded-[8px] text-[13px] font-bold transition-colors ml-2 shadow-sm cursor-pointer">
                                Export Evidence
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-over Post Detail Drawer */}
            <PostDrawer
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
                onDelete={handleDelete}
                onRestore={handleRestore}
                onEscalate={handleEscalate}
            />
        </div>
    );
}
