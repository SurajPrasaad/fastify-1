"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactECharts from 'echarts-for-react';
import {
    Activity, Server, Database, Globe, AlertTriangle, ShieldAlert,
    Clock, Cpu, HardDrive, Network, Play, Pause, Download,
    Search, Filter, X, ChevronRight, Terminal, Zap, CheckCircle
} from "lucide-react";

// ==========================================
// 1. MOCK DATA & THEME CONSTANTS
// ==========================================

const THEME = {
    bg: "#0F172A", // slate-900
    panel: "#1E293B", // slate-800
    border: "#334155", // slate-700
    text: "#F8FAFC", // slate-50
    muted: "#94A3B8", // slate-400
    accent: "#06B6D4", // cyan-500
    success: "#22C55E", // green-500
    warning: "#F59E0B", // amber-500
    critical: "#EF4444", // red-500
};

const MOCK_LOGS = [
    { id: 1, level: "INFO", source: "auth-service", msg: "User token refreshed successfully", time: "10:42:01.123 Z" },
    { id: 2, level: "WARN", source: "media-cdn", msg: "High latency detected on eu-central cache node", time: "10:42:01.442 Z" },
    { id: 3, level: "ERROR", source: "db-cluster-primary", msg: "Connection pool limit reached (max: 5000)", time: "10:42:01.890 Z" },
    { id: 4, level: "INFO", source: "mod-auto-ml", msg: "Batch processing completed. Processed: 1024", time: "10:42:02.001 Z" },
    { id: 5, level: "CRITICAL", source: "payment-gateway", msg: "Upstream provider timeout (Stripe API)", time: "10:42:02.105 Z" },
];

const MOCK_ALERTS = [
    { id: "ALT-901", severity: "critical", service: "payment-gateway", threshold: "Timeout > 5s", time: "2m ago" },
    { id: "ALT-902", severity: "high", service: "db-cluster-primary", threshold: "Conn > 95%", time: "5m ago" },
    { id: "ALT-903", severity: "medium", service: "media-cdn", threshold: "Latency > 500ms", time: "12m ago" },
];

const SERVICES = [
    { name: "api-gateway", status: "degraded", uptime: "99.98%", cpu: "82%", mem: "4.2GB", pods: 12 },
    { name: "auth-service", status: "healthy", uptime: "100%", cpu: "45%", mem: "2.1GB", pods: 8 },
    { name: "user-timeline", status: "healthy", uptime: "99.99%", cpu: "60%", mem: "8.4GB", pods: 24 },
    { name: "notification-worker", status: "healthy", uptime: "100%", cpu: "30%", mem: "1.2GB", pods: 4 },
];

// ==========================================
// 2. REUSABLE UI COMPONENTS
// ==========================================

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'healthy': return <span className="flex items-center gap-1.5 text-[#22C55E] text-[12px] font-bold"><span className="w-2 h-2 rounded-full bg-[#22C55E]"></span> Healthy</span>;
        case 'degraded': return <span className="flex items-center gap-1.5 text-[#F59E0B] text-[12px] font-bold"><span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></span> Degraded</span>;
        case 'critical': return <span className="flex items-center gap-1.5 text-[#EF4444] text-[12px] font-bold"><span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse"></span> Critical</span>;
        default: return null;
    }
};

const LiveMetricCard = ({ title, value, unit, status = "neutral", trend }: any) => {
    const color = status === "good" ? THEME.success : status === "warning" ? THEME.warning : status === "critical" ? THEME.critical : THEME.text;
    return (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group">
            <p className="text-[#94A3B8] text-[12px] font-bold uppercase tracking-wider mb-2">{title}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-[24px] font-bold font-mono tracking-tight" style={{ color }}>{value}</span>
                {unit && <span className="text-[#94A3B8] text-[12px] font-bold">{unit}</span>}
            </div>
            {trend && <p className="text-[#94A3B8] text-[11px] mt-1 font-mono">{trend}</p>}
        </div>
    );
};

// ==========================================
// 3. ECHARTS CONFIGURATIONS
// ==========================================

const baseChartConfig = {
    backgroundColor: 'transparent',
    grid: { top: 30, right: 15, bottom: 20, left: 45, containLabel: false },
    tooltip: {
        trigger: 'axis',
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        textStyle: { color: '#F8FAFC', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
        axisPointer: { type: 'line', lineStyle: { color: '#334155', type: 'dashed' } }
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#334155' } },
        axisTick: { show: false },
        axisLabel: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace', margin: 10 },
        data: ['10:40', '10:41', '10:42', '10:43', '10:44', '10:45', '10:46'] // Mock times
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.5 } },
        axisLabel: { color: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }
    }
};

