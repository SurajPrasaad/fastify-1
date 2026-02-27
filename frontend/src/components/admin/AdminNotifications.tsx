"use client";

import React, { useState, useMemo } from "react";
import ReactECharts from 'echarts-for-react';
import {
    Bell, Send, Clock, CheckCircle2, AlertTriangle,
    BarChart3, Plus, Search, Filter, MoreHorizontal, X,
    Smartphone, Mail, MessageSquare, ChevronRight,
    Users, Calendar, Settings, FileText, ChevronLeft,
    MonitorSmartphone, CheckCircle
} from "lucide-react";

// ==========================================
// 1. MOCK DATA & TYPES
// ==========================================

const KPI_DATA = [
    { title: "Total Sent (24h)", value: "12.4M", change: "+5.2%", isPositive: true, icon: Send, color: "text-[#1D9BF0]" },
    { title: "Active Campaigns", value: "8", change: "+2", isPositive: true, icon: ActivityIcon, color: "text-[#8247E5]" },
    { title: "Scheduled", value: "24", change: "-3", isPositive: false, icon: Clock, color: "text-[#FFD400]" },
    { title: "Delivery Success", value: "99.1%", change: "+0.1%", isPositive: true, icon: CheckCircle2, color: "text-[#00BA7C]" },
    { title: "Avg. Open Rate", value: "34.2%", change: "+2.4%", isPositive: true, icon: BarChart3, color: "text-[#1D9BF0]" },
    { title: "Failure Rate", value: "0.9%", change: "-0.5%", isPositive: true, icon: AlertTriangle, color: "text-[#F91880]" },
];

const MOCK_NOTIFICATIONS = [
    { id: "NOT-9942", title: "New Feature: AI Chat", channel: "Push", segment: "Beta Testers", status: "Sent", delivery: "99.2%", creator: "Admin Sarah", date: "2026-02-27 10:00" },
    { id: "NOT-9943", title: "Weekly Digest Newsletter", channel: "Email", segment: "Subscribers", status: "Sending", delivery: "45.0%", creator: "Mktg Team", date: "2026-02-27 12:00" },
    { id: "NOT-9944", title: "Server Maintenance Alert", channel: "In-App", segment: "All Users", status: "Scheduled", delivery: "-", creator: "DevOps System", date: "2026-02-28 02:00" },
    { id: "NOT-9945", title: "Subscription Expiring", channel: "SMS", segment: "Expiring < 7d", status: "Draft", delivery: "-", creator: "Billing Auth", date: "-" },
    { id: "NOT-9946", title: "Welcome to Platform", channel: "Email", segment: "New Reg (24h)", status: "Active", delivery: "98.9%", creator: "System Auto", date: "Ongoing" },
    { id: "NOT-9947", title: "Spam Policy Update", channel: "Push", segment: "Flagged Users", status: "Failed", delivery: "12.4%", creator: "Trust & Safety", date: "2026-02-26 15:30" },
];

const MOCK_CAMPAIGNS = [
    { id: "CMP-001", name: "Q4 Retention Push", objective: "Retention", channels: ["Push", "Email"], status: "Active", sentDate: "2026-02-20", delivered: "1.2M", openRate: "42%", clickRate: "12%" },
    { id: "CMP-002", name: "New AI Feature Announce", objective: "Product Update", channels: ["In-App", "Push"], status: "Scheduled", sentDate: "2026-03-01", delivered: "-", openRate: "-", clickRate: "-" },
    { id: "CMP-003", name: "Holiday Promo Code", objective: "Monetization", channels: ["Email", "SMS"], status: "Sent", sentDate: "2025-12-20", delivered: "4.5M", openRate: "55%", clickRate: "28%" },
    { id: "CMP-004", name: "Spam Policy Update", objective: "Trust & Safety", channels: ["Email", "In-App"], status: "Failed", sentDate: "2026-02-26", delivered: "12K", openRate: "2%", clickRate: "0%" },
    { id: "CMP-005", name: "Weekly Digest W9", objective: "Engagement", channels: ["Email"], status: "Draft", sentDate: "-", delivered: "-", openRate: "-", clickRate: "-" },
];

