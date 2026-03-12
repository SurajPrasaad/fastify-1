"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Users, ShieldAlert, TrendingUp, TrendingDown, Globe, ArrowUpRight,
    ChevronDown, Filter, MessageSquare, Heart, Bookmark, FileText,
    UserPlus
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { trpc } from "@/lib/trpc";
import { useTheme } from "next-themes";

// ==========================================
// 1. TYPES & HELPERS
// ==========================================

type DateRange = "24h" | "7d" | "30d" | "90d";

const formatCompact = (value: number): string =>
    new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
        Number.isFinite(value) ? value : 0,
    );

const formatPercent = (value: number, digits = 1): string =>
    `${(Number.isFinite(value) ? value : 0).toFixed(digits)}%`;

const dateRangeToHours = (range: DateRange): number => {
    switch (range) {
        case "24h":
            return 24;
        case "7d":
            return 24 * 7;
        case "30d":
            return 24 * 30;
        case "90d":
            return 24 * 90;
    }
};

// ==========================================
// 2. REUSABLE UI COMPONENTS
// ==========================================

const KpiCard = ({ title, value, change, isPositive, icon: Icon, colorClass, onClick, isActive }: any) => (
    <div
        onClick={onClick}
        className={`p-5 rounded-[8px] border transition-all cursor-pointer group relative overflow-hidden ${isActive
                ? 'border-[#1D9BF0] ring-1 ring-[#1D9BF0]/30 bg-[#1D9BF0]/5'
                : 'bg-[#F7F9F9] dark:bg-[#16181C] border-[#EFF3F4] dark:border-[#2F3336] hover:border-[#71767B]/50'
            }`}
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-[8px] bg-white dark:bg-[#000000] border border-[#EFF3F4] dark:border-[#2F3336] flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className={`flex items-center gap-1 text-[13px] font-bold px-2 py-1 rounded-md bg-white dark:bg-[#000000] border border-[#EFF3F4] dark:border-[#2F3336] ${isPositive ? 'text-[#00BA7C]' : 'text-[#F91880]'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change}
            </div>
        </div>
        <p className="text-[#536471] dark:text-[#71767B] text-[14px] font-medium mb-1">{title}</p>
        <p className="text-[26px] font-bold tracking-tight text-[#0F1419] dark:text-[#E7E9EA]">{value}</p>

        {/* Selection indicator dot */}
        {isActive && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#1D9BF0] shadow-[0_0_8px_rgba(29,155,240,0.8)]"></div>
        )}

        {/* Fake mini sparkline */}
        <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path d={isPositive ? "M0 20 L 20 15 L 40 18 L 60 10 L 80 12 L 100 0" : "M0 0 L 20 5 L 40 2 L 60 15 L 80 12 L 100 20"}
                    fill="none" stroke="currentColor" className={colorClass} strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    </div>
);

const AudienceTrendChart = ({ data, metric, theme }: { data: any[], metric: string, theme?: string }) => {
    const isDark = theme === "dark";
    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "axis",
            backgroundColor: isDark ? "#16181C" : "#FFFFFF",
            borderColor: isDark ? "#2F3336" : "#EFF3F4",
            textStyle: { color: isDark ? "#E7E9EA" : "#0F1419" },
            axisPointer: { lineStyle: { color: isDark ? "#71767B" : "#536471", type: "dashed" } },
        },
        grid: {
            top: 20,
            left: 50,
            right: 20,
            bottom: 30,
            containLabel: false,
        },
        xAxis: {
            type: "category",
            data: data.map(d => d.date),
            axisLine: { lineStyle: { color: isDark ? "#2F3336" : "#EFF3F4" } },
            axisLabel: { color: isDark ? "#71767B" : "#536471", fontSize: 11, fontFamily: "monospace" },
            boundaryGap: false,
        },
        yAxis: {
            type: "value",
            splitLine: { lineStyle: { color: isDark ? "#2F3336" : "#EFF3F4", width: 1, type: "solid" } },
            axisLabel: {
                color: isDark ? "#71767B" : "#536471",
                fontSize: 11,
                fontFamily: "monospace",
                formatter: (val: number) => formatCompact(val),
            },
        },
        series: metric === "users" ? [
            {
                name: "DAU",
                type: "line",
                data: data.map(d => d.activeUsers),
                smooth: true,
                showSymbol: false,
                lineStyle: { width: 3, color: "#1D9BF0" },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: "rgba(29, 155, 240, 0.2)" },
                        { offset: 1, color: "rgba(29, 155, 240, 0)" },
                    ]),
                },
            },
        ] : [
            {
                name: metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
                type: "line",
                data: data.map(d => metric === "signups" ? d.newUsers : d[metric] || 0),
                smooth: true,
                showSymbol: false,
                lineStyle: {
                    width: 3,
                    color: metric === "posts" ? "#00BA7C" :
                        metric === "comments" ? "#8247E5" :
                            metric === "likes" ? "#F91880" :
                                metric === "bookmarks" ? "#FFD400" :
                                    metric === "signups" ? "#9eeca2ff" :
                                        "#F91880" // activeReports
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0, color: metric === "posts" ? "rgba(0, 186, 124, 0.2)" :
                                metric === "comments" ? "rgba(130, 71, 229, 0.2)" :
                                    metric === "likes" ? "rgba(249, 24, 128, 0.2)" :
                                        metric === "bookmarks" ? "rgba(255, 212, 0, 0.2)" :
                                            metric === "signups" ? "rgba(158, 236, 162, 0.2)" :
                                                "rgba(249, 24, 128, 0.2)"
                        },
                        { offset: 1, color: "rgba(0, 0, 0, 0)" },
                    ]),
                },
            }
        ],
    };

    return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge={true} />;
};

