"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactECharts from 'echarts-for-react';
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
    Users, Activity, ShieldAlert,
    TrendingUp, TrendingDown, Clock, Globe, Download,
    ChevronDown, Filter, X, ArrowUpRight, Server,
    AlertCircle, CheckCircle2, ShieldCheck, Database
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================

type DateRange = "24h" | "7d" | "30d" | "90d";

const KPI_FALLBACK = {
    totalUsers: { value: "0", change: "0%", isPositive: true },
    dau: { value: "0", change: "0%", isPositive: true },
    mau: { value: "0", change: "0%", isPositive: true },
    signups: { value: "0", change: "0%", isPositive: true },
    reports: { value: "0", change: "0%", isPositive: true },
    sla: { value: "100%", change: "0%", isPositive: true },
    api: { value: "0", change: "0%", isPositive: true },
    uptime: { value: "99.99%", change: "0%", isPositive: true },
};

const formatCompactNumber = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    return new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value);
};

// ==========================================
// 2. REUSABLE COMPONENTS
// ==========================================

const KpiCard = ({ title, value, change, isPositive, icon: Icon, colorClass, onClick }: any) => (
    <div
        onClick={onClick}
        className="bg-white dark:bg-[#16181C] p-5 rounded-[8px] border border-slate-200 dark:border-[#2F3336]/50 shadow-sm hover:border-slate-300 dark:hover:border-[#71767B]/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
    >
        <div className="flex items-center justify-between mb-3 text-slate-500 dark:text-[#71767B]">
            <span className="font-semibold text-[13px] tracking-wide uppercase">{title}</span>
            <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-black border border-slate-200 dark:border-[#2F3336] flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
        <div className="flex items-end justify-between">
            <h3 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-[#E7E9EA] leading-none">{value}</h3>
            <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-black border border-slate-200 dark:border-[#2F3336] ${isPositive ? 'text-[#00BA7C]' : 'text-[#F91880]'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change}
            </div>
        </div>
        {/* Decorative subtle background sparkline effect */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path d={isPositive ? "M0 20 L 20 15 L 40 18 L 60 10 L 80 12 L 100 0" : "M0 0 L 20 5 L 40 2 L 60 15 L 80 12 L 100 20"}
                    fill="none" stroke="currentColor" className={colorClass} strokeWidth="3" strokeLinecap="round" />
            </svg>
        </div>
    </div>
);

// Drilldown Drawer Component
const DrilldownDrawer = ({ isOpen, onClose, title }: { isOpen: boolean, onClose: () => void, title: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-[600px] bg-white dark:bg-black border-l border-slate-200 dark:border-[#2F3336] h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-[#2F3336] flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#000000]">
                    <div>
                        <h2 className="text-[18px] font-bold text-slate-900 dark:text-[#E7E9EA]">Drilldown: {title}</h2>
                        <p className="text-[13px] text-slate-500 dark:text-[#71767B]">Detailed historical data preview</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] rounded-md text-[13px] font-bold text-slate-900 dark:text-[#E7E9EA] hover:bg-slate-100 dark:hover:bg-[#2F3336]">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 dark:text-[#71767B] hover:text-slate-900 dark:hover:text-[#E7E9EA] hover:bg-slate-100 dark:hover:bg-[#16181C] rounded-full ml-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center text-slate-400 dark:text-[#71767B]">
                    <Database className="w-12 h-12 mb-4 opacity-20 dark:opacity-30" />
                    <p className="text-[15px] font-bold text-slate-900 dark:text-[#E7E9EA]">Comprehensive Data Logs</p>
                    <p className="text-[13px]">Raw timeseries data for {title} would populate here.</p>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. ECHARTS CONFIGURATIONS
// ==========================================

const commonChartConfig = (theme: string | undefined) => ({
    backgroundColor: "transparent",
    tooltip: {
        trigger: "axis",
        backgroundColor: theme === "dark" ? "#16181C" : "#FFFFFF",
        borderColor: theme === "dark" ? "#2F3336" : "#E2E8F0",
        borderWidth: 1,
        textStyle: { color: theme === "dark" ? "#E7E9EA" : "#0F172A", fontSize: 13, fontFamily: "inherit" },
        axisPointer: { type: "shadow" },
    },
    grid: { top: 30, right: 10, bottom: 20, left: 40, containLabel: false },
    xAxis: {
        type: "category",
        axisLine: { lineStyle: { color: theme === "dark" ? "#2F3336" : "#E2E8F0" } },
        axisTick: { show: false },
        axisLabel: { color: theme === "dark" ? "#71767B" : "#64748B", fontSize: 11, fontFamily: "inherit", margin: 12 },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: theme === "dark" ? "#2F3336" : "#F1F5F9", type: "dashed" } },
        axisLabel: {
            color: theme === "dark" ? "#71767B" : "#64748B",
            fontSize: 11,
            fontFamily: "inherit",
            formatter: (value: number) => (value >= 1000 ? value / 1000 + "k" : value),
        },
    },
});

const buildDauMauConfig = (labels: string[], dauValues: number[], mauValues: number[], theme: string | undefined) => ({
    ...commonChartConfig(theme),
    title: { show: false },
    legend: { show: false },
    xAxis: { ...commonChartConfig(theme).xAxis, data: labels.length ? labels : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    series: [
        {
            name: "DAU",
            type: "line",
            smooth: true,
            symbolSize: 6,
            itemStyle: { color: "#1D9BF0" },
            lineStyle: { width: 3 },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(29, 155, 240, 0.2)" },
                        { offset: 1, color: "rgba(29, 155, 240, 0)" },
                    ],
                },
            },
            data: dauValues.length ? dauValues : [0, 0, 0, 0, 0, 0, 0],
        },
        {
            name: "MAU",
            type: "line",
            smooth: true,
            symbolSize: 6,
            itemStyle: { color: "#8247E5" },
            lineStyle: { width: 3 },
            data: mauValues.length ? mauValues : [0, 0, 0, 0, 0, 0, 0],
        },
    ],
});

const buildEngagementBarConfig = (values: { likes: number; comments: number; reposts: number }, theme: string | undefined) => ({
    ...commonChartConfig(theme),
    grid: { top: 30, right: 10, bottom: 20, left: 10, containLabel: true },
    xAxis: { ...commonChartConfig(theme).xAxis, data: ["Likes", "Comments", "Shares", "Saves"] },
    series: [
        {
            type: "bar",
            barWidth: "40%",
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            data: [
                { value: values.likes || 0, itemStyle: { color: "#F91880" } },
                { value: values.comments || 0, itemStyle: { color: "#1D9BF0" } },
                { value: values.reposts || 0, itemStyle: { color: "#00BA7C" } },
                { value: 0, itemStyle: { color: "#FFD400" } },
            ],
        },
    ],
});

const buildReportsDonutConfig = (
    categories: Array<{ name: string; value: number; color: string }>,
    theme: string | undefined
) => ({
    backgroundColor: "transparent",
    tooltip: {
        trigger: "item",
        backgroundColor: theme === "dark" ? "#16181C" : "#FFFFFF",
        borderColor: theme === "dark" ? "#2F3336" : "#E2E8F0",
        borderWidth: 1,
        textStyle: { color: theme === "dark" ? "#E7E9EA" : "#0F172A", fontSize: 13 },
    },
    legend: { show: false },
    series: [
        {
            name: "Reports",
            type: "pie",
            radius: ["55%", "85%"],
            avoidLabelOverlap: false,
            itemStyle: { borderColor: theme === "dark" ? "#16181C" : "#FFFFFF", borderWidth: 2 },
            label: { show: false },
            data:
                categories.length > 0
                    ? categories
                    : [
                        { value: 45, name: "Spam", itemStyle: { color: "#71767B" } },
                        { value: 30, name: "Harassment", itemStyle: { color: "#FFD400" } },
                        { value: 15, name: "Hate Speech", itemStyle: { color: "#F91880" } },
                        { value: 10, name: "NSFW", itemStyle: { color: "#8247E5" } },
                        { value: 10, name: "Other", itemStyle: { color: "#1D9BF0" } },
                    ],
        },
    ],
});

// ==========================================
// 4. MAIN PAGE
// ==========================================

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

export default function AdminDashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange>("24h");
    const [drilldown, setDrilldown] = useState<string | null>(null);
    const [time, setTime] = useState("");

    const { theme } = useTheme();

    const statsQuery = trpc.admin.getStats.useQuery({
        timeRangeHours: dateRangeToHours(dateRange),
    }, {
        refetchInterval: 60_000,
    });
    const stats = statsQuery.data as
        | {
            kpis: {
                totalUsers: number;
                dau: number;
                mau: number;
                newSignups24h: number;
                activeReports: number;
                apiRequests24h: number;
                slaCompliance: number;
                uptimePercent: number;
            };
            audienceGrowth: Array<{ date: string; activeUsers: number; newUsers: number }>;
            engagement: { likes: number; comments: number; reposts: number };
            reportCategories: Array<{ category: string; count: number }>;
            platformHealth: { queueSize: number; queueStatus: "HEALTHY" | "ELEVATED" | "CRITICAL" };
        }
        | undefined;

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    const kpis = useMemo(() => {
        if (!stats) return KPI_FALLBACK;

        const { kpis } = stats;

        return {
            totalUsers: {
                ...KPI_FALLBACK.totalUsers,
                value: formatCompactNumber(kpis.totalUsers),
            },
            mau: {
                ...KPI_FALLBACK.mau,
                value: formatCompactNumber(kpis.mau),
            },
            dau: {
                ...KPI_FALLBACK.dau,
                value: formatCompactNumber(kpis.dau),
            },
            signups: {
                ...KPI_FALLBACK.signups,
                value: formatCompactNumber(kpis.newSignups24h),
            },
            reports: {
                ...KPI_FALLBACK.reports,
                value: formatCompactNumber(kpis.activeReports),
            },
            sla: {
                ...KPI_FALLBACK.sla,
                value: `${kpis.slaCompliance.toFixed(1)}%`,
            },
            api: {
                ...KPI_FALLBACK.api,
                value: formatCompactNumber(kpis.apiRequests24h),
            },
            uptime: {
                ...KPI_FALLBACK.uptime,
                value: `${kpis.uptimePercent.toFixed(2)}%`,
            },
        };
    }, [stats]);

    const audienceLabels = useMemo(
        () => stats?.audienceGrowth.map((p) => p.date.slice(5)) ?? [],
        [stats?.audienceGrowth],
    );
    const audienceDau = useMemo(
        () => stats?.audienceGrowth.map((p) => p.activeUsers) ?? [],
        [stats?.audienceGrowth],
    );
    const audienceMau = useMemo(
        () => stats?.audienceGrowth.map((p) => p.newUsers) ?? [],
        [stats?.audienceGrowth],
    );

    const dauMauOption = useMemo(
        () => buildDauMauConfig(audienceLabels, audienceDau, audienceMau, theme),
        [audienceLabels, audienceDau, audienceMau, theme],
    );

    const engagementBarOption = useMemo(
        () => buildEngagementBarConfig(stats?.engagement ?? { likes: 0, comments: 0, reposts: 0 }, theme),
        [stats?.engagement, theme],
    );

    const reportCategoryOption = useMemo(
        () =>
            buildReportsDonutConfig(
                (stats?.reportCategories ?? []).map((c) => ({
                    name: c.category,
                    value: c.count,
                    color:
                        c.category === "SPAM"
                            ? "#71767B"
                            : c.category === "HARASSMENT"
                                ? "#FFD400"
                                : c.category === "HATE_SPEECH"
                                    ? "#F91880"
                                    : "#8247E5",
                })),
                theme
            ),
        [stats?.reportCategories, theme],
    );

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-[#000000] text-slate-900 dark:text-[#E7E9EA] h-[100vh] font-display transition-colors duration-300">

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#2F3336] bg-white/90 dark:bg-[#000000]/90 backdrop-blur-md z-20 shrink-0 flex flex-wrap items-center justify-between gap-4 sticky top-0">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-slate-900 dark:text-[#E7E9EA]">Executive Dashboard</h1>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-slate-400 dark:text-[#71767B] font-mono">
                        <span className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-[#00BA7C] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00BA7C]"></span>
                            </span>
                            LIVE SYSTEM
                        </span>
                        <span>•</span>
                        <span>{time}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-slate-100 dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] rounded-md p-1">
                        {(["24h", "7d", "30d", "90d"] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1 text-[12px] font-bold rounded-sm transition-colors ${dateRange === range ? "bg-white dark:bg-[#333639] text-[#1D9BF0] dark:text-[#E7E9EA] shadow-sm" : "text-slate-500 dark:text-[#71767B] hover:text-[#1D9BF0] dark:hover:text-[#E7E9EA]"}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] rounded-xl text-[13px] font-bold text-slate-700 dark:text-[#E7E9EA] hover:bg-slate-50 dark:hover:bg-[#2F3336]">
                        <Globe className="w-4 h-4 text-slate-400 dark:text-[#71767B]" /> Global <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. EXECUTIVE KPIs (8 cards) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    <KpiCard title="Total Users" value={kpis.totalUsers.value} change={kpis.totalUsers.change} isPositive={true} icon={Users} colorClass="text-[#1D9BF0]" onClick={() => setDrilldown("Total Users")} />
                    <KpiCard title="Monthly Active (MAU)" value={kpis.mau.value} change={kpis.mau.change} isPositive={true} icon={Activity} colorClass="text-[#8247E5]" onClick={() => setDrilldown("MAU")} />
                    <KpiCard title="Daily Active (DAU)" value={kpis.dau.value} change={kpis.dau.change} isPositive={true} icon={Activity} colorClass="text-[#1D9BF0]" onClick={() => setDrilldown("DAU")} />
                    <KpiCard title="New Signups" value={kpis.signups.value} change={kpis.signups.change} isPositive={true} icon={Users} colorClass="text-[#00BA7C]" onClick={() => setDrilldown("Signups")} />
                    <KpiCard title="Active Reports" value={kpis.reports.value} change={kpis.reports.change} isPositive={true} icon={ShieldAlert} colorClass="text-[#FFD400]" onClick={() => setDrilldown("Reports")} />
                    <KpiCard title="Mod SLA Compliance" value={kpis.sla.value} change={kpis.sla.change} isPositive={true} icon={ShieldCheck} colorClass="text-[#00BA7C]" onClick={() => setDrilldown("SLA Compliance")} />
                    <KpiCard title="API Requests" value={kpis.api.value} change={kpis.api.change} isPositive={true} icon={Server} colorClass="text-[#71767B]" onClick={() => setDrilldown("API Requests")} />
                    <KpiCard title="System Uptime" value={kpis.uptime.value} change={kpis.uptime.change} isPositive={true} icon={CheckCircle2} colorClass="text-[#00BA7C]" onClick={() => setDrilldown("Uptime")} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* 2. USER GROWTH SECTION */}
                    <div className="xl:col-span-2 bg-white dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] rounded-[8px] p-6 flex flex-col min-h-[400px] shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-[18px] font-bold text-slate-900 dark:text-[#E7E9EA]">Audience Growth</h3>
                                <p className="text-[13px] text-slate-500 dark:text-[#71767B]">DAU vs MAU trends</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-[#E7E9EA]"><span className="w-2.5 h-2.5 rounded-sm bg-[#1D9BF0]"></span> DAU</div>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-700 dark:text-[#E7E9EA]"><span className="w-2.5 h-2.5 rounded-sm bg-[#8247E5]"></span> MAU</div>
                                <button className="ml-2 text-slate-400 dark:text-[#71767B] hover:text-slate-900 dark:hover:text-[#E7E9EA]" onClick={() => setDrilldown("Growth")}><ArrowUpRight className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ReactECharts option={dauMauOption} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* 3. ENGAGEMENT DISTRIBUTION */}
                        <div className="bg-white dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] rounded-[8px] p-6 flex flex-col flex-1 min-h-[220px] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-[#E7E9EA]">Engagement Distribution</h3>
                                <button className="text-slate-400 dark:text-[#71767B] hover:text-slate-900 dark:hover:text-[#E7E9EA]" onClick={() => setDrilldown("Engagement")}><ArrowUpRight className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ReactECharts option={engagementBarOption} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                            </div>
                        </div>

                        {/* 4. MODERATION CATEGORIES */}
                        <div className="bg-white dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] rounded-[8px] p-6 flex items-center justify-between min-h-[160px] shadow-sm">
                            <div className="flex-1">
                                <h3 className="text-[16px] font-bold text-slate-900 dark:text-[#E7E9EA] mb-4">Report Categories</h3>
                                <div className="space-y-2.5">
                                    {(stats?.reportCategories && stats.reportCategories.length > 0) ? stats.reportCategories.slice(0, 4).map(c => (
                                        <div key={c.category} className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-[#E7E9EA]">
                                            <span className="w-2 h-2 rounded-xl" style={{
                                                backgroundColor:
                                                    c.category === "SPAM" ? "#71767B" :
                                                        c.category === "HARASSMENT" ? "#FFD400" :
                                                            c.category === "HATE_SPEECH" ? "#F91880" : "#8247E5"
                                            }}></span>
                                            <span className="capitalize">{c.category.toLowerCase().replace('_', ' ')}</span> ({c.count})
                                        </div>
                                    )) : (
                                        <div className="text-[12px] text-slate-400">No reports found</div>
                                    )}
                                </div>
                            </div>
                            <div className="w-[140px] h-[140px] relative">
                                <ReactECharts option={reportCategoryOption} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                                {/* Center number */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[20px] font-bold text-slate-900 dark:text-[#E7E9EA]">{formatCompactNumber(stats?.kpis.activeReports ?? 0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. PLATFORM HEALTH SUMMARY */}
                <div className="bg-white dark:bg-[#16181C] border border-slate-200 dark:border-[#2F3336] rounded-[8px] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-[#2F3336] flex items-center justify-between bg-white dark:bg-[#16181C]">
                        <h3 className="text-[16px] font-bold text-slate-900 dark:text-[#E7E9EA]">Platform Health Check</h3>
                        <span className={cn(
                            "flex items-center gap-2 text-[12px] font-bold px-3 py-1 rounded-full border",
                            stats?.platformHealth.queueStatus === "HEALTHY"
                                ? "text-[#00BA7C] bg-[#00BA7C]/10 border-[#00BA7C]/20"
                                : stats?.platformHealth.queueStatus === "ELEVATED"
                                    ? "text-[#FFD400] bg-[#FFD400]/10 border-[#FFD400]/20"
                                    : "text-rose-500 bg-rose-500/10 border-rose-500/20"
                        )}>
                            {stats?.platformHealth.queueStatus === "HEALTHY" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {stats?.platformHealth.queueStatus === "HEALTHY" ? "All Systems Operational" : stats?.platformHealth.queueStatus === "ELEVATED" ? "System Load Elevated" : "Critical System Alert"}
                        </span>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-[#2F3336]">
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#1D9BF0]/10 text-[#1D9BF0] flex items-center justify-center border border-[#1D9BF0]/20"><Globe className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[14px] font-bold text-slate-900 dark:text-[#E7E9EA]">API Requests (24h)</p>
                                    <p className="text-[12px] text-slate-500 dark:text-[#71767B]">{formatCompactNumber(stats?.kpis.apiRequests24h ?? 0)} recorded logs</p>
                                </div>
                            </div>
                            <span className="text-[#00BA7C] font-mono text-[13px]">Live</span>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#8247E5]/10 text-[#8247E5] flex items-center justify-center border border-[#8247E5]/20"><Database className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[14px] font-bold text-slate-900 dark:text-[#E7E9EA]">Database Consistency</p>
                                    <p className="text-[12px] text-slate-500 dark:text-[#71767B]">Total Users: {formatCompactNumber(stats?.kpis.totalUsers ?? 0)}</p>
                                </div>
                            </div>
                            <span className="text-[#00BA7C] font-mono text-[13px]">Synced</span>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#FFD400]/10 text-[#FFD400] flex items-center justify-center border border-[#FFD400]/20"><ShieldAlert className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[14px] font-bold text-slate-900 dark:text-[#E7E9EA]">Moderation Queue</p>
                                    <p className="text-[12px] text-slate-500 dark:text-[#71767B]">Currently {stats?.platformHealth.queueSize ?? 0} items pending</p>
                                </div>
                            </div>
                            <span className={cn(
                                "font-mono text-[13px]",
                                stats?.platformHealth.queueStatus === "HEALTHY" ? "text-[#00BA7C]" : "text-[#FFD400]"
                            )}>
                                {stats?.platformHealth.queueStatus}
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            <DrilldownDrawer isOpen={!!drilldown} title={drilldown || ""} onClose={() => setDrilldown(null)} />
        </div>
    );
}
