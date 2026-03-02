"use client";

import React, { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
    Users,
    ShieldAlert,
    TrendingUp,
    TrendingDown,
    Clock,
    Globe,
    Download,
    ChevronDown,
    Filter,
    ArrowUpRight,
    Server,
    CheckCircle2,
    ShieldCheck,
    Database,
} from "lucide-react";

// === Types & KPI data (reuse AdminDashboard patterns) ===

type DateRange = "24h" | "7d" | "30d" | "90d";

const SUPER_ADMIN_KPIS = {
    totalActiveUsers: { value: "142.5M", change: "+4.2%", isPositive: true, icon: Users, colorClass: "text-[#1D9BF0]" },
    suspendedUsers: { value: "1.2M", change: "+3.1%", isPositive: false, icon: ShieldAlert, colorClass: "text-[#F97373]" },
    pendingReviews: { value: "84.7K", change: "+8.0%", isPositive: false, icon: Clock, colorClass: "text-[#F59E0B]" },
    highRiskPosts: { value: "12.4K", change: "+1.3%", isPositive: false, icon: ShieldAlert, colorClass: "text-[#EF4444]" },
    moderatorSLA: { value: "98.4%", change: "+0.4%", isPositive: true, icon: ShieldCheck, colorClass: "text-[#22C55E]" },
    securityAlerts: { value: "27", change: "+5 today", isPositive: false, icon: ShieldAlert, colorClass: "text-[#DC2626]" },
};

// === Reusable KPI card (copy from AdminDashboard, keep styling) ===

const KpiCard = ({ title, value, change, isPositive, icon: Icon, colorClass, onClick }: any) => (
    <button
        type="button"
        onClick={onClick}
        className="bg-[#16181C] p-5 rounded-xl border border-[#2F3336] shadow-sm hover:border-[#71767B]/50 transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
    >
        <div className="flex items-center justify-between mb-3 text-[#71767B]">
            <span className="font-semibold text-[13px] tracking-wide uppercase">{title}</span>
            <div className={`w-8 h-8 rounded-lg bg-[#000000] border border-[#2F3336] flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
        <div className="flex items-end justify-between">
            <h3 className="text-[28px] font-bold tracking-tight text-[#E7E9EA] leading-none">{value}</h3>
            <div
                className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-md bg-[#000000] border border-[#2F3336] ${
                    isPositive ? "text-[#00BA7C]" : "text-[#F91880]"
                }`}
            >
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change}
            </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path
                    d={isPositive ? "M0 20 L 20 15 L 40 18 L 60 10 L 80 12 L 100 0" : "M0 0 L 20 5 L 40 2 L 60 15 L 80 12 L 100 20"}
                    fill="none"
                    stroke="currentColor"
                    className={colorClass}
                    strokeWidth="3"
                    strokeLinecap="round"
                />
            </svg>
        </div>
    </button>
);

// === Shared chart config (copy of AdminDashboard commonChartConfig) ===

const commonChartConfig: any = {
    backgroundColor: "transparent",
    tooltip: {
        trigger: "axis",
        backgroundColor: "#16181C",
        borderColor: "#2F3336",
        textStyle: { color: "#E7E9EA", fontSize: 13, fontFamily: "inherit" },
        axisPointer: { type: "shadow" },
    },
    grid: { top: 30, right: 10, bottom: 20, left: 40, containLabel: false },
    xAxis: {
        type: "category",
        axisLine: { lineStyle: { color: "#2F3336" } },
        axisTick: { show: false },
        axisLabel: { color: "#71767B", fontSize: 11, fontFamily: "inherit", margin: 12 },
    },
    yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "#2F3336", type: "dashed" } },
        axisLabel: {
            color: "#71767B",
            fontSize: 11,
            fontFamily: "inherit",
            formatter: (value: number) => (value >= 1000 ? value / 1000 + "k" : value),
        },
    },
};

// === Specific chart configs (reuse patterns) ===