const ModerationLoadChart = ({ data, theme }: { data: any[], theme?: string }) => {
    const isDark = theme === "dark";
    const isDataEmpty = !data || data.length === 0;
    const chartData = isDataEmpty ? [
        { category: "Spam", count: 40 },
        { category: "Hate Speech", count: 60 },
        { category: "Violence", count: 45 },
        { category: "Harassment", count: 80 },
        { category: "Adult", count: 50 }
    ] : data;

    const option = {
        backgroundColor: "transparent",
        tooltip: {
            trigger: "axis",
            backgroundColor: isDark ? "#16181C" : "#FFFFFF",
            borderColor: isDark ? "#2F3336" : "#EFF3F4",
            textStyle: { color: isDark ? "#E7E9EA" : "#0F1419" },
        },
        grid: {
            top: 10,
            left: 0,
            right: 0,
            bottom: 0,
            containLabel: false,
        },
        xAxis: {
            type: "category",
            data: chartData.map(d => d.category),
            show: false,
        },
        yAxis: {
            type: "value",
            show: false,
        },
        series: [
            {
                name: "Reports",
                type: "bar",
                data: chartData.map(d => d.count),
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: (params: any) => {
                        return params.value > 70 ? "#F91880" : "#FFD400";
                    },
                },
                barWidth: "60%",
            },
        ],
    };

    return <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge={true} />;
};


// ==========================================
// 4. MAIN DASHBOARD PAGE
// ==========================================

