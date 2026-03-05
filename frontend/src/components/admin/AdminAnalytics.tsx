"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Users, Zap, Activity, ShieldAlert,
    TrendingUp, TrendingDown, Clock, Globe, Download,
    ChevronDown, Filter, X, ArrowUpRight, BarChart3, Database,
    MoreHorizontal, Server
} from "lucide-react";
import { trpc } from "@/lib/trpc";

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

const KpiCard = ({ title, value, change, isPositive, icon: Icon, colorClass, onClick }: any) => (
    <div
        onClick={onClick}
        className="bg-[#16181C] p-5 rounded-xl border border-[#2F3336] shadow-sm hover:border-[#71767B]/50 transition-all cursor-pointer group relative overflow-hidden"
    >
        <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-xl bg-[#000000] border border-[#2F3336] flex items-center justify-center ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className={`flex items-center gap-1 text-[13px] font-bold px-2 py-1 rounded-md bg-[#000000] border border-[#2F3336] ${isPositive ? 'text-[#00BA7C]' : 'text-[#F91880]'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change}
            </div>
        </div>
        <p className="text-[#71767B] text-[14px] font-medium mb-1">{title}</p>
        <p className="text-[26px] font-bold tracking-tight text-[#E7E9EA]">{value}</p>

        {/* Fake mini sparkline */}
        <div className="absolute bottom-0 left-0 right-0 h-8 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path d={isPositive ? "M0 20 L 20 15 L 40 18 L 60 10 L 80 12 L 100 0" : "M0 0 L 20 5 L 40 2 L 60 15 L 80 12 L 100 20"}
                    fill="none" stroke="currentColor" className={colorClass} strokeWidth="2" strokeLinecap="round" />
            </svg>
        </div>
    </div>
);

// ==========================================
// 3. DRILLDOWN DRAWER
// ==========================================

const AnalyticsDrawer = ({ isOpen, onClose, title }: { isOpen: boolean, onClose: () => void, title: string }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose}></div>
            <div className="w-full max-w-[600px] bg-black border-l border-[#2F3336] h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
                <div className="px-6 py-5 border-b border-[#2F3336] flex items-center justify-between shrink-0 bg-[#000000]">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#E7E9EA] flex items-center gap-2">
                            Drilldown Mode
                        </h2>
                        <p className="text-[13px] text-[#71767B]">{title} metrics exploration</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-md text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={onClose} className="p-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full transition-colors ml-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="h-[300px] bg-[#16181C] border border-[#2F3336] rounded-xl flex items-center justify-center relative overflow-hidden">
                        {/* Placeholder Detailed Chart */}
                        <div className="absolute inset-x-0 bottom-0 top-[20%] opacity-50">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 200">
                                <path d="M0 160 Q 50 150, 100 130 T 200 110 T 300 80 T 400 40 T 500 20" fill="none" stroke="#1D9BF0" strokeLinecap="round" strokeWidth="4" />
                                <path d="M0 200 L 0 160 Q 50 150, 100 130 T 200 110 T 300 80 T 400 40 T 500 20 L 500 200 Z" fill="url(#blue-gradient)" />
                                <defs>
                                    <linearGradient id="blue-gradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="#1D9BF0" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#1D9BF0" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <div className="z-10 text-center">
                            <BarChart3 className="w-8 h-8 text-[#71767B] mx-auto mb-2" />
                            <p className="text-[#E7E9EA] font-semibold text-[15px]">Detailed Timeseries Data</p>
                            <p className="text-[#71767B] text-[13px]">Zoom and pan capabilities available</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[14px] font-bold text-[#E7E9EA] mb-4">Raw Data Segment</h4>
                        <div className="border border-[#2F3336] rounded-xl overflow-hidden bg-[#16181C]">
                            <table className="w-full text-[13px] text-left">
                                <thead className="bg-[#000000] border-b border-[#2F3336] text-[#71767B]">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Timestamp (UTC)</th>
                                        <th className="px-4 py-3 font-medium text-right">Volume</th>
                                        <th className="px-4 py-3 font-medium text-right">Delta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2F3336] text-[#E7E9EA]">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <tr key={i} className="hover:bg-[#000000]/50">
                                            <td className="px-4 py-3 font-mono text-[#71767B]">2026-02-27 12:0{i}:00</td>
                                            <td className="px-4 py-3 text-right">14,{i}02</td>
                                            <td className="px-4 py-3 text-right text-[#00BA7C]">+1.2%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN DASHBOARD PAGE
// ==========================================

export default function AnalyticsDashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange>("24h");
    const [drilldown, setDrilldown] = useState<string | null>(null);

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
              platformHealth: { queueSize: number; queueStatus: "HEALTHY" | "ELEVATED" | "CRITICAL" };
              byRegion: Array<{ region: unknown; count: number }>;
          }
        | undefined;

    const kpiData = useMemo(() => {
        if (!stats) {
            return {
                totalUsers: { value: "34,204,192", change: "+12.4%", isPositive: true },
                dau: { value: "14,832,041", change: "+5.2%", isPositive: true },
                reports: { value: "42,105", change: "-2.1%", isPositive: true },
                sla: { value: "98.4%", change: "-0.5%", isPositive: false },
                api: { value: "4.2B", change: "+15.2%", isPositive: true },
                uptime: { value: "99.99%", change: "0.00%", isPositive: true },
            };
        }

        const { kpis } = stats;
        return {
            totalUsers: {
                value: kpis.totalUsers.toLocaleString("en-US"),
                change: "+0.0%",
                isPositive: true,
            },
            dau: {
                value: kpis.dau.toLocaleString("en-US"),
                change: "+0.0%",
                isPositive: true,
            },
            reports: {
                value: kpis.activeReports.toLocaleString("en-US"),
                change: "-0.0%",
                isPositive: true,
            },
            sla: {
                value: formatPercent(kpis.slaCompliance),
                change: "+0.0%",
                isPositive: kpis.slaCompliance >= 95,
            },
            api: {
                value: formatCompact(kpis.apiRequests24h),
                change: "+0.0%",
                isPositive: true,
            },
            uptime: {
                value: formatPercent(kpis.uptimePercent, 2),
                change: "0.00%",
                isPositive: true,
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

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] text-[#E7E9EA] h-[100vh] font-display">
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Minimal strict scrollbar for FAANG density */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2F3336; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #71767B; }
                `
            }} />

            {/* TOP HEADER: Filters & Context */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-[#000000]/90 backdrop-blur-md z-10 shrink-0 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#E7E9EA] flex items-center gap-2">
                        Platform Telemetry & Analytics
                    </h1>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#71767B] font-mono">
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
                    <div className="flex bg-[#16181C] border border-[#2F3336] rounded-md p-1">
                        {(["24h", "7d", "30d", "90d"] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1 text-[12px] font-bold rounded-sm transition-colors ${dateRange === range
                                    ? "bg-[#333639] text-[#E7E9EA] shadow-sm"
                                    : "text-[#71767B] hover:text-[#E7E9EA]"
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-md text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors">
                        <Globe className="w-4 h-4 text-[#71767B]" /> Global <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>

                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-md text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors">
                        <Filter className="w-4 h-4 text-[#71767B]" /> Advanced Filters
                    </button>
                </div>
            </div>

            {/* MAIN DASHBOARD CANVAS */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. EXECUTIVE KPI GRID (6 cols) */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KpiCard
                        title="Total Users"
                        value={kpiData.totalUsers.value}
                        change={kpiData.totalUsers.change}
                        isPositive={kpiData.totalUsers.isPositive}
                        icon={Users}
                        colorClass="text-[#1D9BF0]"
                        onClick={() => setDrilldown("Total Users")}
                    />
                    <KpiCard
                        title="Daily Active"
                        value={kpiData.dau.value}
                        change={kpiData.dau.change}
                        isPositive={kpiData.dau.isPositive}
                        icon={Activity}
                        colorClass="text-[#00BA7C]"
                        onClick={() => setDrilldown("Daily Active Users")}
                    />
                    <KpiCard
                        title="API Requests"
                        value={kpiData.api.value}
                        change={kpiData.api.change}
                        isPositive={kpiData.api.isPositive}
                        icon={Server}
                        colorClass="text-[#8247E5]"
                        onClick={() => setDrilldown("API Requests Volume")}
                    />
                    <KpiCard
                        title="Active Reports"
                        value={kpiData.reports.value}
                        change={kpiData.reports.change}
                        isPositive={kpiData.reports.isPositive}
                        icon={ShieldAlert}
                        colorClass="text-[#FFD400]"
                        onClick={() => setDrilldown("Active Incident Reports")}
                    />
                    <KpiCard
                        title="Mod SLA Met"
                        value={kpiData.sla.value}
                        change={kpiData.sla.change}
                        isPositive={kpiData.sla.isPositive}
                        icon={Clock}
                        colorClass="text-[#F91880]"
                        onClick={() => setDrilldown("Moderation SLA Compliance")}
                    />
                    <KpiCard
                        title="System Uptime"
                        value={kpiData.uptime.value}
                        change={kpiData.uptime.change}
                        isPositive={kpiData.uptime.isPositive}
                        icon={Database}
                        colorClass="text-[#00BA7C]"
                        onClick={() => setDrilldown("Platform Uptime Tracking")}
                    />
                </div>

                {/* 2. CORE ANALYTICS BANDS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Primary Large Chart: DAU/MAU Trend */}
                    <div className="lg:col-span-2 bg-[#16181C] border border-[#2F3336] rounded-2xl p-5 shadow-sm flex flex-col h-[380px]">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <div>
                                <h3 className="text-[16px] font-bold text-[#E7E9EA]">Active Audience Growth</h3>
                                <p className="text-[13px] text-[#71767B]">Unique authenticated sessions across web and mobile.</p>
                            </div>
                            <div className="flex gap-4 items-center">
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#71767B]">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#1D9BF0]"></span> DAU
                                </div>
                                <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#71767B]">
                                    <span className="w-2.5 h-2.5 rounded-sm bg-[#8247E5]"></span> MAU
                                </div>
                                <button className="p-1 hover:bg-[#2F3336] rounded text-[#71767B] transition-colors" onClick={() => setDrilldown("Audience Growth")}>
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative w-full pt-4">
                            {/* Y-Axis scale marks */}
                            <div className="absolute inset-y-4 left-0 w-8 flex flex-col justify-between text-[11px] font-mono text-[#71767B] pb-6">
                                <span>20M</span><span>15M</span><span>10M</span><span>5M</span>
                            </div>
                            {/* Chart Area */}
                            <div className="absolute inset-y-0 left-10 right-0 border-b border-l border-[#2F3336]">
                                {/* Horizontal grid lines */}
                                <div className="absolute inset-x-0 top-0 h-[1px] bg-[#2F3336]/30"></div>
                                <div className="absolute inset-x-0 top-1/3 h-[1px] bg-[#2F3336]/30"></div>
                                <div className="absolute inset-x-0 top-2/3 h-[1px] bg-[#2F3336]/30"></div>

                                <svg className="w-full h-full pb-6" preserveAspectRatio="none" viewBox="0 0 1000 300">
                                    <path d="M0 250 L 100 240 L 200 200 L 300 180 L 400 150 L 500 160 L 600 120 L 700 90 L 800 100 L 900 80 L 1000 40" fill="none" stroke="#1D9BF0" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M0 180 L 100 170 L 200 150 L 300 140 L 400 130 L 500 120 L 600 100 L 700 80 L 800 60 L 900 50 L 1000 20" fill="none" stroke="#8247E5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

                                    {/* Data point glow effect */}
                                    <circle cx="1000" cy="40" r="5" fill="#1D9BF0" className="animate-pulse" />
                                    <circle cx="1000" cy="20" r="5" fill="#8247E5" className="animate-pulse" />
                                </svg>

                                {/* X-Axis marks */}
                                <div className="absolute bottom-0 inset-x-0 h-6 flex justify-between items-end text-[11px] font-mono text-[#71767B] px-2">
                                    <span>Feb 20</span><span>Feb 22</span><span>Feb 24</span><span>Feb 26</span><span>Today</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stack: Geo & Moderation */}
                    <div className="space-y-6">
                        {/* Geographic Density Mini-widget */}
                        <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-5 shadow-sm h-[178px] flex flex-col cursor-pointer hover:border-[#71767B]/50 transition-colors" onClick={() => setDrilldown("Regional Infrastructure")}>
                            <h3 className="text-[14px] font-bold text-[#E7E9EA] mb-4 flex justify-between items-center">
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
                                            <div className="flex justify-between text-[12px] font-bold text-[#E7E9EA] mb-1.5">
                                                <span>{row.name}</span>
                                                <span>{row.percent}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-[#000000] rounded-full overflow-hidden">
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
                        <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-5 shadow-sm h-[178px] flex flex-col cursor-pointer hover:border-[#71767B]/50 transition-colors" onClick={() => setDrilldown("Moderation Pipeline")}>
                            <h3 className="text-[14px] font-bold text-[#E7E9EA] mb-4 flex justify-between items-center">
                                Moderation Load
                                <span className="text-[11px] px-2 py-0.5 bg-[#F91880]/10 text-[#F91880] rounded border border-[#F91880]/20 font-bold">
                                    {stats?.platformHealth.queueStatus ?? "HEALTHY"}
                                </span>
                            </h3>
                            <div className="flex gap-4 items-end flex-1 pb-2">
                                {/* Fake bar chart */}
                                {[40, 60, 45, 80, 50, 95, 85].map((height, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end group">
                                        <div className="text-transparent group-hover:text-[#E7E9EA] text-[10px] text-center mb-1 transition-colors font-mono">{height}k</div>
                                        <div
                                            className={`w-full rounded-t-sm transition-all duration-300 ${height > 80 ? 'bg-[#F91880]' : 'bg-[#FFD400]'}`}
                                            style={{ height: `${height}%` }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. PLATFORM HEALTH TABLE (Virtualized Concept) */}
                <div className="bg-[#16181C] border border-[#2F3336] rounded-xl shadow-sm overflow-hidden flex flex-col lg:hidden xl:flex">
                    <div className="px-5 py-4 border-b border-[#2F3336] flex items-center justify-between">
                        <h3 className="text-[16px] font-bold text-[#E7E9EA]">Real-Time Anomalies & Events</h3>
                        <button className="text-[12px] font-bold text-[#1D9BF0] hover:text-white transition-colors">View All Logs</button>
                    </div>
                    <table className="w-full text-left text-[13px]">
                        <thead className="bg-[#000000]/50 text-[#71767B] font-bold text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="px-5 py-3">Event ID</th>
                                <th className="px-5 py-3">Severity</th>
                                <th className="px-5 py-3">System / Node</th>
                                <th className="px-5 py-3">Description</th>
                                <th className="px-5 py-3 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2F3336]">
                            <tr className="hover:bg-[#000000]">
                                <td className="px-5 py-4 font-mono text-[#71767B]">EVT-88192</td>
                                <td className="px-5 py-4"><span className="px-2 py-1 bg-[#F91880]/10 text-[#F91880] text-[11px] font-bold rounded">Critical</span></td>
                                <td className="px-5 py-4 font-mono text-[#E7E9EA]">auth-api-router-us-east</td>
                                <td className="px-5 py-4 text-[#E7E9EA]">Spike in rate-limit 429 errors from single IP block</td>
                                <td className="px-5 py-4 text-right font-mono text-[#71767B]">{time}</td>
                            </tr>
                            <tr className="hover:bg-[#000000]">
                                <td className="px-5 py-4 font-mono text-[#71767B]">EVT-88191</td>
                                <td className="px-5 py-4"><span className="px-2 py-1 bg-[#FFD400]/10 text-[#FFD400] text-[11px] font-bold rounded">Warning</span></td>
                                <td className="px-5 py-4 font-mono text-[#E7E9EA]">media-cdn-cache-eu</td>
                                <td className="px-5 py-4 text-[#E7E9EA]">Cache hit ratio degraded below 85% SLA</td>
                                <td className="px-5 py-4 text-right font-mono text-[#71767B]">2m ago</td>
                            </tr>
                            <tr className="hover:bg-[#000000]">
                                <td className="px-5 py-4 font-mono text-[#71767B]">EVT-88190</td>
                                <td className="px-5 py-4"><span className="px-2 py-1 bg-[#2F3336] text-[#71767B] text-[11px] font-bold rounded">Info</span></td>
                                <td className="px-5 py-4 font-mono text-[#E7E9EA]">mod-auto-ml-worker</td>
                                <td className="px-5 py-4 text-[#E7E9EA]">Successfully processed batch queue of 50k reports</td>
                                <td className="px-5 py-4 text-right font-mono text-[#71767B]">5m ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Drilldown Slide-over Component */}
            <AnalyticsDrawer isOpen={!!drilldown} title={drilldown || ""} onClose={() => setDrilldown(null)} />

        </div >
    );
}

const MapPinIcon = () => (
    <svg className="w-4 h-4 text-[#71767B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