const rpsChartConfig = {
    ...baseChartConfig,
    yAxis: { ...baseChartConfig.yAxis, name: 'req/s', nameTextStyle: { color: '#94A3B8', fontSize: 10, padding: [0, 20, 0, 0] } },
    series: [{
        name: 'RPS', type: 'line', smooth: true, symbol: 'none',
        lineStyle: { color: THEME.accent, width: 2 },
        areaStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6, 182, 212, 0.3)' }, { offset: 1, color: 'rgba(6, 182, 212, 0)' }] }
        },
        data: [12040, 15300, 18200, 14500, 22100, 28000, 24500]
    }]
};

const latencyChartConfig = {
    ...baseChartConfig,
    tooltip: { ...baseChartConfig.tooltip, trigger: 'axis' },
    yAxis: { ...baseChartConfig.yAxis, name: 'ms', nameTextStyle: { color: '#94A3B8', fontSize: 10 } },
    series: [
        { name: 'P50', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: THEME.success, width: 2 }, data: [45, 48, 42, 50, 46, 52, 48] },
        { name: 'P95', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: THEME.warning, width: 2 }, data: [120, 135, 128, 140, 130, 180, 150] },
        { name: 'P99', type: 'line', smooth: true, symbol: 'none', lineStyle: { color: THEME.critical, width: 2 }, data: [250, 400, 280, 520, 310, 850, 420] } // Spike shown
    ]
};

const dbConfig = {
    ...baseChartConfig,
    yAxis: { ...baseChartConfig.yAxis, name: 'qps', nameTextStyle: { color: '#94A3B8', fontSize: 10 } },
    series: [{
        name: 'Queries', type: 'bar', barWidth: '60%',
        itemStyle: { color: THEME.accent, borderRadius: [2, 2, 0, 0] },
        data: [35000, 38000, 42000, 39000, 45000, 41000, 43000]
    }]
};

// ==========================================
// 4. MAIN DASHBOARD PAGE
// ==========================================