const MOCK_SEGMENTS = [
    { id: "SEG-901", name: "All Active Users (30d)", rule: "last_login < 30d", count: "14.2M", lastUsed: "2 hours ago" },
    { id: "SEG-902", name: "Premium Subscribers", rule: "subscription_status = 'active'", count: "1.8M", lastUsed: "1 day ago" },
    { id: "SEG-903", name: "Churn Risk (High)", rule: "engagement_score < 0.2 AND last_login > 14d", count: "450K", lastUsed: "5 days ago" },
    { id: "SEG-904", name: "Beta Testers - AI Mode", rule: "tags CONTAINS 'beta_ai'", count: "12K", lastUsed: "Just now" },
    { id: "SEG-905", name: "Dormant (90d+)", rule: "last_login > 90d", count: "8.4M", lastUsed: "1 month ago" },
];

const commonChartOptions = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#16181C', borderColor: '#2F3336', textStyle: { color: '#E7E9EA', fontSize: 12 } },
    grid: { top: 30, right: 20, bottom: 20, left: 40, containLabel: true }
};

const volumeChartConfig = {
    ...commonChartOptions,
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], axisLine: { lineStyle: { color: '#2F3336' } }, axisLabel: { color: '#71767B' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#2F3336', type: 'dashed' } }, axisLabel: { color: '#71767B' }, name: 'Millions', nameTextStyle: { color: '#71767B' } },
    series: [{ name: 'Sent', type: 'bar', barWidth: '40%', data: [1.2, 1.5, 1.8, 1.4, 2.1, 2.5, 1.9], itemStyle: { color: '#1D9BF0', borderRadius: [4, 4, 0, 0] } }]
};

const engagementChartConfig = {
    ...commonChartOptions,
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], axisLine: { lineStyle: { color: '#2F3336' } }, axisLabel: { color: '#71767B' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#2F3336', type: 'dashed' } }, axisLabel: { color: '#71767B' }, name: 'Percentage', nameTextStyle: { color: '#71767B' } },
    series: [{ name: 'Open Rate (%)', type: 'line', smooth: true, symbolSize: 8, data: [32, 35, 34, 38, 42, 45, 41], itemStyle: { color: '#00BA7C' }, lineStyle: { width: 3 } }]
};

const channelDistributionConfig = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#16181C', borderColor: '#2F3336', textStyle: { color: '#E7E9EA' } },
    legend: { bottom: '0', textStyle: { color: '#71767B' } },
    series: [
        {
            name: 'Channel', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 10, borderColor: '#000000', borderWidth: 2 },
            label: { show: false, position: 'center' },
            emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
            labelLine: { show: false },
            data: [
                { value: 65, name: 'Push', itemStyle: { color: '#1D9BF0' } },
                { value: 20, name: 'Email', itemStyle: { color: '#8247E5' } },
                { value: 10, name: 'In-App', itemStyle: { color: '#FFD400' } },
                { value: 5, name: 'SMS', itemStyle: { color: '#00BA7C' } }
            ]
        }
    ]
};

function ActivityIcon(props: any) {
    return <Activity {...props} />;
}
import { Activity } from "lucide-react";

// ==========================================
// 2. REUSABLE COMPONENTS
// ==========================================

const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
        case 'Sent': return <span className="px-2 py-1 bg-[#00BA7C]/10 text-[#00BA7C] border border-[#00BA7C]/20 rounded text-[11px] font-bold uppercase tracking-wider">Sent</span>;
        case 'Sending': return <span className="px-2 py-1 bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20 rounded text-[11px] font-bold uppercase tracking-wider animate-pulse">Sending</span>;
        case 'Scheduled': return <span className="px-2 py-1 bg-[#8247E5]/10 text-[#8247E5] border border-[#8247E5]/20 rounded text-[11px] font-bold uppercase tracking-wider">Scheduled</span>;
        case 'Active': return <span className="px-2 py-1 bg-[#00BA7C]/10 text-[#00BA7C] border border-[#00BA7C]/20 rounded text-[11px] font-bold uppercase tracking-wider">Active</span>;
        case 'Failed': return <span className="px-2 py-1 bg-[#F91880]/10 text-[#F91880] border border-[#F91880]/20 rounded text-[11px] font-bold uppercase tracking-wider">Failed</span>;
        default: return <span className="px-2 py-1 bg-[#333639] text-[#71767B] border border-[#333639] rounded text-[11px] font-bold uppercase tracking-wider">Draft</span>;
    }
};

