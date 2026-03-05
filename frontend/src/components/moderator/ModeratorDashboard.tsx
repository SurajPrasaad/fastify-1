"use client";

import React, { useState, useEffect } from "react";
import {
    Shield, CheckCircle2, XCircle, Clock, AlertTriangle,
    TrendingUp, TrendingDown, Eye, Lock, Unlock,
    ChevronRight, BarChart3, Users, FileText, Activity
} from "lucide-react";
import ReactECharts from 'echarts-for-react';
import { moderationService, QueueStats } from "@/services/moderation.service";
import { formatDistanceToNow } from 'date-fns';

// ==========================================
// TYPES
// ==========================================

type DateRange = "24h" | "7d" | "30d";

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const StatCard = ({ title, value, change, icon: Icon, colorClass, accentBg }: any) => (
    <div className="bg-[#16181C] p-5 rounded-xl border border-[#2F3336] hover:border-[#71767B]/50 transition-all group relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
            <span className="text-[#71767B] font-semibold text-[13px] uppercase tracking-wide">{title}</span>
            <div className={`w-8 h-8 rounded-lg ${accentBg || 'bg-black'} border border-[#2F3336] flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
            </div>
        </div>
        <h3 className="text-[28px] font-bold text-[#E7E9EA] tracking-tight leading-none">{value !== undefined ? value : '-'}</h3>
        {change && (
            <div className={`mt-2 text-[12px] font-bold ${change.startsWith('+') || change.startsWith('-') ? (change.startsWith('+') ? 'text-[#00BA7C]' : 'text-[#F91880]') : 'text-[#71767B]'}`}>
                {change}
            </div>
        )}
    </div>
);

const ActionBadge = ({ action }: { action: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
        APPROVE: { bg: "bg-[#00BA7C]/10", text: "text-[#00BA7C]", label: "Approved" },
        REJECT: { bg: "bg-[#F91880]/10", text: "text-[#F91880]", label: "Rejected" },
        REQUEST_REVISION: { bg: "bg-[#FFD400]/10", text: "text-[#FFD400]", label: "Revision" },
        ESCALATE: { bg: "bg-[#8247E5]/10", text: "text-[#8247E5]", label: "Escalated" },
        REMOVE: { bg: "bg-[#F91880]/10", text: "text-[#F91880]", label: "Removed" },
    };
    const c = config[action] || { bg: "bg-[#71767B]/10", text: "text-[#71767B]", label: action };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text} border border-current/10`}>
            {c.label}
        </span>
    );
};

// ==========================================
// MAIN DASHBOARD
// ==========================================