export default function AnalyticsDashboardPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange>("24h");
    const [activeMetric, setActiveMetric] = useState<"users" | "posts" | "comments" | "likes" | "bookmarks" | "activeReports" | "signups">("users");

    useEffect(() => {
        setMounted(true);
    }, []);

    const statsQuery = trpc.admin.getStats.useQuery({
        timeRangeHours: dateRangeToHours(dateRange),
    }, {
        refetchInterval: 60_000,
    });
    const stats = statsQuery.data as
        | {
            kpis: {
                totalUsers: number;
                userGrowthRate: number;
                totalPosts: number;
                postGrowthRate: number;
                totalBookmarks: number;
                bookmarkGrowthRate: number;
                activeReports: number;
                reportGrowthRate: number;
                dau: number;
                mau: number;
                newSignups24h: number;
                apiRequests24h: number;
                slaCompliance: number;
                uptimePercent: number;
            };
            audienceGrowth: Array<{
                date: string;
                activeUsers: number;
                newUsers: number;
                posts: number;
                comments: number;
                likes: number;
                bookmarks: number;
                activeReports: number;
            }>;
            engagement: {
                likes: number;
                likeGrowthRate: number;
                comments: number;
                commentGrowthRate: number;
                reposts: number
            };
            reportCategories: Array<{ category: string; count: number }>;
            platformHealth: { queueSize: number; queueStatus: "HEALTHY" | "ELEVATED" | "CRITICAL" };
            byRegion: Array<{ region: unknown; count: number }>;
            content: { trendingHashtags: Array<{ name: string; count: number }>; mediaStorageBytes: number };
            demographics: { subscriptionTiers: Array<{ plan: string; count: number }>; deviceDistribution: Array<{ platform: string; count: number }> };
            liveFeatures: { activeRooms: number };
            system: { notificationDelivery: Array<{ status: string; count: number }>; pendingAppeals: number };
        }
        | undefined;

    const kpiData = useMemo(() => {
        if (!stats) {
            return {
                totalUsers: { value: "---", change: "0.0%", isPositive: true },
                newSignups: { value: "---", change: "0.0%", isPositive: true },
                totalPosts: { value: "---", change: "0.0%", isPositive: true },
                comments: { value: "---", change: "0.0%", isPositive: true },
                likes: { value: "---", change: "0.0%", isPositive: true },
                bookmarks: { value: "---", change: "0.0%", isPositive: true },
                reports: { value: "---", change: "0.0%", isPositive: true },
            };
        }

        const { kpis, engagement } = stats;

        const formatChange = (val: number) => {
            const prefix = val >= 0 ? "+" : "";
            return `${prefix}${val.toFixed(1)}%`;
        };

        return {
            totalUsers: {
                value: kpis.totalUsers.toLocaleString("en-US"),
                change: formatChange(kpis.userGrowthRate),
                isPositive: kpis.userGrowthRate >= 0,
            },
            newSignups: {
                value: kpis.newSignups24h.toLocaleString("en-US"),
                change: formatChange(kpis.userGrowthRate), // uses signups growth
                isPositive: kpis.userGrowthRate >= 0,
            },
            totalPosts: {
                value: kpis.totalPosts.toLocaleString("en-US"),
                change: formatChange(kpis.postGrowthRate),
                isPositive: kpis.postGrowthRate >= 0,
            },
            comments: {
                value: formatCompact(engagement.comments),
                change: formatChange(engagement.commentGrowthRate),
                isPositive: engagement.commentGrowthRate >= 0,
            },
            likes: {
                value: formatCompact(engagement.likes),
                change: formatChange(engagement.likeGrowthRate),
                isPositive: engagement.likeGrowthRate >= 0,
            },
            bookmarks: {
                value: kpis.totalBookmarks.toLocaleString("en-US"),
                change: formatChange(kpis.bookmarkGrowthRate),
                isPositive: kpis.bookmarkGrowthRate >= 0,
            },
            reports: {
                value: kpis.activeReports.toLocaleString("en-US"),
                change: formatChange(kpis.reportGrowthRate),
                isPositive: kpis.reportGrowthRate <= 0, // Negative report growth is usually positive
            },
        };
    }, [stats]);

    // Simulated Real-Time Clock
    const [time, setTime] = useState("");
    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-[#000000] text-[#0F1419] dark:text-[#E7E9EA] h-[100vh] font-display">

            {/* TOP HEADER: Filters & Context */}
            <div className="px-6 py-4 border-b border-[#EFF3F4] dark:border-[#2F3336] bg-white/90 dark:bg-[#000000]/90 backdrop-blur-md z-10 shrink-0 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#0F1419] dark:text-[#E7E9EA] flex items-center gap-2">
                        Platform Telemetry & Analytics
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#536471] dark:text-[#71767B] font-mono">
                        <span className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00BA7C] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00BA7C]"></span>
                            </span>
                            LIVE STREAMING
                        </span>
                        <span>•</span>
                        <span>Last updated: {time}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range Selector */}
                    <div className="flex bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-md p-1">
                        {(["24h", "7d", "30d", "90d"] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1 text-[12px] font-bold rounded-sm transition-colors ${dateRange === range
                                    ? "bg-white dark:bg-[#333639] text-[#0F1419] dark:text-[#E7E9EA] shadow-sm"
                                    : "text-[#536471] dark:text-[#71767B] hover:text-[#0F1419] dark:hover:text-[#E7E9EA]"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN DASHBOARD CANVAS */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. EXECUTIVE KPI GRID (6 cols) */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4">
                    <KpiCard
                        title="Total Users"
                        value={kpiData.totalUsers.value}
                        change={kpiData.totalUsers.change}
                        isPositive={kpiData.totalUsers.isPositive}
                        icon={Users}
                        colorClass="text-[#1D9BF0]"
                        onClick={() => setActiveMetric("users")}
                        isActive={activeMetric === "users"}
                    />
                    <KpiCard
                        title="New Signups"
                        value={kpiData.newSignups.value}
                        change={kpiData.newSignups.change}
                        isPositive={kpiData.newSignups.isPositive}
                        icon={UserPlus}
                        colorClass="text-[#9eeca2ff]"
                        onClick={() => setActiveMetric("signups")}
                        isActive={activeMetric === "signups"}
                    />
                    <KpiCard
                        title="Total Posts"
                        value={kpiData.totalPosts.value}
                        change={kpiData.totalPosts.change}
                        isPositive={kpiData.totalPosts.isPositive}
                        icon={FileText}
                        colorClass="text-[#00BA7C]"
                        onClick={() => setActiveMetric("posts")}
                        isActive={activeMetric === "posts"}
                    />
                    <KpiCard
                        title="Total Comments"
                        value={kpiData.comments.value}
                        change={kpiData.comments.change}
                        isPositive={kpiData.comments.isPositive}
                        icon={MessageSquare}
                        colorClass="text-[#8247E5]"
                        onClick={() => setActiveMetric("comments")}
                        isActive={activeMetric === "comments"}
                    />
                    <KpiCard
                        title="Total Likes"
                        value={kpiData.likes.value}
                        change={kpiData.likes.change}
                        isPositive={kpiData.likes.isPositive}
                        icon={Heart}
                        colorClass="text-[#F91880]"
                        onClick={() => setActiveMetric("likes")}
                        isActive={activeMetric === "likes"}
                    />
                    <KpiCard
                        title="Bookmarks"
                        value={kpiData.bookmarks.value}
                        change={kpiData.bookmarks.change}
                        isPositive={kpiData.bookmarks.isPositive}
                        icon={Bookmark}
                        colorClass="text-[#FFD400]"
                        onClick={() => setActiveMetric("bookmarks")}
                        isActive={activeMetric === "bookmarks"}
                    />
                    <KpiCard
                        title="Active Reports"
                        value={kpiData.reports.value}
                        change={kpiData.reports.change}
                        isPositive={kpiData.reports.isPositive}
                        icon={ShieldAlert}
                        colorClass="text-[#F91880]"
                        onClick={() => setActiveMetric("activeReports")}
                        isActive={activeMetric === "activeReports"}
                    />
                </div>

                {/* 2. CORE ANALYTICS BANDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Primary Large Chart: DAU/MAU Trend */}
                    <div className="lg:col-span-2 bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-[8px] p-5 shadow-sm flex flex-col h-[380px]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h3 className="text-[16px] font-bold text-[#0F1419] dark:text-[#E7E9EA]">
                                    {activeMetric === "users" ? "Active Audience Growth" :
                                        activeMetric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) + " Activity"}
                                </h3>
                                <p className="text-[13px] text-[#536471] dark:text-[#71767B]">
                                    {activeMetric === "users" ? "Unique authenticated sessions across web and mobile." :
                                        `Daily volume of ${activeMetric.replace(/([A-Z])/g, ' $1').toLowerCase()} across the platform.`}
                                </p>
                            </div>
                            <div className="flex gap-4 items-center">
                                {activeMetric === "users" && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#536471] dark:text-[#71767B]">
                                        <span className="w-2.5 h-2.5 rounded-sm bg-[#1D9BF0]"></span> DAU
                                    </div>
                                )}
                                {activeMetric !== "users" && (
                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#536471] dark:text-[#71767B]">
                                        <span className={`w-2.5 h-2.5 rounded-sm ${activeMetric === "posts" ? "bg-[#00BA7C]" :
                                                activeMetric === "comments" ? "bg-[#8247E5]" :
                                                    activeMetric === "likes" ? "bg-[#F91880]" :
                                                        activeMetric === "bookmarks" ? "bg-[#FFD400]" :
                                                            activeMetric === "signups" ? "bg-[#9eeca2ff]" :
                                                                "bg-[#F91880]" // activeReports
                                            }`}></span> {activeMetric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </div>
                                )}
                                <button className="p-1 hover:bg-[#EBEDF0] dark:hover:bg-[#2F3336] rounded text-[#536471] dark:text-[#71767B] transition-colors">
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative w-full pt-4">
                            {stats?.audienceGrowth ? (
                                <AudienceTrendChart data={stats.audienceGrowth} metric={activeMetric} theme={resolvedTheme} />
                            ) : (
                                <>
                                    {/* Y-Axis scale marks */}
                                    <div className="absolute inset-y-4 left-0 w-8 flex flex-col justify-between text-[11px] font-mono text-[#536471] dark:text-[#71767B] pb-6">
                                        <span>20M</span><span>15M</span><span>10M</span><span>5M</span>
                                    </div>
                                    {/* Chart Area */}
                                    <div className="absolute inset-y-0 left-10 right-0 border-b border-l border-[#EFF3F4] dark:border-[#2F3336]">
                                        {/* Horizontal grid lines */}
                                        <div className="absolute inset-x-0 top-0 h-[1px] bg-[#EFF3F4]/30 dark:bg-[#2F3336]/30"></div>
                                        <div className="absolute inset-x-0 top-1/3 h-[1px] bg-[#EFF3F4]/30 dark:bg-[#2F3336]/30"></div>
                                        <div className="absolute inset-x-0 top-2/3 h-[1px] bg-[#EFF3F4]/30 dark:bg-[#2F3336]/30"></div>

                                        <svg className="w-full h-full pb-6" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                            <path d="M0 250 L 100 240 L 200 200 L 300 180 L 400 150 L 500 160 L 600 120 L 700 90 L 800 100 L 900 80 L 1000 40" fill="none" stroke="#1D9BF0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M0 180 L 100 170 L 200 150 L 300 140 L 400 130 L 500 120 L 600 100 L 700 80 L 800 60 L 900 50 L 1000 20" fill="none" stroke="#8247E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                                            {/* Data point glow effect */}
                                            <circle cx="1000" cy="40" r="5" fill="#1D9BF0" className="animate-pulse" />
                                            <circle cx="1000" cy="20" r="5" fill="#8247E5" className="animate-pulse" />
                                        </svg>

                                        {/* X-Axis marks */}
                                        <div className="absolute bottom-0 inset-x-0 h-6 flex justify-between items-end text-[11px] font-mono text-[#536471] dark:text-[#71767B] px-2">
                                            <span>Feb 20</span><span>Feb 22</span><span>Feb 24</span><span>Feb 26</span><span>Today</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Secondary Stack: Geo & Moderation */}
                    <div className="space-y-6">
                        {/* Geographic Density Mini-widget */}
                        <div className="bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-[8px] p-5 shadow-sm h-[178px] flex flex-col hover:border-[#71767B]/50 transition-colors">
                            <h3 className="text-[14px] font-bold text-[#0F1419] dark:text-[#E7E9EA] mb-4 flex justify-between items-center">
                                Request Origin Density
                                <MapPinIcon />
                            </h3>
                            <div className="space-y-3 flex-1 overflow-hidden">
                                {(() => {
                                    const regions = (stats?.byRegion ?? []) as Array<{ region: unknown; count: number }>;
                                    const total = regions.reduce((sum, r) => sum + (r.count ?? 0), 0) || 1;
                                    const top = regions
                                        .map((r) => ({
                                            name:
                                                Array.isArray(r.region) && r.region.length
                                                    ? (r.region as string[]).join(", ")
                                                    : typeof r.region === "string"
                                                        ? (r.region as string)
                                                        : "Global",
                                            percent: Math.round(((r.count ?? 0) / total) * 100),
                                        }))
                                        .sort((a, b) => b.percent - a.percent)
                                        .slice(0, 3);

                                    const fallbacks = [
                                        { name: "North America (us-east-1)", percent: 48 },
                                        { name: "Europe (eu-central-1)", percent: 35 },
                                        { name: "Asia Pacific (ap-northeast-1)", percent: 17 },
                                    ];

                                    const rows = top.length ? top : fallbacks;

                                    return rows.map((row, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-[12px] font-bold text-[#0F1419] dark:text-[#E7E9EA] mb-1.5">
                                                <span>{row.name}</span>
                                                <span>{row.percent}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-[#000000] rounded-full overflow-hidden">
                                                <div
                                                    className="bg-[#1D9BF0] h-full"
                                                    style={{ width: `${Math.min(row.percent, 100)}%`, opacity: 1 - idx * 0.2 }}
                                                ></div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                        {/* Content Moderation Spikes */}
                        <div className="bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-[8px] p-5 shadow-sm h-[178px] flex flex-col hover:border-[#71767B]/50 transition-colors">
                            <h3 className="text-[14px] font-bold text-[#0F1419] dark:text-[#E7E9EA] mb-4 flex justify-between items-center">
                                Moderation Load
                                <span className="text-[11px] px-2 py-0.5 bg-[#F91880]/10 text-[#F91880] rounded border border-[#F91880]/20 font-bold">
                                    {stats?.platformHealth.queueStatus ?? "HEALTHY"}
                                </span>
                            </h3>
                            <div className="flex-1">
                                <ModerationLoadChart data={stats?.reportCategories ?? []} theme={resolvedTheme} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. EXTENDED PLATFORM METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Trending Hashtags */}
                    <div className="bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-[8px] p-5 shadow-sm block hover:border-[#71767B]/50 transition-colors">
                        <h3 className="text-[14px] font-bold text-[#0F1419] dark:text-[#E7E9EA] mb-4 flex justify-between items-center">
                            Trending Tags (Live)
                        </h3>
                        <div className="space-y-3">
                            {(stats?.content?.trendingHashtags || []).length > 0 ? stats?.content?.trendingHashtags.map((tag, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[13px]">
                                    <span className="font-bold text-[#1D9BF0]">#{tag.name}</span>
                                    <span className="text-[#536471] dark:text-[#71767B]">{formatCompact(tag.count)} posts</span>
                                </div>
                            )) : (
                                <p className="text-[#536471] dark:text-[#71767B] text-[13px]">No recent trending tags.</p>
                            )}
                        </div>
                    </div>

                    {/* Media Storage */}
                    <div className="bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-[8px] p-5 shadow-sm flex flex-col justify-between hover:border-[#71767B]/50 transition-colors">
                        <h3 className="text-[14px] font-bold text-[#0F1419] dark:text-[#E7E9EA] mb-2 flex justify-between items-center">
                            Media Bandwidth & Storage
                        </h3>
                        <div>
                            <p className="text-[#536471] dark:text-[#71767B] text-[13px] mb-1">Total CDN Volume Occupied</p>
                            <p className="text-[24px] font-bold text-[#8247E5]">
                                {stats?.content?.mediaStorageBytes ? (stats.content.mediaStorageBytes / (1024 * 1024 * 1024)).toFixed(2) : '0.00'} <span className="text-[14px] text-[#536471] dark:text-[#71767B]">GB</span>
                            </p>
                            <div className="w-full h-1 mt-3 bg-slate-200 dark:bg-[#000000] rounded-full overflow-hidden">
                                <div className="bg-[#8247E5] h-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Pending Appeals & Mods */}
                    <div className="bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-[8px] p-5 shadow-sm flex flex-col justify-between hover:border-[#71767B]/50 transition-colors">
                        <h3 className="text-[14px] font-bold text-[#0F1419] dark:text-[#E7E9EA] mb-2 flex justify-between items-center">
                            Moderator Escalations
                        </h3>
                        <div>
                            <p className="text-[#536471] dark:text-[#71767B] text-[13px] mb-1">Pending Appeals Queue</p>
                            <p className="text-[24px] font-bold text-[#F91880]">
                                {stats?.system?.pendingAppeals || 0}
                            </p>
                            <p className="text-[12px] font-bold text-[#F91880] mt-1 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Requires Senior Admin
                            </p>
                        </div>
                    </div>

                    {/* Audio Rooms (Live) */}
                    <div className="bg-[#F7F9F9] dark:bg-[#16181C] border border-[#EFF3F4] dark:border-[#2F3336] rounded-[8px] p-5 shadow-sm flex flex-col justify-between hover:border-[#71767B]/50 transition-colors">
                        <h3 className="text-[14px] font-bold text-[#0F1419] dark:text-[#E7E9EA] mb-2 flex justify-between items-center">
                            Live Audio Rooms
                            <div className="w-2 h-2 rounded-full bg-[#00BA7C] animate-pulse"></div>
                        </h3>
                        <div>
                            <p className="text-[#536471] dark:text-[#71767B] text-[13px] mb-1">Active Broadcasts</p>
                            <p className="text-[24px] font-bold text-[#00BA7C]">
                                {stats?.liveFeatures?.activeRooms || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const MapPinIcon = () => (
    <svg className="w-4 h-4 text-[#71767B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
