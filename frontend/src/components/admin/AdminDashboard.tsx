"use client";

import React, { useState, useEffect, useMemo } from "react";
import ReactECharts from 'echarts-for-react';
import {
    Users, Activity, ShieldAlert,
    TrendingUp, TrendingDown, Clock, Globe, Download,
    ChevronDown, Filter, X, ArrowUpRight, Server,
    AlertCircle, CheckCircle2, ShieldCheck, Database
} from "lucide-react";

// ==========================================
// 1. TYPES & CONSTANTS
// ==========================================

type DateRange = "24h" | "7d" | "30d" | "90d";

const KPI_DATA = {
    totalUsers: { value: "142.5M", change: "+4.2%", isPositive: true },
    dau: { value: "48.2M", change: "+1.8%", isPositive: true },
    mau: { value: "98.4M", change: "+2.4%", isPositive: true },
    signups: { value: "125.4K", change: "+8.1%", isPositive: true },
    reports: { value: "34,210", change: "-5.2%", isPositive: true },
    sla: { value: "99.8%", change: "+0.2%", isPositive: true },
    api: { value: "4.2B", change: "+12.4%", isPositive: true },
    uptime: { value: "99.99%", change: "0.00%", isPositive: true }
};

// ==========================================
// 2. REUSABLE COMPONENTS
// ==========================================