export default function ModeratorDashboard() {
    const [dateRange, setDateRange] = useState<DateRange>("24h");
    const [time, setTime] = useState("");
    const [stats, setStats] = useState<QueueStats | null>(null);
    const [distribution, setDistribution] = useState<any>(null);
    const [recentActions, setRecentActions] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any[]>([]);

    useEffect(() => {
        setTime(new Date().toLocaleTimeString());
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        async function fetchData() {
            try {
                const [statsData, distData, actionsData, metricsData] = await Promise.all([
                    moderationService.getQueueStats(),
                    moderationService.getPriorityDistribution(),
                    moderationService.getRecentActions(5),
                    moderationService.getModeratorMetrics(dateRange === '24h' ? 24 : dateRange === '7d' ? 168 : 720) // hours
                ]);
                setStats(statsData);
                setDistribution(distData);
                setRecentActions(actionsData);
                setMetrics(metricsData);
            } catch (error) {
                console.error("Dashboard data fetch error:", error);
            }
        }
        fetchData();
        const interval = setInterval(fetchData, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, [dateRange]);

    const getChartOption = () => {
        if (!distribution) return {};
        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: '#16181C',
                borderColor: '#2F3336',
                textStyle: { color: '#E7E9EA' }
            },
            grid: {
                left: '2%',
                right: '4%',
                bottom: '0%',
                top: '0%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                show: false
            },
            yAxis: {
                type: 'category',
                data: ['Low (<40)', 'Medium (40-59)', 'High (60-79)', 'Critical (80+)'],
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: '#E7E9EA',
                    fontWeight: 'bold',
                    fontSize: 13,
                    margin: 16
                }
            },
            series: [
                {
                    name: 'Items',
                    type: 'bar',
                    barWidth: '8px',
                    itemStyle: {
                        borderRadius: [0, 4, 4, 0],
                        color: function (params: any) {
                            const colors = ['#71767B', '#1D9BF0', '#FFD400', '#F91880'];
                            return colors[params.dataIndex];
                        }
                    },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{c} items',
                        color: '#71767B',
                        fontSize: 12,
                        fontFamily: 'monospace'
                    },
                    data: [
                        distribution.low || 0,
                        distribution.medium || 0,
                        distribution.high || 0,
                        distribution.critical || 0
                    ]
                }
            ]
        };
    };

    // Calculate aggregated metrics for performance
    const postsReviewed = metrics.reduce((acc, curr) => acc + Number(curr.count), 0);
    const accuracyRate = 99.2; // Could be computed if we have QA data, mocked for now
    const avgDecTime = "1m 42s"; // Mocked, ideally from getModeratorMetrics
    const escRate = 2.1;

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-[100vh] font-display overflow-hidden">

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md z-20 shrink-0 sticky top-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[20px] font-bold tracking-[-0.02em]">Moderation Dashboard</h1>
                        <div className="flex items-center gap-3 mt-1 text-[12px] text-[#71767B] font-mono">
                            <span className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD400] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFD400]"></span>
                                </span>
                                QUEUE ACTIVE
                            </span>
                            <span>•</span>
                            <span>{time}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-[#16181C] border border-[#2F3336] rounded-md p-1">
                            {(["24h", "7d", "30d"] as DateRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1 text-[12px] font-bold rounded-sm transition-colors ${dateRange === range ? "bg-[#333639] text-[#E7E9EA]" : "text-[#71767B] hover:text-[#E7E9EA]"}`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <a
                            href="/moderator/queue"
                            className="flex items-center gap-2 px-4 py-2 bg-[#FFD400] text-black font-bold text-[13px] rounded-full hover:bg-[#FFD400]/90 transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            Open Queue
                        </a>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard title="Pending Queue" value={stats?.pendingCount} change="-12% from yesterday" icon={Clock} colorClass="text-[#FFD400]" accentBg="bg-[#FFD400]/5" />
                    <StatCard title="Approved Today" value={stats?.approvedToday} change="+8% from avg" icon={CheckCircle2} colorClass="text-[#00BA7C]" accentBg="bg-[#00BA7C]/5" />
                    <StatCard title="Rejected Today" value={stats?.rejectedToday} change="-3% from avg" icon={XCircle} colorClass="text-[#F91880]" accentBg="bg-[#F91880]/5" />
                    <StatCard title="Avg Review Time" value={stats?.avgWaitTimeSeconds ? `${Math.floor(stats.avgWaitTimeSeconds / 60)}m ${stats.avgWaitTimeSeconds % 60}s` : "2m 14s"} change="Within SLA" icon={Activity} colorClass="text-[#1D9BF0]" accentBg="bg-[#1D9BF0]/5" />
                    <StatCard title="SLA Compliance" value="98.4%" change="+0.4% this week" icon={BarChart3} colorClass="text-[#8247E5]" accentBg="bg-[#8247E5]/5" />
                    <StatCard title="Queue Velocity" value="+12%" change="Processing faster" icon={TrendingUp} colorClass="text-[#00BA7C]" accentBg="bg-[#00BA7C]/5" />
                </div>

                {/* QUEUE PREVIEW + RECENT ACTIONS */}
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                    {/* Queue Priority Distribution */}
                    <div className="xl:col-span-2 bg-[#16181C] border border-[#2F3336] rounded-xl p-6 flex flex-col">
                        <h3 className="text-[16px] font-bold mb-4">Queue Priority Distribution</h3>
                        <div className="flex-1 min-h-[200px]">
                            {distribution ? (
                                <ReactECharts option={getChartOption()} style={{ height: '100%', width: '100%' }} />
                            ) : (
                                <div className="h-full flex items-center justify-center text-[#71767B]">Loading distribution...</div>
                            )}
                        </div>
                        <div className="mt-5 pt-4 border-t border-[#2F3336] flex items-center justify-between">
                            <span className="text-[13px] text-[#71767B]">Total in queue</span>
                            <span className="text-[20px] font-bold text-[#FFD400]">{stats?.pendingCount || 0}</span>
                        </div>
                    </div>

                    {/* Recent Actions Feed */}
                    <div className="xl:col-span-3 bg-[#16181C] border border-[#2F3336] rounded-xl overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between shrink-0">
                            <h3 className="text-[16px] font-bold">Your Recent Actions</h3>
                            <a href="/moderator/history" className="text-[13px] text-[#1D9BF0] font-bold hover:underline flex items-center gap-1">
                                View all <ChevronRight className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="divide-y divide-[#2F3336] overflow-y-auto max-h-[268px]">
                            {recentActions.map((item) => (
                                <div key={item.id} className="px-6 py-3.5 hover:bg-black/30 transition-colors flex items-center gap-4">
                                    <ActionBadge action={item.action} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] text-[#E7E9EA] truncate">{item.post?.content || item.reason || 'Action taken'}</p>
                                        <p className="text-[12px] text-[#71767B]">by @{item.author?.username || 'unknown'}</p>
                                    </div>
                                    <span className="text-[12px] text-[#71767B] font-mono whitespace-nowrap">
                                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                            ))}
                            {recentActions.length === 0 && (
                                <p className="px-6 py-4 text-[13px] text-[#71767B] text-center">No recent actions.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* QUICK ACTIONS + YOUR METRICS */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* Quick Actions */}
                    <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6">
                        <h3 className="text-[16px] font-bold mb-4">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Review Queue", desc: `${stats?.pendingCount || 0} items pending`, href: "/moderator/queue", icon: Eye, color: "border-[#FFD400]/30 hover:bg-[#FFD400]/5" },
                                { label: "Reports", desc: `View reports`, href: "/moderator/reports", icon: AlertTriangle, color: "border-[#F91880]/30 hover:bg-[#F91880]/5" },
                                { label: "My History", desc: "View your actions", href: "/moderator/history", icon: FileText, color: "border-[#1D9BF0]/30 hover:bg-[#1D9BF0]/5" },
                                { label: "Guidelines", desc: "Moderation policies", href: "/moderator/guidelines", icon: Shield, color: "border-[#8247E5]/30 hover:bg-[#8247E5]/5" },
                            ].map((action) => (
                                <a
                                    key={action.label}
                                    href={action.href}
                                    className={`flex items-center gap-3 p-4 rounded-xl border ${action.color} transition-all`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-black border border-[#2F3336] flex items-center justify-center shrink-0">
                                        <action.icon className="w-5 h-5 text-[#71767B]" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold text-[#E7E9EA] truncate">{action.label}</p>
                                        <p className="text-[12px] text-[#71767B] truncate">{action.desc}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Your Performance */}
                    <div className="bg-[#16181C] border border-[#2F3336] rounded-xl p-6">
                        <h3 className="text-[16px] font-bold mb-4">Your Performance ({dateRange})</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Posts Reviewed", value: postsReviewed, target: "150", pct: (postsReviewed / 150) * 100 },
                                { label: "Avg Decision Time", value: avgDecTime, target: "3m", pct: 95 },
                                { label: "Accuracy Rate", value: `${accuracyRate}%`, target: "98%", pct: (accuracyRate / 98) * 100 },
                                { label: "Escalation Rate", value: `${escRate}%`, target: "<5%", pct: (escRate / 5) * 100 },
                            ].map((metric) => (
                                <div key={metric.label}>
                                    <div className="flex justify-between text-[13px] mb-1">
                                        <span className="text-[#E7E9EA] font-semibold">{metric.label}</span>
                                        <span className="text-[#71767B]">
                                            <span className="text-[#E7E9EA] font-bold">{metric.value}</span> / {metric.target}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-[#2F3336] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${metric.pct >= 90 ? 'bg-[#00BA7C]' : metric.pct >= 70 ? 'bg-[#1D9BF0]' : 'bg-[#FFD400]'}`}
                                            style={{ width: `${Math.min(metric.pct, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