const reportsTrendConfig: any = {
    ...commonChartConfig,
    legend: { show: false },
    xAxis: { ...commonChartConfig.xAxis, data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    series: [
        {
            name: "User Reports",
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
                        { offset: 0, color: "rgba(29,155,240,0.25)" },
                        { offset: 1, color: "rgba(29,155,240,0)" },
                    ],
                },
            },
            data: [32000, 34000, 36000, 38000, 35000, 39000, 41000],
        },
        {
            name: "Auto Flags",
            type: "line",
            smooth: true,
            symbolSize: 6,
            itemStyle: { color: "#F97316" },
            lineStyle: { width: 3 },
            data: [8000, 9000, 9500, 12000, 11000, 13000, 12500],
        },
        {
            name: "Escalated Cases",
            type: "line",
            smooth: true,
            symbolSize: 6,
            itemStyle: { color: "#F97373" },
            lineStyle: { width: 3, type: "dashed" },
            data: [600, 750, 700, 820, 900, 880, 910],
        },
    ],
};

const riskDistributionConfig: any = {
    ...commonChartConfig,
    grid: { top: 30, right: 10, bottom: 20, left: 10, containLabel: true },
    xAxis: { ...commonChartConfig.xAxis, data: ["Low", "Medium", "High", "Critical"] },
    series: [
        {
            type: "bar",
            barWidth: "45%",
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            data: [
                { value: 65000, itemStyle: { color: "#1D9BF0" } },
                { value: 28000, itemStyle: { color: "#FBBF24" } },
                { value: 12000, itemStyle: { color: "#F97316" } },
                { value: 3500, itemStyle: { color: "#EF4444" } },
            ],
        },
    ],
};

const violationDonutConfig: any = {
    backgroundColor: "transparent",
    tooltip: {
        trigger: "item",
        backgroundColor: "#16181C",
        borderColor: "#2F3336",
        textStyle: { color: "#E7E9EA", fontSize: 13 },
    },
    legend: { show: false },
    series: [
        {
            name: "Violations",
            type: "pie",
            radius: ["55%", "80%"],
            avoidLabelOverlap: false,
            itemStyle: { borderColor: "#000000", borderWidth: 2 },
            label: { show: false },
            data: [
                { value: 40, name: "Spam", itemStyle: { color: "#71767B" } },
                { value: 25, name: "Harassment", itemStyle: { color: "#FBBF24" } },
                { value: 15, name: "Hate", itemStyle: { color: "#F97373" } },
                { value: 10, name: "NSFW", itemStyle: { color: "#A855F7" } },
                { value: 10, name: "Other", itemStyle: { color: "#1D9BF0" } },
            ],
        },
    ],
};

const activityHeatmapConfig: any = {
    backgroundColor: "transparent",
    tooltip: {
        position: "top",
        backgroundColor: "#16181C",
        borderColor: "#2F3336",
        textStyle: { color: "#E7E9EA", fontSize: 12 },
    },
    grid: { top: 30, left: 40, bottom: 30, right: 10 },
    xAxis: {
        type: "category",
        data: ["0h", "2h", "4h", "6h", "8h", "10h", "12h", "14h", "16h", "18h", "20h", "22h"],
        splitArea: { show: true },
        axisLabel: { color: "#71767B", fontSize: 10 },
    },
    yAxis: {
        type: "category",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        splitArea: { show: true },
        axisLabel: { color: "#71767B", fontSize: 10 },
    },
    visualMap: {
        min: 0,
        max: 200,
        calculable: false,
        show: false,
        inRange: { color: ["#0f172a", "#1D4ED8", "#F97373"] },
    },
    series: [
        {
            name: "Abuse Events",
            type: "heatmap",
            data: [], // fill in data from API
            label: { show: false },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: "rgba(0,0,0,0.5)",
                },
            },
        },
    ],
};

const moderatorPerformanceConfig: any = {
    ...commonChartConfig,
    xAxis: { type: "value", axisLine: { lineStyle: { color: "#2F3336" } } },
    yAxis: {
        type: "category",
        data: ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta"],
        axisLabel: { color: "#71767B", fontSize: 11 },
    },
    series: [
        {
            name: "Reviewed",
            type: "bar",
            stack: "total",
            itemStyle: { color: "#1D9BF0" },
            barWidth: 14,
            data: [4000, 3200, 2800, 3500],
        },
        {
            name: "Approved",
            type: "bar",
            stack: "total",
            itemStyle: { color: "#22C55E" },
            barWidth: 14,
            data: [3200, 2500, 2300, 3000],
        },
        {
            name: "Rejected",
            type: "bar",
            stack: "total",
            itemStyle: { color: "#F97373" },
            barWidth: 14,
            data: [400, 300, 240, 260],
        },
        {
            name: "Escalated",
            type: "bar",
            stack: "total",
            itemStyle: { color: "#A855F7" },
            barWidth: 14,
            data: [150, 120, 110, 130],
        },
    ],
};