const KpiCard = ({ title, value, change, isPositive, icon: Icon, colorClass, onClick }: any) => (
    <div
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
            <div className={`flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-md bg-[#000000] border border-[#2F3336] ${isPositive ? 'text-[#00BA7C]' : 'text-[#F91880]'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {change}
            </div>
        </div>
        {/* Decorative subtle background sparkline effect */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-[600px] bg-black border-l border-[#2F3336] h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">
                <div className="px-6 py-5 border-b border-[#2F3336] flex items-center justify-between shrink-0 bg-[#000000]">
                    <div>
                        <h2 className="text-[18px] font-bold text-[#E7E9EA]">Drilldown: {title}</h2>
                        <p className="text-[13px] text-[#71767B]">Detailed historical data preview</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-md text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336]">
                            <Download className="w-4 h-4" /> Export CSV
                        </button>
                        <button onClick={onClose} className="p-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full ml-2">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center text-[#71767B]">
                    <Database className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-[15px] font-bold text-[#E7E9EA]">Comprehensive Data Logs</p>
                    <p className="text-[13px]">Raw timeseries data for {title} would populate here.</p>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 3. ECHARTS CONFIGURATIONS
// ==========================================

const commonChartConfig = {
    backgroundColor: 'transparent',
    tooltip: {
        trigger: 'axis',
        backgroundColor: '#16181C',
        borderColor: '#2F3336',
        textStyle: { color: '#E7E9EA', fontSize: 13, fontFamily: 'inherit' },
        axisPointer: { type: 'shadow' }
    },
    grid: { top: 30, right: 10, bottom: 20, left: 40, containLabel: false },
    xAxis: {
        type: 'category',
        axisLine: { lineStyle: { color: '#2F3336' } },
        axisTick: { show: false },
        axisLabel: { color: '#71767B', fontSize: 11, fontFamily: 'inherit', margin: 12 },
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#2F3336', type: 'dashed' } },
        axisLabel: { color: '#71767B', fontSize: 11, fontFamily: 'inherit', formatter: (value: number) => value >= 1000 ? (value / 1000) + 'k' : value }
    }
};

const dauMauConfig = {
    ...commonChartConfig,
    title: { show: false },
    legend: { show: false }, // Handled by custom UI
    xAxis: { ...commonChartConfig.xAxis, data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    series: [
        {
            name: 'DAU', type: 'line', smooth: true, symbolSize: 6,
            itemStyle: { color: '#1D9BF0' }, lineStyle: { width: 3 },
            areaStyle: {
                color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(29, 155, 240, 0.2)' }, { offset: 1, color: 'rgba(29, 155, 240, 0)' }] }
            },
            data: [42000, 45000, 48200, 47000, 52000, 58000, 56000]
        },
        {
            name: 'MAU', type: 'line', smooth: true, symbolSize: 6,
            itemStyle: { color: '#8247E5' }, lineStyle: { width: 3 },
            data: [96000, 96500, 97000, 97500, 98000, 98400, 98400]
        }
    ]
};

const engagementBarConfig = {
    ...commonChartConfig,
    grid: { top: 30, right: 10, bottom: 20, left: 10, containLabel: true },
    xAxis: { ...commonChartConfig.xAxis, data: ['Likes', 'Comments', 'Shares', 'Saves'] },
    series: [{
        type: 'bar', barWidth: '40%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        data: [
            { value: 85000, itemStyle: { color: '#F91880' } },
            { value: 42000, itemStyle: { color: '#1D9BF0' } },
            { value: 18000, itemStyle: { color: '#00BA7C' } },
            { value: 12000, itemStyle: { color: '#FFD400' } }
        ]
    }]
};

const reportsDonutConfig = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#16181C', borderColor: '#2F3336', textStyle: { color: '#E7E9EA', fontSize: 13 } },
    legend: { show: false },
    series: [{
        name: 'Reports',
        type: 'pie',
        radius: ['55%', '85%'],
        avoidLabelOverlap: false,
        itemStyle: { borderColor: '#000000', borderWidth: 2 },
        label: { show: false },
        data: [
            { value: 45, name: 'Spam', itemStyle: { color: '#71767B' } },
            { value: 30, name: 'Harassment', itemStyle: { color: '#FFD400' } },
            { value: 15, name: 'Hate Speech', itemStyle: { color: '#F91880' } },
            { value: 10, name: 'NSFW', itemStyle: { color: '#8247E5' } }
        ]
    }]
};

// ==========================================
// 4. MAIN PAGE
// ==========================================

export default function AdminDashboardPage() {
    const [dateRange, setDateRange] = useState<DateRange>("24h");
    const [drilldown, setDrilldown] = useState<string | null>(null);
    const [time, setTime] = useState("");

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] text-[#E7E9EA] h-[100vh] font-display">

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-[#000000]/90 backdrop-blur-md z-20 shrink-0 flex flex-wrap items-center justify-between gap-4 sticky top-0">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#E7E9EA]">Executive Dashboard</h1>
                    <div className="flex items-center gap-3 mt-1 text-[12px] text-[#71767B] font-mono">
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
                    <div className="flex bg-[#16181C] border border-[#2F3336] rounded-md p-1">
                        {(["24h", "7d", "30d", "90d"] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1 text-[12px] font-bold rounded-sm transition-colors ${dateRange === range ? "bg-[#333639] text-[#E7E9EA] shadow-sm" : "text-[#71767B] hover:text-[#E7E9EA]"}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-xl text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336]">
                        <Globe className="w-4 h-4 text-[#71767B]" /> Global <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </button>
                    <button className="flex items-center gap-2 px-3.5 py-1.5 bg-[#16181C] border border-[#2F3336] rounded-xl text-[13px] font-bold text-[#1D9BF0] border-[#1D9BF0]/30 hover:bg-[#1D9BF0]/10">
                        <Filter className="w-4 h-4" /> Advanced Filter
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* 1. EXECUTIVE KPIs (8 cards) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                    <KpiCard title="Total Users" value={KPI_DATA.totalUsers.value} change={KPI_DATA.totalUsers.change} isPositive={true} icon={Users} colorClass="text-[#1D9BF0]" onClick={() => setDrilldown("Total Users")} />
                    <KpiCard title="Monthly Active (MAU)" value={KPI_DATA.mau.value} change={KPI_DATA.mau.change} isPositive={true} icon={Activity} colorClass="text-[#8247E5]" onClick={() => setDrilldown("MAU")} />
                    <KpiCard title="Daily Active (DAU)" value={KPI_DATA.dau.value} change={KPI_DATA.dau.change} isPositive={true} icon={Activity} colorClass="text-[#1D9BF0]" onClick={() => setDrilldown("DAU")} />
                    <KpiCard title="New Signups" value={KPI_DATA.signups.value} change={KPI_DATA.signups.change} isPositive={true} icon={Users} colorClass="text-[#00BA7C]" onClick={() => setDrilldown("Signups")} />
                    <KpiCard title="Active Reports" value={KPI_DATA.reports.value} change={KPI_DATA.reports.change} isPositive={true} icon={ShieldAlert} colorClass="text-[#FFD400]" onClick={() => setDrilldown("Reports")} />
                    <KpiCard title="Mod SLA Compliance" value={KPI_DATA.sla.value} change={KPI_DATA.sla.change} isPositive={true} icon={ShieldCheck} colorClass="text-[#00BA7C]" onClick={() => setDrilldown("SLA Compliance")} />
                    <KpiCard title="API Requests" value={KPI_DATA.api.value} change={KPI_DATA.api.change} isPositive={true} icon={Server} colorClass="text-[#71767B]" onClick={() => setDrilldown("API Requests")} />
                    <KpiCard title="System Uptime" value={KPI_DATA.uptime.value} change={KPI_DATA.uptime.change} isPositive={true} icon={CheckCircle2} colorClass="text-[#00BA7C]" onClick={() => setDrilldown("Uptime")} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* 2. USER GROWTH SECTION */}
                    <div className="xl:col-span-2 bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-[18px] font-bold text-[#E7E9EA]">Audience Growth</h3>
                                <p className="text-[13px] text-[#71767B]">DAU vs MAU trends</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-[#E7E9EA]"><span className="w-2.5 h-2.5 rounded-sm bg-[#1D9BF0]"></span> DAU</div>
                                <div className="flex items-center gap-2 text-[12px] font-bold text-[#E7E9EA]"><span className="w-2.5 h-2.5 rounded-sm bg-[#8247E5]"></span> MAU</div>
                                <button className="ml-2 text-[#71767B] hover:text-[#E7E9EA]" onClick={() => setDrilldown("Growth")}><ArrowUpRight className="w-5 h-5" /></button>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ReactECharts option={dauMauConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* 3. ENGAGEMENT DISTRIBUTION */}
                        <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col flex-1 min-h-[220px]">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[16px] font-bold text-[#E7E9EA]">Engagement Distribution</h3>
                                <button className="text-[#71767B] hover:text-[#E7E9EA]" onClick={() => setDrilldown("Engagement")}><ArrowUpRight className="w-4 h-4" /></button>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ReactECharts option={engagementBarConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                            </div>
                        </div>

                        {/* 4. MODERATION CATEGORIES */}
                        <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex items-center justify-between min-h-[160px]">
                            <div className="flex-1">
                                <h3 className="text-[16px] font-bold text-[#E7E9EA] mb-4">Report Categories</h3>
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-2 text-[12px] text-[#E7E9EA]"><span className="w-2 h-2 rounded-xl bg-[#71767B]"></span> Spam (45%)</div>
                                    <div className="flex items-center gap-2 text-[12px] text-[#E7E9EA]"><span className="w-2 h-2 rounded-xl bg-[#FFD400]"></span> Harassment (30%)</div>
                                    <div className="flex items-center gap-2 text-[12px] text-[#E7E9EA]"><span className="w-2 h-2 rounded-xl bg-[#F91880]"></span> Hate Speech (15%)</div>
                                    <div className="flex items-center gap-2 text-[12px] text-[#E7E9EA]"><span className="w-2 h-2 rounded-xl bg-[#8247E5]"></span> NSFW (10%)</div>
                                </div>
                            </div>
                            <div className="w-[140px] h-[140px] relative">
                                <ReactECharts option={reportsDonutConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                                {/* Center number */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-[20px] font-bold text-[#E7E9EA]">34k</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. PLATFORM HEALTH SUMMARY */}
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
                                <div className="w-10 h-10 rounded-xl bg-[#8247E5]/10 text-[#8247E5] flex items-center justify-center border border-[#8247E5]/20"><Server className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[14px] font-bold text-[#E7E9EA]">Global API Edge Routing</p>
                                    <p className="text-[12px] text-[#71767B]">4.2B requests/hr • 12ms latency</p>
                                </div>
                            </div>
                            <span className="text-[#00BA7C] font-mono text-[13px]">Healthy</span>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#1D9BF0]/10 text-[#1D9BF0] flex items-center justify-center border border-[#1D9BF0]/20"><Database className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-[14px] font-bold text-[#E7E9EA]">Primary Distributed Datastore</p>
                                    <p className="text-[12px] text-[#71767B]">Replication lag: 0.1s • Load: 42%</p>
                                </div>
                            </div>
                            <span className="text-[#00BA7C] font-mono text-[13px]">Healthy</span>
                        </div>
                        <div className="px-6 py-4 flex items-center justify-between hover:bg-[#000000]/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[#FFD400]/10 text-[#FFD400] flex items-center justify-center border border-[#FFD400]/20"><ShieldAlert className="w-5 h-5" /></div>
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

            <DrilldownDrawer isOpen={!!drilldown} title={drilldown || ""} onClose={() => setDrilldown(null)} />
        </div>
    );
}