export default function MonitoringConsolePage() {
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [time, setTime] = useState("");

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => {
            if (isAutoRefresh) setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, [isAutoRefresh]);

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0F172A] text-[#F8FAFC] h-[100vh] font-display">
            <style dangerouslySetInnerHTML={{
                __html: `
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #64748B; }
                `
            }} />

            {/* 1. TOP LIVE STATUS BAR */}
            <div className="px-5 py-3 border-b border-[#334155] bg-[#1E293B] shrink-0 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-[#06B6D4]" />
                        <h1 className="text-[16px] font-bold tracking-tight text-[#F8FAFC]">SRE Console <span className="text-[#94A3B8] font-normal">| Production</span></h1>
                    </div>
                    <div className="h-5 w-[1px] bg-[#334155]"></div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded text-[13px] font-bold text-[#F59E0B] shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                        <AlertTriangle className="w-4 h-4 animate-pulse" /> System Degraded
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-4 text-[12px] font-mono text-[#94A3B8]">
                        <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#06B6D4]" /> 24,500 req/s</span>
                        <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-[#22C55E]" /> 8.4M Active TCP</span>
                    </div>

                    <div className="h-5 w-[1px] bg-[#334155]"></div>

                    <button
                        onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[12px] font-bold font-mono transition-colors ${isAutoRefresh ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20' : 'bg-[#334155]/50 text-[#94A3B8] border border-[#334155]'}`}
                    >
                        {isAutoRefresh ? <span className="relative flex h-2 w-2 mr-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                        </span> : <Pause className="w-3 h-3" />}
                        LIVE: {time}
                    </button>

                    <button
                        onClick={() => setIsAlertsOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 rounded-md text-[13px] font-bold text-[#EF4444] transition-colors relative"
                    >
                        <ShieldAlert className="w-4 h-4" /> Active Alerts (3)
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#EF4444] rounded-full animate-pulse border-2 border-[#1E293B]"></span>
                    </button>

                    <select className="bg-[#0F172A] border border-[#334155] text-[#F8FAFC] text-[12px] font-bold rounded-md px-2 py-1 outline-none font-mono">
                        <option>Last 15m</option>
                        <option>Last 1h</option>
                        <option>Last 6h</option>
                    </select>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

                    {/* 2. REAL-TIME SUMMARY GRID */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        <LiveMetricCard title="Global RPS" value="24.5k" trend="+5.2% vs 5m" status="good" />
                        <LiveMetricCard title="Error Rate" value="1.42%" trend="Spike detected" status="critical" />
                        <LiveMetricCard title="P95 Latency" value="150" unit="ms" trend="Elevated queue" status="warning" />
                        <LiveMetricCard title="Total Pods" value="1,402" trend="Scaling up..." status="neutral" />
                        <LiveMetricCard title="Active Incidents" value="1" trend="SEV-2: Billing" status="critical" />
                        <LiveMetricCard title="API Apdex" value="0.84" trend="Target: 0.95" status="warning" />
                    </div>

                    {/* 3. CORE METRICS STRIP */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* API Traffic */}
                        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col h-[280px]">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[13px] font-bold text-[#F8FAFC] flex items-center gap-2"><Activity className="w-4 h-4 text-[#06B6D4]" /> API Gateway Traffic</h3>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ReactECharts option={rpsChartConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                            </div>
                        </div>

                        {/* Latency Distribution */}
                        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col h-[280px]">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[13px] font-bold text-[#F8FAFC] flex items-center gap-2"><Clock className="w-4 h-4 text-[#F59E0B]" /> Global Latency (P50/P95/P99)</h3>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ReactECharts option={latencyChartConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                            </div>
                        </div>

                        {/* DB Queries */}
                        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col h-[280px]">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[13px] font-bold text-[#F8FAFC] flex items-center gap-2"><Database className="w-4 h-4 text-[#06B6D4]" /> Primary DB Throughput</h3>
                            </div>
                            <div className="flex-1 w-full relative">
                                <ReactECharts option={dbConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                            </div>
                        </div>
                    </div>

                    {/* 4. SERVICE STATUS DATAGRID */}
                    <div className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                        <div className="px-5 py-3 border-b border-[#334155] bg-[#1E293B] flex items-center justify-between">
                            <h3 className="text-[14px] font-bold text-[#F8FAFC] flex items-center gap-2"><Server className="w-4 h-4 text-[#94A3B8]" /> Core Microservices Registry</h3>
                            <button className="text-[12px] font-bold text-[#06B6D4] hover:underline font-mono">View All 142 Services</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px] font-mono">
                                <thead className="bg-[#0F172A] text-[#94A3B8] text-[11px] uppercase tracking-wider border-b border-[#334155]">
                                    <tr>
                                        <th className="px-5 py-3 font-semibold">Service Name</th>
                                        <th className="px-5 py-3 font-semibold">Status</th>
                                        <th className="px-5 py-3 font-semibold">Uptime</th>
                                        <th className="px-5 py-3 font-semibold">CPU</th>
                                        <th className="px-5 py-3 font-semibold">Memory</th>
                                        <th className="px-5 py-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#334155]">
                                    {SERVICES.map((s) => (
                                        <tr key={s.name} className="hover:bg-[#334155]/20 group transition-colors">
                                            <td className="px-5 py-3 font-bold text-[#F8FAFC] flex items-center gap-2">
                                                <HardDrive className="w-3.5 h-3.5 text-[#64748B]" /> {s.name}
                                                <span className="text-[#64748B] font-normal text-[11px]">({s.pods} pods)</span>
                                            </td>
                                            <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                                            <td className="px-5 py-3 text-[#E2E8F0]">{s.uptime}</td>
                                            <td className="px-5 py-3 text-[#E2E8F0]">{s.cpu}</td>
                                            <td className="px-5 py-3 text-[#E2E8F0]">{s.mem}</td>
                                            <td className="px-5 py-3 text-right">
                                                <button className="text-[11px] font-bold text-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity border border-[#06B6D4]/30 bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 px-2 py-1 rounded">Traces</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* 5. LIVE LOG STREAM CONSOLE (BOTTOM FIXED) */}
                <div className="h-[250px] bg-[#0F172A] border-t-2 border-[#334155] flex flex-col shrink-0">
                    <div className="px-4 py-2 border-b border-[#334155] bg-[#1E293B]/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#F8FAFC] font-mono">
                                <Terminal className="w-4 h-4 text-[#06B6D4]" /> Tail Logs
                            </div>
                            <div className="h-4 w-[1px] bg-[#334155]"></div>
                            <div className="flex gap-1.5">
                                <span className="px-2 py-0.5 bg-[#1E293B] border border-[#334155] rounded text-[10px] font-bold text-[#EF4444] cursor-pointer hover:bg-[#334155] transition-colors">ERROR</span>
                                <span className="px-2 py-0.5 bg-[#1E293B] border border-[#334155] rounded text-[10px] font-bold text-[#F59E0B] cursor-pointer hover:bg-[#334155] transition-colors">WARN</span>
                                <span className="px-2 py-0.5 bg-[#1E293B] border border-[#334155] rounded text-[10px] font-bold text-[#94A3B8] cursor-pointer hover:bg-[#334155] transition-colors">INFO</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2 top-1.5 text-[#64748B]" />
                                <input type="text" placeholder="Grep grep regex..." className="bg-[#1E293B] border border-[#334155] text-[12px] font-mono text-[#F8FAFC] rounded px-2 py-1 pl-7 w-[200px] outline-none focus:border-[#06B6D4]" />
                            </div>
                            <button className="p-1 hover:bg-[#334155] rounded text-[#94A3B8] transition-colors" title="Download Logs"><Download className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {/* Log Terminal Window */}
                    <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] whitespace-pre-wrap font-medium leading-relaxed bg-black/40">
                        {MOCK_LOGS.map(log => (
                            <div key={log.id} className="flex gap-3 hover:bg-[#334155]/30 px-2 py-0.5 rounded transition-colors group">
                                <span className="text-[#64748B] shrink-0">{log.time}</span>
                                <span className={`shrink-0 w-16 ${log.level === 'CRITICAL' || log.level === 'ERROR' ? 'text-[#EF4444]' : log.level === 'WARN' ? 'text-[#F59E0B]' : 'text-[#06B6D4]'}`}>
                                    [{log.level}]
                                </span>
                                <span className="text-[#D8B4FE] shrink-0 w-36 overflow-hidden text-ellipsis whitespace-nowrap">{log.source}</span>
                                <span className={`${(log.level === 'CRITICAL' || log.level === 'ERROR') ? 'text-[#FCA5A5]' : 'text-[#E2E8F0]'}`}>
                                    {log.msg}
                                </span>
                            </div>
                        ))}
                        {/* Blinking cursor */}
                        <div className="flex gap-3 px-2 py-0.5">
                            <span className="text-[#64748B] shrink-0">{time} Z</span>
                            <span className="w-2 h-4 bg-[#06B6D4] animate-pulse"></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. RIGHT ALERT DRAWER (SLIDE-OVER) */}
            {isAlertsOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm transition-opacity" onClick={() => setIsAlertsOpen(false)}></div>
                    <div className="w-full max-w-[450px] bg-[#1E293B] border-l border-[#334155] h-full shadow-[-10px_0_30px_rgba(0,0,0,0.5)] relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                        <div className="px-5 py-4 border-b border-[#334155] bg-[#0F172A] flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-[#EF4444]">
                                <AlertTriangle className="w-5 h-5" />
                                <h2 className="text-[16px] font-bold">Active Alerts Console</h2>
                            </div>
                            <button onClick={() => setIsAlertsOpen(false)} className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] rounded-md transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0F172A]">
                            {MOCK_ALERTS.map(alert => (
                                <div key={alert.id} className={`bg-[#1E293B] border-l-4 rounded-r-lg shadow-sm p-4 relative overflow-hidden ${alert.severity === 'critical' ? 'border-[#EF4444]' : alert.severity === 'high' ? 'border-[#F97316]' : 'border-[#F59E0B]'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#F8FAFC] font-bold text-[14px] font-mono">{alert.id}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${alert.severity === 'critical' ? 'bg-[#EF4444]/10 text-[#EF4444]' : alert.severity === 'high' ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-[#F59E0B]/10 text-[#F59E0B]'}`}>
                                                {alert.severity}
                                            </span>
                                        </div>
                                        <span className="text-[#64748B] text-[11px] font-mono">{alert.time}</span>
                                    </div>
                                    <p className="text-[#E2E8F0] text-[13px] mb-1 font-medium">Triggered: <span className="font-mono text-[#FCA5A5]">{alert.threshold}</span></p>
                                    <p className="text-[#94A3B8] text-[12px] mb-4 flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> {alert.service}</p>

                                    <div className="flex items-center gap-2 mt-2 pt-3 border-t border-[#334155]/50">
                                        <button className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#F8FAFC] text-[12px] font-bold py-1.5 rounded transition-colors flex justify-center items-center gap-1.5">
                                            <CheckCircle className="w-3.5 h-3.5" /> Acknowledge
                                        </button>
                                        <button className="flex-1 border border-[#06B6D4]/30 hover:bg-[#06B6D4]/10 text-[#06B6D4] text-[12px] font-bold py-1.5 rounded transition-colors text-center">
                                            Runbook
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