const ChannelIcon = ({ channel, isMinor }: { channel: string, isMinor?: boolean }) => {
    switch (channel) {
        case 'Push': return isMinor ? <span title="Push"><Smartphone className="w-4 h-4 text-[#1D9BF0]" /></span> : <span className="flex items-center gap-1.5 text-[#E7E9EA]"><Smartphone className="w-4 h-4 text-[#1D9BF0]" /> Push</span>;
        case 'Email': return isMinor ? <span title="Email"><Mail className="w-4 h-4 text-[#8247E5]" /></span> : <span className="flex items-center gap-1.5 text-[#E7E9EA]"><Mail className="w-4 h-4 text-[#8247E5]" /> Email</span>;
        case 'SMS': return isMinor ? <span title="SMS"><MessageSquare className="w-4 h-4 text-[#00BA7C]" /></span> : <span className="flex items-center gap-1.5 text-[#E7E9EA]"><MessageSquare className="w-4 h-4 text-[#00BA7C]" /> SMS</span>;
        case 'In-App': return isMinor ? <span title="In-App"><MonitorSmartphone className="w-4 h-4 text-[#FFD400]" /></span> : <span className="flex items-center gap-1.5 text-[#E7E9EA]"><MonitorSmartphone className="w-4 h-4 text-[#FFD400]" /> In-App</span>;
        default: return <span>{channel}</span>;
    }
};

// ==========================================
// 3. WIZARD COMPONENT
// ==========================================