const platformGrowthConfig: any = {
    ...commonChartConfig,
    legend: { show: false },
    xAxis: {
        ...commonChartConfig.xAxis,
        data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    },
    series: [
        {
            name: "Registered Users",
            type: "line",
            smooth: true,
            symbolSize: 4,
            itemStyle: { color: "#6366F1" },
            lineStyle: { width: 3 },
            areaStyle: {
                color: {
                    type: "linear",
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                        { offset: 0, color: "rgba(99,102,241,0.28)" },
                        { offset: 1, color: "rgba(15,23,42,0)" },
                    ],
                },
            },
            data: [80, 95, 110, 130, 150, 175, 190, 210, 230, 250, 270, 300],
        },
    ],
};

// === Main Super Admin dashboard ===

export default function SuperAdminDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>("24h");
    const [time, setTime] = useState("");

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] text-[#E7E9EA] h-screen font-display">
            {/* HEADER (reuse AdminDashboard header layout) */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-[#000000]/90 backdrop-blur-md z-20 shrink-0 flex flex-wrap items-center justify-between gap-4 sticky top-0">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#E7E9EA]">
                        Super Admin · Executive Overview
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#71767B] font-mono">
                        <span className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-[#22C55E] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                            </span>
                            LIVE PLATFORM
                        </span>
                        <span>•</span>
                        <span>{time}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-[#16181C] border border-[#2F3336] rounded-md p-1">
                        {(["24h", "7d", "30d", "90d"] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1 text-[12px] font-bold rounded-sm transition-colors ${
                                    dateRange === range
                                        ? "bg-[#333639] text-[#E7E9EA] shadow-sm"
                                        : "text-[#71767B] hover:text-[#E7E9EA]"
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-xl text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336]">
                        <Globe className="w-4 h-4 text-[#71767B]" /> Global
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#16181C] border border-[#1D9BF0]/30 rounded-xl text-[13px] font-bold text-[#1D9BF0] hover:bg-[#1D9BF0]/10">
                        <Filter className="w-4 h-4" /> Advanced Filter
                    </button>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#B91C1C] text-white rounded-xl text-[13px] font-bold hover:bg-[#DC2626]">
                        <ShieldAlert className="w-4 h-4" /> Security Center
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* KPI GRID (3x2 on desktop) */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KpiCard title="Total Active Users" {...SUPER_ADMIN_KPIS.totalActiveUsers} />
                    <KpiCard title="Suspended Users" {...SUPER_ADMIN_KPIS.suspendedUsers} />
                    <KpiCard title="Pending Reviews" {...SUPER_ADMIN_KPIS.pendingReviews} />
                    <KpiCard title="High Risk Posts" {...SUPER_ADMIN_KPIS.highRiskPosts} />
                    <KpiCard title="Moderator SLA" {...SUPER_ADMIN_KPIS.moderatorSLA} />
                    <KpiCard title="Security Alerts" {...SUPER_ADMIN_KPIS.securityAlerts} />
                </div>

                {/* Row 1: Reports trend + Risk distribution */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col min-h-[320px]">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-[16px] font-bold text-[#E7E9EA]">Reports Trend</h3>
                                <p className="text-[13px] text-[#71767B]">User reports, auto flags & escalations</p>
                            </div>
                            <div className="flex gap-3 text-[12px] text-[#E7E9EA]">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-sm bg-[#1D9BF0]" /> Reports
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-sm bg-[#F97316]" /> Auto Flags
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-sm bg-[#F97373]" /> Escalations
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ReactECharts option={reportsTrendConfig} style={{ height: "100%", width: "100%", position: "absolute" }} />
                        </div>
                    </div>

                    <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col min-h-[320px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[16px] font-bold text-[#E7E9EA]">Risk Distribution</h3>
                            <button className="text-[12px] text-[#71767B] hover:text-[#E7E9EA] flex items-center gap-1">
                                Export <Download className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ReactECharts option={riskDistributionConfig} style={{ height: "100%", width: "100%", position: "absolute" }} />
                        </div>
                    </div>
                </div>

                {/* Row 2: Violation donut + Activity heatmap */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex items-center justify-between min-h-[260px]">
                        <div className="flex-1">
                            <h3 className="text-[16px] font-bold text-[#E7E9EA] mb-4">Violation Categories</h3>
                            <div className="space-y-2.5 text-[12px] text-[#E7E9EA]">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-xl bg-[#71767B]" /> Spam
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-xl bg-[#FBBF24]" /> Harassment
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-xl bg-[#F97373]" /> Hate
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-xl bg-[#A855F7]" /> NSFW
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-xl bg-[#1D9BF0]" /> Other
                                </div>
                            </div>
                        </div>
                        <div className="w-[160px] h-[160px] relative">
                            <ReactECharts option={violationDonutConfig} style={{ height: "100%", width: "100%", position: "absolute" }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[12px] text-[#9CA3AF]">Total</span>
                                <span className="text-[20px] font-bold text-[#E7E9EA]">34k</span>
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col min-h-[260px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[16px] font-bold text-[#E7E9EA]">Abuse Activity Heatmap</h3>
                            <span className="text-[12px] text-[#71767B]">By hour × day (reports & rejections)</span>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ReactECharts option={activityHeatmapConfig} style={{ height: "100%", width: "100%", position: "absolute" }} />
                        </div>
                    </div>
                </div>

                {/* Row 3: Moderator performance (full width) */}
                <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col min-h-[280px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[16px] font-bold text-[#E7E9EA]">Moderator Performance</h3>
                        <button className="text-[12px] text-[#71767B] hover:text-[#E7E9EA] flex items-center gap-1">
                            View full report <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 w-full relative">
                        <ReactECharts option={moderatorPerformanceConfig} style={{ height: "100%", width: "100%", position: "absolute" }} />
                    </div>
                </div>

                {/* Row 4: Platform growth (full width) */}
                <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col min-h-[260px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-[16px] font-bold text-[#E7E9EA]">Platform Growth Trends</h3>
                        <span className="text-[12px] text-[#71767B]">Registered users by month</span>
                    </div>
                    <div className="flex-1 w-full relative">
                        <ReactECharts option={platformGrowthConfig} style={{ height: "100%", width: "100%", position: "absolute" }} />
                    </div>
                </div>

                {/* Keep Admin-style Platform Health summary at bottom for consistency */}
                <div className="bg-[#16181C] border border-[#2F3336] rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#16181C]">
                        <h3 className="text-[16px] font-bold text-[#E7E9EA]">Platform Health Check</h3>
                        <span className="flex items-center gap-2 text-[12px] font-bold text-[#00BA7C] bg-[#00BA7C]/10 px-3 py-1 rounded-full border border-[#00BA7C]/20">
                            <CheckCircle2 className="w-4 h-4" /> All Systems Operational
                        </span>
                    </div>
                    <div className="divide-y divide-[#2F3336]">
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#8247E5]/10 text-[#8247E5] flex items-center justify-center border border-[#8247E5]/20">
                                    <Server className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-[#E7E9EA]">Global API Edge Routing</p>
                                    <p className="text-[12px] text-[#71767B]">4.2B requests/hr • 12ms latency</p>
                                </div>
                            </div>
                            <span className="text-[#00BA7C] font-mono text-[13px]">Healthy</span>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#1D9BF0]/10 text-[#1D9BF0] flex items-center justify-center border border-[#1D9BF0]/20">
                                    <Database className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-[#E7E9EA]">Primary Distributed Datastore</p>
                                    <p className="text-[12px] text-[#71767B]">Replication lag: 0.1s • Load: 42%</p>
                                </div>
                            </div>
                            <span className="text-[#00BA7C] font-mono text-[13px]">Healthy</span>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#FFD400]/10 text-[#FFD400] flex items-center justify-center border border-[#FFD400]/20">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-bold text-[#E7E9EA]">Automated Content Moderation (ML)</p>
                                    <p className="text-[12px] text-[#71767B]">Processing Queue: 12k items • Avg: 2.1s</p>
                                </div>
                            </div>
                            <span className="text-[#FFD400] font-mono text-[13px]">Elevated Load</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