const CreateCampaignWizard = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [step, setStep] = useState(1);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="w-[90vw] max-w-[1000px] h-[85vh] bg-[#000000] border border-[#2F3336] rounded-2xl shadow-2xl relative flex overflow-hidden animate-in zoom-in-95">

                {/* Left: Wizard Steps Tracker */}
                <div className="w-[240px] bg-[#16181C] border-r border-[#2F3336] p-6 hidden md:flex flex-col">
                    <h2 className="text-[18px] font-bold text-[#E7E9EA] mb-8">New Campaign</h2>
                    <ul className="space-y-6 flex-1">
                        {[
                            { step: 1, title: 'Details & Scope', icon: FileText },
                            { step: 2, title: 'Content Editor', icon: MessageSquare },
                            { step: 3, title: 'Target Audience', icon: Users },
                            { step: 4, title: 'Scheduling', icon: Calendar },
                            { step: 5, title: 'Review & Send', icon: CheckCircle }
                        ].map((s) => (
                            <li key={s.step} className={`flex items-start gap-4 ${step === s.step ? 'opacity-100' : step > s.step ? 'opacity-50' : 'opacity-30'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 font-bold text-[13px] ${step === s.step ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-[#1D9BF0]' : step > s.step ? 'border-[#00BA7C] bg-[#00BA7C] text-black' : 'border-[#71767B] text-[#71767B]'}`}>
                                    {step > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                                </div>
                                <div className="mt-1">
                                    <p className={`font-bold text-[14px] ${step === s.step ? 'text-[#1D9BF0]' : 'text-[#E7E9EA]'}`}>{s.title}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right: Active Step Main Area */}
                <div className="flex-1 flex flex-col h-full bg-[#000000]">
                    <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between">
                        <h3 className="text-[18px] font-bold text-[#E7E9EA]">
                            {step === 1 && "Campaign Details"}
                            {step === 2 && "Design Content"}
                            {step === 3 && "Segment Audience"}
                            {step === 4 && "Delivery Schedule"}
                            {step === 5 && "Final Review"}
                        </h3>
                        <button onClick={onClose} className="p-2 text-[#71767B] hover:text-[#E7E9EA] transition-colors"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 relative">
                        {step === 1 && (
                            <div className="space-y-6 max-w-[500px]">
                                <div>
                                    <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Campaign Internal Name</label>
                                    <input type="text" placeholder="e.g. Q4 Growth Promo" className="w-full bg-[#16181C] border border-[#2F3336] text-[#E7E9EA] placeholder-[#71767B] rounded-lg px-4 py-3 outline-none focus:border-[#1D9BF0] transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Delivery Channels</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex flex-col items-center justify-center p-4 border-2 border-[#1D9BF0] bg-[#1D9BF0]/5 rounded-xl gap-2 text-[#1D9BF0]"><Smartphone className="w-6 h-6" /> <span className="font-bold text-[14px]">Push Notification</span></button>
                                        <button className="flex flex-col items-center justify-center p-4 border border-[#2F3336] bg-[#16181C] hover:border-[#71767B] rounded-xl gap-2 text-[#71767B]"><Mail className="w-6 h-6" /> <span className="font-bold text-[14px]">Email</span></button>
                                        <button className="flex flex-col items-center justify-center p-4 border border-[#2F3336] bg-[#16181C] hover:border-[#71767B] rounded-xl gap-2 text-[#71767B]"><MonitorSmartphone className="w-6 h-6" /> <span className="font-bold text-[14px]">In-App Alert</span></button>
                                        <button className="flex flex-col items-center justify-center p-4 border border-[#2F3336] bg-[#16181C] hover:border-[#71767B] rounded-xl gap-2 text-[#71767B]"><MessageSquare className="w-6 h-6" /> <span className="font-bold text-[14px]">SMS</span></button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex gap-8 h-full">
                                <div className="flex-1 space-y-5">
                                    <div>
                                        <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Notification Title</label>
                                        <input type="text" placeholder="Engaging title here..." className="w-full bg-[#16181C] border border-[#2F3336] text-[#E7E9EA] rounded-lg px-4 py-3 outline-none focus:border-[#1D9BF0]" />
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Notification Body <span className="text-[#71767B] font-normal float-right">0 / 140 chars</span></label>
                                        <textarea rows={4} placeholder="Main message content..." className="w-full bg-[#16181C] border border-[#2F3336] text-[#E7E9EA] rounded-lg px-4 py-3 outline-none focus:border-[#1D9BF0] resize-none"></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Deep Link / URL Action</label>
                                        <input type="text" placeholder="https://..." className="w-full bg-[#16181C] border border-[#2F3336] text-[#E7E9EA] placeholder-[#71767B] rounded-lg px-4 py-3 outline-none focus:border-[#1D9BF0] transition-colors font-mono" />
                                    </div>
                                </div>
                                <div className="w-[280px] bg-[#16181C] border border-[#2F3336] rounded-[32px] p-2 flex flex-col relative overflow-hidden h-[500px] shrink-0">
                                    {/* Fake iOS Preview */}
                                    <div className="absolute top-0 inset-x-0 h-6 bg-black flex justify-center items-end rounded-t-[30px]"><div className="w-1/3 h-4 bg-black rounded-b-xl border border-[#2F3336] border-t-0"></div></div>
                                    <div className="mt-8 mx-2 bg-[#2F3336]/40 p-3 rounded-2xl backdrop-blur-md border border-[#2F3336]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-4 h-4 rounded bg-[#1D9BF0] shrink-0"></div>
                                            <span className="text-[12px] text-[#E7E9EA] font-medium opacity-60">APP NAME • NOW</span>
                                        </div>
                                        <p className="text-[14px] font-bold text-[#E7E9EA] leading-tight">Engaging title here...</p>
                                        <p className="text-[13px] text-[#E7E9EA] mt-1 leading-snug">Main message content preview will appear right here when typing.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="max-w-[800px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h4 className="text-[15px] font-bold text-[#E7E9EA] mb-4">Select Target Audience</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border-2 border-[#1D9BF0] bg-[#1D9BF0]/5 rounded-xl p-5 cursor-pointer relative shadow-sm transition-all hover:bg-[#1D9BF0]/10">
                                            <div className="absolute top-5 right-5 text-[#1D9BF0]"><CheckCircle2 className="w-5 h-5" /></div>
                                            <h5 className="font-bold text-[#E7E9EA] mb-1.5 text-[15px]">All Active Users (30d)</h5>
                                            <p className="text-[13px] text-[#71767B] mb-4 font-mono bg-[#000000] px-2 py-1 rounded inline-block border border-[#2F3336]">last_login &lt; 30d</p>
                                            <div className="flex items-center gap-2 text-[#E7E9EA]">
                                                <Users className="w-4 h-4 text-[#1D9BF0]" />
                                                <span className="font-bold text-[14px]">14.2M Users</span>
                                            </div>
                                        </div>
                                        <div className="border border-[#2F3336] bg-[#16181C] hover:border-[#71767B] rounded-xl p-5 cursor-pointer relative transition-all hover:bg-[#202327]">
                                            <h5 className="font-bold text-[#E7E9EA] mb-1.5 text-[15px]">Premium Subscribers</h5>
                                            <p className="text-[13px] text-[#71767B] mb-4 font-mono bg-[#000000] px-2 py-1 rounded inline-block border border-[#2F3336]">subscription = 'active'</p>
                                            <div className="flex items-center gap-2 text-[#E7E9EA]">
                                                <Users className="w-4 h-4 text-[#71767B]" />
                                                <span className="font-bold text-[14px]">1.8M Users</span>
                                            </div>
                                        </div>
                                        <div className="border border-[#2F3336] bg-[#16181C] hover:border-[#71767B] rounded-xl p-5 cursor-pointer flex flex-col items-center justify-center min-h-[140px] text-[#1D9BF0] group border-dashed transition-all hover:bg-[#202327]">
                                            <div className="w-10 h-10 rounded-full bg-[#1D9BF0]/10 flex items-center justify-center mb-3 group-hover:bg-[#1D9BF0]/20 transition-colors">
                                                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            </div>
                                            <span className="font-bold text-[14px]">Create Custom Segment</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-gradient-to-r from-[#16181C] to-[#000000] border border-[#2F3336] rounded-xl flex items-center gap-5 mt-4">
                                    <div className="w-12 h-12 rounded-full bg-[#00BA7C]/10 flex items-center justify-center shrink-0 border border-[#00BA7C]/20">
                                        <Filter className="w-5 h-5 text-[#00BA7C]" />
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-bold text-[#E7E9EA] text-[15px] mb-1">Smart Suppression Applied</h5>
                                        <p className="text-[13px] text-[#71767B]">Automatically excluding users who received a push notification in the last 24 hours to prevent spam.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-[#2F3336] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#71767B] peer-checked:after:bg-white after:border-gray-300 after:border-0 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00BA7C]"></div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="max-w-[600px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h4 className="text-[15px] font-bold text-[#E7E9EA] mb-4">Delivery Method</h4>
                                    <div className="flex gap-4">
                                        <button className="flex-1 p-5 border-2 border-[#1D9BF0] bg-[#1D9BF0]/5 rounded-xl flex items-start gap-4 text-left shadow-sm transition-all focus:outline-none">
                                            <div className="mt-0.5 text-[#1D9BF0] bg-[#1D9BF0]/10 p-2 rounded-lg"><Send className="w-5 h-5" /></div>
                                            <div>
                                                <span className="block font-bold text-[#1D9BF0] mb-1.5 text-[15px]">Send Immediately</span>
                                                <span className="text-[13px] text-[#71767B] leading-snug">Start broadcasting to the target audience right away.</span>
                                            </div>
                                        </button>
                                        <button className="flex-1 p-5 border border-[#2F3336] bg-[#16181C] hover:border-[#71767B] hover:bg-[#202327] rounded-xl flex items-start gap-4 text-left transition-all focus:outline-none">
                                            <div className="mt-0.5 text-[#71767B] bg-[#2F3336]/50 p-2 rounded-lg"><Calendar className="w-5 h-5" /></div>
                                            <div>
                                                <span className="block font-bold text-[#E7E9EA] mb-1.5 text-[15px]">Schedule for Later</span>
                                                <span className="text-[13px] text-[#71767B] leading-snug">Pick a specific date and time for delivery.</span>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-[#2F3336]">
                                    <h4 className="text-[15px] font-bold text-[#E7E9EA]">Advanced Delivery Rules</h4>

                                    <div className="flex items-center justify-between p-5 bg-[#16181C] border border-[#2F3336] rounded-xl">
                                        <div>
                                            <h5 className="font-bold text-[#E7E9EA] text-[14px] mb-1">Intelligent Throttling</h5>
                                            <p className="text-[13px] text-[#71767B]">Limit the delivery rate to avoid crashing your servers.</p>
                                        </div>
                                        <select className="bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-lg px-4 py-2 text-[13px] font-bold outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]/50 transition-all cursor-pointer">
                                            <option>100k / min</option>
                                            <option>50k / min</option>
                                            <option>10k / min</option>
                                            <option>No Limit</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between p-5 bg-[#16181C] border border-[#2F3336] rounded-xl">
                                        <div>
                                            <h5 className="font-bold text-[#E7E9EA] text-[14px] mb-1">Respect Local Timezone</h5>
                                            <p className="text-[13px] text-[#71767B]">Deliver when it's the specific time in the user's timezone.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-[#2F3336] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#71767B] peer-checked:after:bg-white after:border-gray-300 after:border-0 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D9BF0]"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="max-w-[500px] mx-auto space-y-6">
                                <div className="p-6 bg-[#16181C] border border-[#2F3336] rounded-xl text-center">
                                    <div className="w-16 h-16 bg-[#00BA7C]/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-[#00BA7C]/20">
                                        <Send className="w-8 h-8 text-[#00BA7C] ml-1" />
                                    </div>
                                    <h3 className="text-[20px] font-bold text-[#E7E9EA]">Ready to Broadcast</h3>
                                    <p className="text-[#71767B] text-[14px] mt-2">This campaign will be delivered to approximately <strong className="text-[#1D9BF0]">1.2M users</strong> via <strong className="text-[#E7E9EA]">Push Notification</strong> starting immediately.</p>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="px-6 py-4 border-t border-[#2F3336] flex items-center justify-between bg-[#000000]">
                        <button
                            disabled={step === 1}
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            className="px-5 py-2.5 bg-transparent border border-[#2F3336] text-[#E7E9EA] font-bold text-[14px] rounded-full hover:bg-[#16181C] transition-colors disabled:opacity-30 flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>

                        {step < 5 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                className="px-5 py-2.5 bg-[#E7E9EA] text-black font-bold text-[14px] rounded-full hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-[#1D9BF0] text-white font-bold text-[14px] hover:bg-[#1A8CD8] transition-colors flex items-center gap-2 shadow-sm rounded-full"
                            >
                                <Send className="w-4 h-4 shrink-0" /> Confirm & Broadcast
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 4. MAIN PAGE CONTENT
// ==========================================

export default function NotificationsConsolePage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] text-[#E7E9EA] h-[100vh] font-display">
            <style dangerouslySetInnerHTML={{
                __html: `
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2F3336; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #71767B; }
                `
            }} />

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-[#2F3336] bg-[#000000]/90 backdrop-blur-md z-10 shrink-0 flex flex-wrap items-center justify-between gap-4 sticky top-0">
                <div>
                    <h1 className="text-[20px] font-bold tracking-tight text-[#E7E9EA] flex items-center gap-2">
                        <Bell className="w-5 h-5 text-[#1D9BF0]" /> Notification Hub
                    </h1>
                    <p className="text-[#71767B] text-[13px] mt-0.5 font-medium">Global broadcast and engagement console.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71767B]" />
                        <input type="text" placeholder="Search campaign ID or name..." className="w-[280px] bg-[#16181C] border border-[#2F3336] text-[13px] text-[#E7E9EA] rounded-full py-2 pl-9 pr-4 outline-none focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]/50 transition-all font-medium" />
                    </div>

                    <button onClick={() => setIsWizardOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white rounded-full text-[14px] font-bold transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> New Campaign
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="px-6 border-b border-[#2F3336] bg-[#000000] shrink-0 sticky top-[73px] z-10 flex gap-6">
                {['overview', 'campaigns', 'segments', 'analytics'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-3.5 text-[14px] font-bold capitalize transition-colors relative ${activeTab === tab ? 'text-[#E7E9EA]' : 'text-[#71767B] hover:text-[#E7E9EA]'}`}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 inset-x-0 h-1 bg-[#1D9BF0] rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">

                {activeTab === 'overview' && (
                    <>
                        {/* 1. KPI GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                            {KPI_DATA.map((kpi, idx) => {
                                const Icon = kpi.icon;
                                return (
                                    <div key={idx} className="bg-[#16181C] p-5 rounded-2xl border border-[#2F3336] shadow-sm flex flex-col justify-between group cursor-default hover:border-[#71767B]/50 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`w-8 h-8 rounded-lg bg-[#000000] border border-[#2F3336] flex items-center justify-center ${kpi.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <p className="text-[#71767B] text-[13px] font-semibold mb-1">{kpi.title}</p>
                                        <div className="flex items-end justify-between">
                                            <h3 className="text-[24px] font-bold tracking-tight text-[#E7E9EA] leading-none">{kpi.value}</h3>
                                            <span className={`text-[12px] font-bold ${kpi.isPositive ? 'text-[#00BA7C]' : 'text-[#F91880]'}`}>{kpi.change}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 2. RECENT NOTIFICATIONS TABLE */}
                        <div className="bg-[#000000] border border-[#2F3336] rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                            <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#16181C]">
                                <h3 className="text-[16px] font-bold text-[#E7E9EA]">Active & Recent Campaigns</h3>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#000000] border border-[#2F3336] rounded-md text-[12px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors"><Filter className="w-3.5 h-3.5" /> Filter</button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[13px] whitespace-nowrap">
                                    <thead className="bg-[#16181C] text-[#71767B] font-bold text-[12px] uppercase tracking-wider border-b border-[#2F3336]">
                                        <tr>
                                            <th className="px-6 py-3">ID</th>
                                            <th className="px-6 py-3">Campaign Title</th>
                                            <th className="px-6 py-3">Channel</th>
                                            <th className="px-6 py-3">Target Segment</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Delivery %</th>
                                            <th className="px-6 py-3 text-right">Scheduled / Date</th>
                                            <th className="px-6 py-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2F3336]">
                                        {MOCK_NOTIFICATIONS.map((notif) => (
                                            <tr key={notif.id} className="hover:bg-[#16181C]/50 transition-colors group">
                                                <td className="px-6 py-4 font-mono text-[#71767B]">{notif.id}</td>
                                                <td className="px-6 py-4 font-bold text-[#E7E9EA] flex flex-col">
                                                    {notif.title}
                                                    <span className="text-[11px] text-[#71767B] font-normal">By: {notif.creator}</span>
                                                </td>
                                                <td className="px-6 py-4"><ChannelIcon channel={notif.channel} /></td>
                                                <td className="px-6 py-4 text-[#71767B] font-medium">{notif.segment}</td>
                                                <td className="px-6 py-4"><StatusBadge status={notif.status} /></td>
                                                <td className={`px-6 py-4 text-right font-mono font-bold ${parseFloat(notif.delivery) > 90 ? 'text-[#00BA7C]' : parseFloat(notif.delivery) < 50 ? 'text-[#F91880]' : 'text-[#E7E9EA]'}`}>
                                                    {notif.delivery}
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono text-[#71767B]">{notif.date}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button className="p-1.5 rounded-md text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#2F3336] transition-colors opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'campaigns' && (
                    <div className="bg-[#000000] border border-[#2F3336] rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                        <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#16181C]">
                            <h3 className="text-[16px] font-bold text-[#E7E9EA]">Campaign Management</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setIsWizardOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D9BF0]/10 border border-[#1D9BF0]/20 rounded-md text-[12px] font-bold text-[#1D9BF0] hover:bg-[#1D9BF0]/20 transition-colors"><Plus className="w-3.5 h-3.5" /> Create Campaign</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px] whitespace-nowrap">
                                <thead className="bg-[#16181C] text-[#71767B] font-bold text-[12px] uppercase tracking-wider border-b border-[#2F3336]">
                                    <tr>
                                        <th className="px-6 py-3">Campaign</th>
                                        <th className="px-6 py-3">Objective</th>
                                        <th className="px-6 py-3">Channels</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Delivered</th>
                                        <th className="px-6 py-3 text-right">Open / Click Rate</th>
                                        <th className="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2F3336]">
                                    {MOCK_CAMPAIGNS.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-[#16181C]/50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-[#E7E9EA] flex flex-col">
                                                {campaign.name}
                                                <span className="text-[11px] text-[#71767B] font-normal font-mono">{campaign.id}</span>
                                            </td>
                                            <td className="px-6 py-4 text-[#71767B] font-medium">{campaign.objective}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {campaign.channels.map(c => <ChannelIcon key={c} channel={c} isMinor />)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><StatusBadge status={campaign.status} /></td>
                                            <td className="px-6 py-4 text-right font-mono text-[#E7E9EA]">{campaign.delivered}</td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                {campaign.openRate !== "-" ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[#00BA7C]">{campaign.openRate}</span>
                                                        <span className="text-[11px] text-[#71767B]">{campaign.clickRate} Clicks</span>
                                                    </div>
                                                ) : <span className="text-[#71767B]">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="px-3 py-1.5 rounded-md border border-[#2F3336] text-[#E7E9EA] hover:bg-[#2F3336] transition-colors text-[12px] font-bold">Manage</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'segments' && (
                    <div className="bg-[#000000] border border-[#2F3336] rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
                        <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#16181C]">
                            <h3 className="text-[16px] font-bold text-[#E7E9EA]">Audience Segments</h3>
                            <div className="flex gap-2">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D9BF0]/10 border border-[#1D9BF0]/20 rounded-md text-[12px] font-bold text-[#1D9BF0] hover:bg-[#1D9BF0]/20 transition-colors"><Plus className="w-3.5 h-3.5" /> Create Segment</button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[13px] whitespace-nowrap">
                                <thead className="bg-[#16181C] text-[#71767B] font-bold text-[12px] uppercase tracking-wider border-b border-[#2F3336]">
                                    <tr>
                                        <th className="px-6 py-3">Segment Name</th>
                                        <th className="px-6 py-3">Rule Definition</th>
                                        <th className="px-6 py-3 text-right">User Count</th>
                                        <th className="px-6 py-3 text-right">Last Used</th>
                                        <th className="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2F3336]">
                                    {MOCK_SEGMENTS.map((segment) => (
                                        <tr key={segment.id} className="hover:bg-[#16181C]/50 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-[#E7E9EA] flex flex-col">
                                                {segment.name}
                                                <span className="text-[11px] text-[#71767B] font-normal font-mono">{segment.id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="bg-[#2F3336]/30 border border-[#2F3336] rounded px-2 py-1 inline-block font-mono text-[11px] text-[#E7E9EA]">
                                                    {segment.rule}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono font-bold text-[#1D9BF0]">{segment.count}</td>
                                            <td className="px-6 py-4 text-right font-mono text-[#71767B]">{segment.lastUsed}</td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="px-3 py-1.5 rounded-md border border-[#2F3336] text-[#E7E9EA] hover:bg-[#2F3336] transition-colors text-[12px] font-bold">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Chart 1: Volume */}
                            <div className="bg-[#16181C] border border-[#2F3336] rounded-2xl p-5 shadow-sm h-[320px] flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[15px] font-bold text-[#E7E9EA]">Delivery Volume (7 Days)</h3>
                                    <button className="text-[#71767B] hover:text-[#E7E9EA]"><MoreHorizontal className="w-5 h-5" /></button>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <ReactECharts option={volumeChartConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                                </div>
                            </div>

                            {/* Chart 2: Engagement */}
                            <div className="bg-[#16181C] border border-[#2F3336] rounded-2xl p-5 shadow-sm h-[320px] flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[15px] font-bold text-[#E7E9EA]">Average Open Rate</h3>
                                    <button className="text-[#71767B] hover:text-[#E7E9EA]"><MoreHorizontal className="w-5 h-5" /></button>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <ReactECharts option={engagementChartConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                                </div>
                            </div>
                        </div>

                        {/* Chart 3 & Funnel Details Table */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-[#16181C] border border-[#2F3336] rounded-2xl p-5 shadow-sm h-[320px] flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[15px] font-bold text-[#E7E9EA]">Channel Dominance</h3>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <ReactECharts option={channelDistributionConfig} style={{ height: '100%', width: '100%', position: 'absolute' }} />
                                </div>
                            </div>

                            <div className="col-span-1 lg:col-span-2 bg-[#16181C] border border-[#2F3336] rounded-2xl p-5 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-[15px] font-bold text-[#E7E9EA]">Conversion Funnel (Current Week)</h3>
                                </div>
                                <div className="flex flex-col gap-4 mt-6">
                                    {/* Funnel Steps */}
                                    {[
                                        { label: "Total Sent", count: "14,500,000", pct: "100%", color: "bg-[#1D9BF0]" },
                                        { label: "Delivered", count: "14,210,000", pct: "98%", color: "bg-[#8247E5]" },
                                        { label: "Opened", count: "4,973,500", pct: "35%", color: "bg-[#00BA7C]" },
                                        { label: "Interacted (Clicked)", count: "895,230", pct: "6%", color: "bg-[#FFD400]" }
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-[120px] text-[13px] font-bold text-[#E7E9EA] shrink-0">{step.label}</div>
                                            <div className="flex-1 h-8 rounded-md bg-[#000000] border border-[#2F3336] overflow-hidden relative flex items-center">
                                                <div className={`h-full ${step.color} opacity-20`} style={{ width: step.pct }}></div>
                                                <div className="absolute left-3 text-[12px] font-mono text-[#E7E9EA]">{step.count}</div>
                                            </div>
                                            <div className="w-[50px] text-right font-bold text-[13px] text-[#71767B]">{step.pct}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CreateCampaignWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
        </div>
    );
}
