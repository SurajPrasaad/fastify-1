"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search, Filter, Download, MoreVertical, Shield, ShieldAlert,
    Ban, CheckCircle, X, Mail, Calendar, MapPin, Smartphone,
    AlertTriangle, Activity, Lock, UserX, UserCheck, RefreshCw, ChevronRight,
    TrendingUp, MessageSquare, Flag
} from "lucide-react";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";

// ==========================================
// 1. TYPES & MOCK DATA
// ==========================================

type UserRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Support' | 'User';
type UserStatus = 'Active' | 'Suspended' | 'Banned';
type RiskLevel = 'Low' | 'Medium' | 'High';

interface UserData {
    id: string;
    avatar: string;
    name: string;
    handle: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    verified: boolean;
    followers: number;
    posts: number;
    risk: RiskLevel;
    joined: string;
    lastActive: string;
    region: string;
    device: string;
    reports: number;
    warnings: number;
}

const generateMockUsers = (count: number): UserData[] => {
    const roles: UserRole[] = ['Super Admin', 'Admin', 'Moderator', 'Support', 'User', 'User', 'User', 'User'];
    const statuses: UserStatus[] = ['Active', 'Active', 'Active', 'Suspended', 'Banned'];
    const risks: RiskLevel[] = ['Low', 'Low', 'Low', 'Medium', 'High'];

    return Array.from({ length: count }).map((_, i) => ({
        id: `USR-${1000 + i}`,
        avatar: `https://i.pravatar.cc/150?u=${i}`,
        name: `User ${i + 1}`,
        handle: `@user_${i + 1}`,
        email: `user${i + 1}@example.com`,
        role: roles[Math.floor(Math.random() * roles.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        verified: Math.random() > 0.8,
        followers: Math.floor(Math.random() * 50000),
        posts: Math.floor(Math.random() * 2000),
        risk: risks[Math.floor(Math.random() * risks.length)],
        joined: new Date(Date.now() - Math.random() * 100000000000).toLocaleDateString(),
        lastActive: new Date(Date.now() - Math.random() * 86400000).toLocaleTimeString(),
        region: 'US-East',
        device: Math.random() > 0.5 ? 'iOS' : 'Android',
        reports: Math.floor(Math.random() * 10),
        warnings: Math.floor(Math.random() * 3),
    }));
};

const mockData: UserData[] = [
    {
        id: "USR-0001",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuADJHZRir9EWJdLob5-cV_VV5PuXxsg6-Qa7-GSx9jVSL0dyh5AOMbjyBeEH8K2QAXddwMytH2rI6Jm1ZP3i6_uLZbI5uEoUZklZqxq0rgQBOlsHV7-sOkFbTsIzh8GVCTb71OhuKL2drXYPkaASj1THD7lzoVfGHqbjlzGdYZnK9T4xVWOJ3ZUy0EZbiyNqe_KwGtz_XQ4nK75BHB2oZ__qjWcTHrpx5rAmpTtzvLsgDWTDBCxuqYamT30ozinkL_rNkdZgZJRLOY",
        name: "Alex Morgan",
        handle: "@amorgan_official",
        verified: true,
        email: "alex.m@company.com",
        role: "Moderator",
        status: "Active",
        followers: 24500,
        posts: 1200,
        risk: "Low",
        joined: "Oct 12, 2022",
        lastActive: "Just now",
        region: "US-West",
        device: "iOS Desktop",
        reports: 0,
        warnings: 0
    },
    ...generateMockUsers(45)
];

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
            backgroundColor: '#16181C',
            borderBottomColor: '#2F3336',
            borderBottomWidth: '1px',
            minHeight: '48px',
        },
    },
    headCells: {
        style: {
            fontSize: '11px',
            fontWeight: '700',
            color: '#71767B',
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
            backgroundColor: '#000000',
            color: '#E7E9EA',
            borderBottomColor: '#2F3336',
            minHeight: '64px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            '&:not(:last-of-type)': {
                borderBottomStyle: 'solid',
                borderBottomWidth: '1px',
            },
        },
        highlightOnHoverStyle: {
            backgroundColor: '#16181C',
            color: '#E7E9EA',
            borderBottomColor: '#2F3336',
            outline: 'none',
            transition: 'all 0.15s ease',
        },
    },
    pagination: {
        style: {
            backgroundColor: '#000000',
            color: '#71767B',
            borderTopColor: '#2F3336',
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
            color: '#71767B',
            fill: '#71767B',
            backgroundColor: 'transparent',
            '&:disabled': {
                cursor: 'unset',
                color: '#2F3336',
                fill: '#2F3336',
            },
            '&:hover:not(:disabled)': {
                backgroundColor: '#16181C',
                color: '#E7E9EA'
            },
            '&:focus': {
                outline: 'none',
                backgroundColor: '#16181C',
            },
        },
    },
};

// ==========================================
// 3. BADGE COMPONENTS
// ==========================================

const StatusBadge = ({ status }: { status: UserStatus }) => {
    const styles = {
        Active: 'bg-[#00BA7C]/10 text-[#00BA7C] border-[#00BA7C]/20',
        Suspended: 'bg-[#FFD400]/10 text-[#FFD400] border-[#FFD400]/20',
        Banned: 'bg-[#F91880]/10 text-[#F91880] border-[#F91880]/20'
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${styles[status]}`}>
            {status}
        </span>
    );
};

const RoleBadge = ({ role }: { role: UserRole }) => {
    const styles = {
        'Super Admin': 'text-[#FFD400] bg-[#FFD400]/10 border-[#FFD400]/20',
        'Admin': 'text-[#1D9BF0] bg-[#1D9BF0]/10 border-[#1D9BF0]/20',
        'Moderator': 'text-[#00BA7C] bg-[#00BA7C]/10 border-[#00BA7C]/20',
        'Support': 'text-[#8247E5] bg-[#8247E5]/10 border-[#8247E5]/20',
        'User': 'text-[#71767B] bg-[#2F3336] border-[#333639]'
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${styles[role]}`}>
            {role}
        </span>
    );
};

const RiskIndicator = ({ risk }: { risk: RiskLevel }) => {
    const colors = {
        Low: '#00BA7C',
        Medium: '#FFD400',
        High: '#F91880'
    };
    return (
        <div className="flex items-center gap-1.5" title={`Risk Level: ${risk}`}>
            <div className="w-2 h-2 rounded-full relative" style={{ backgroundColor: colors[risk] }}>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: colors[risk] }}></div>
            </div>
            <span className="text-[12px] font-bold tracking-wide uppercase" style={{ color: colors[risk] }}>{risk}</span>
        </div>
    );
};

// ==========================================
// 4. DRAWER COMPONENT
// ==========================================

const UserDrawer = ({ user, onClose }: { user: UserData | null, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Activity' | 'Moderation' | 'Security'>('Overview');

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-[480px] bg-black border-l border-[#2F3336] h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-[#2F3336] flex items-center justify-between shrink-0 bg-[#000000]">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-[18px] font-bold text-[#E7E9EA]">User Details</h2>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-[#71767B] hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10 rounded-full transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="px-6 py-6 border-b border-[#2F3336] bg-[#16181C]/30 shrink-0">
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-2xl border border-[#2F3336] object-cover" />
                            {user.verified && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-[#1D9BF0] rounded-full p-0.5 border-[2px] border-black">
                                    <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[20px] font-bold text-[#E7E9EA] leading-none">{user.name}</h3>
                                <StatusBadge status={user.status} />
                            </div>
                            <p className="text-[14px] text-[#71767B] mb-2">{user.handle}</p>
                            <RoleBadge role={user.role} />
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-[#2F3336] px-2 shrink-0">
                    {(['Overview', 'Activity', 'Moderation', 'Security'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-[13px] font-bold transition-all relative ${activeTab === tab ? 'text-[#E7E9EA]' : 'text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C]'
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
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Identity</h4>
                                <div className="bg-[#16181C] rounded-xl border border-[#2F3336] divide-y divide-[#2F3336]">
                                    <div className="flex items-center justify-between p-3.5">
                                        <div className="flex items-center gap-3 text-[#E7E9EA] text-[14px]">
                                            <Mail className="w-4 h-4 text-[#71767B]" /> Email
                                        </div>
                                        <span className="text-[14px] text-[#71767B]">{user.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5">
                                        <div className="flex items-center gap-3 text-[#E7E9EA] text-[14px]">
                                            <Calendar className="w-4 h-4 text-[#71767B]" /> Joined
                                        </div>
                                        <span className="text-[14px] text-[#71767B]">{user.joined}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5">
                                        <div className="flex items-center gap-3 text-[#E7E9EA] text-[14px]">
                                            <MapPin className="w-4 h-4 text-[#71767B]" /> Region
                                        </div>
                                        <span className="text-[14px] text-[#71767B]">{user.region}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-[12px] font-bold text-[#71767B] uppercase tracking-wider mb-3">Metrics</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-[#16181C] rounded-xl border border-[#2F3336] p-4 text-center">
                                        <div className="text-[20px] font-bold text-[#E7E9EA] mb-0.5">{user.followers.toLocaleString()}</div>
                                        <div className="text-[12px] font-medium text-[#71767B]">Followers</div>
                                    </div>
                                    <div className="bg-[#16181C] rounded-xl border border-[#2F3336] p-4 text-center">
                                        <div className="text-[20px] font-bold text-[#E7E9EA] mb-0.5">{user.posts.toLocaleString()}</div>
                                        <div className="text-[12px] font-medium text-[#71767B]">Posts</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Moderation' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between bg-[#16181C] rounded-xl border border-[#2F3336] p-4">
                                <div>
                                    <div className="text-[14px] font-bold text-[#E7E9EA] mb-0.5">Automated Risk Score</div>
                                    <div className="text-[12px] text-[#71767B]">Based on recent activity and reports</div>
                                </div>
                                <RiskIndicator risk={user.risk} />
                            </div>

                            <div className="bg-[#16181C] rounded-xl border border-[#2F3336] p-1">
                                <div className="flex items-center gap-3 p-3">
                                    <div className="w-8 h-8 rounded-full bg-[#F91880]/10 flex items-center justify-center shrink-0">
                                        <Flag className="w-4 h-4 text-[#F91880]" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-[#E7E9EA]">{user.reports} Reports Generated</div>
                                        <div className="text-[12px] text-[#71767B]">Past 30 days</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border-t border-[#2F3336]">
                                    <div className="w-8 h-8 rounded-full bg-[#FFD400]/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-[#FFD400]" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-[#E7E9EA]">{user.warnings} Warnings Issued</div>
                                        <div className="text-[12px] text-[#71767B]">Lifetime</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for other tabs */}
                    {(activeTab === 'Activity' || activeTab === 'Security') && (
                        <div className="flex flex-col items-center justify-center h-48 text-center animate-in fade-in duration-200">
                            <Activity className="w-8 h-8 text-[#2F3336] mb-3" />
                            <p className="text-[14px] text-[#71767B] font-medium">Detailed {activeTab.toLowerCase()} logs coming soon.</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#2F3336] bg-[#000000] shrink-0 grid grid-cols-2 gap-3">
                    {user.status === 'Active' ? (
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-[#16181C] hover:bg-[#FFD400]/10 text-[#FFD400] border border-[#2F3336] hover:border-[#FFD400]/50 rounded-xl text-[13px] font-bold transition-colors">
                            <UserX className="w-4 h-4" /> Suspend
                        </button>
                    ) : (
                        <button className="flex items-center justify-center gap-2 py-2.5 bg-[#16181C] hover:bg-[#00BA7C]/10 text-[#00BA7C] border border-[#2F3336] hover:border-[#00BA7C]/50 rounded-xl text-[13px] font-bold transition-colors">
                            <UserCheck className="w-4 h-4" /> Reactivate
                        </button>
                    )}
                    <button className="flex items-center justify-center gap-2 py-2.5 bg-[#F91880] hover:bg-[#F91880]/80 text-white rounded-xl text-[13px] font-bold transition-colors shadow-[0_0_15px_rgba(249,24,128,0.3)]">
                        <Ban className="w-4 h-4" /> Ban Account
                    </button>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// 5. MAIN PAGE COMPONENT
// ==========================================

export default function UsersManagementPage() {
    const [filterText, setFilterText] = useState("");
    const [selectedRows, setSelectedRows] = useState<UserData[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>("All Roles");

    const filteredData = useMemo(() => {
        return mockData.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(filterText.toLowerCase()) ||
                item.email.toLowerCase().includes(filterText.toLowerCase()) ||
                item.handle.toLowerCase().includes(filterText.toLowerCase());
            const matchesRole = roleFilter === "All Roles" || item.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [filterText, roleFilter]);

    const handleRowSelected = ({ selectedRows }: { selectedRows: UserData[] }) => {
        setSelectedRows(selectedRows);
    };

    const columns: TableColumn<UserData>[] = [
        {
            name: 'User',
            selector: row => row.name,
            sortable: true,
            cell: row => (
                <div className="flex items-center gap-3 py-2 w-full truncate">
                    <div className="relative shrink-0">
                        <img className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#2F3336] object-cover" src={row.avatar} alt={row.name} />
                        {row.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-[#1D9BF0] rounded-full p-[1px] border-[2px] border-black">
                                <CheckCircle className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-[14px] font-bold text-[#E7E9EA] truncate">{row.name}</div>
                        <div className="text-[13px] text-[#71767B] truncate">{row.handle}</div>
                    </div>
                </div>
            ),
            width: '240px'
        },
        {
            name: 'Role & Contact',
            selector: row => row.email,
            sortable: true,
            cell: row => (
                <div className="w-full flex flex-col justify-center py-2">
                    <div className="text-[13px] text-[#E7E9EA] font-medium mb-1 truncate">{row.email}</div>
                    <div><RoleBadge role={row.role} /></div>
                </div>
            ),
            minWidth: '200px'
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            cell: row => <StatusBadge status={row.status} />,
            width: '120px'
        },
        {
            name: 'Engagement',
            selector: row => row.followers,
            sortable: true,
            cell: row => (
                <div className="flex flex-col justify-center py-2">
                    <div className="text-[13px] text-[#E7E9EA]"><span className="font-bold">{row.followers > 1000 ? (row.followers / 1000).toFixed(1) + 'k' : row.followers}</span> <span className="text-[#71767B]">Flwrs</span></div>
                    <div className="text-[12px] text-[#71767B] font-medium">{row.posts} Posts</div>
                </div>
            ),
            width: '140px'
        },
        {
            name: 'Risk',
            selector: row => row.risk,
            sortable: true,
            cell: row => <RiskIndicator risk={row.risk} />,
            width: '120px'
        },
        {
            name: 'Joined',
            selector: row => row.joined,
            sortable: true,
            cell: row => <div className="text-[13px] font-medium text-[#71767B]">{row.joined}</div>,
            width: '120px'
        },
        {
            name: '',
            cell: row => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(row); }}
                    className="p-2 text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] rounded-full transition-colors ml-auto"
                >
                    <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2} />
                </button>
            ),
            button: true,
            width: '60px'
        }
    ];

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-[#000000] text-[#E7E9EA] h-[100vh] font-display">
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Minimal strict scrollbar for FAANG density */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2F3336; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #71767B; }

                /* react-data-table-component custom checkbox */
                .rdt_TableCol .sc-kOHTFB, .rdt_TableCell .sc-kOHTFB { margin-left: 12px; }
                input[type="checkbox"] {
                   accent-color: #1D9BF0;
                   cursor: pointer;
                   width: 16px;
                   height: 16px;
                   border-radius: 4px;
                   background-color: transparent;
                   border: 1px solid #71767B;
                }
                `
            }} />

            {/* Top Toolbar / Header */}
            <div className="px-6 py-5 border-b border-[#2F3336] bg-[#000000]/90 backdrop-blur-md z-10 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#E7E9EA] flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#1D9BF0]" />
                        User Management
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">Manage accounts, roles, and moderation actions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors">
                        <Download className="w-4 h-4 text-[#71767B]" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-[#000000] border-b border-[#2F3336] flex flex-wrap items-center justify-between gap-4 shrink-0">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
                    <div className="relative w-full max-w-[320px]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[#71767B]" />
                        </span>
                        <input
                            type="text"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            className="block w-full pl-9 pr-4 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] text-[#E7E9EA] placeholder-[#71767B] focus:ring-1 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] outline-none transition-all"
                            placeholder="Search name, email, or @handle..."
                        />
                    </div>

                    <div className="h-6 w-[1px] bg-[#2F3336] hidden sm:block"></div>

                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-[#16181C] border border-[#2F3336] py-2 px-3.5 rounded-full text-[13px] font-bold text-[#E7E9EA] focus:ring-1 focus:ring-[#1D9BF0] outline-none cursor-pointer hover:bg-[#2F3336] transition-colors appearance-none"
                    >
                        <option>All Roles</option>
                        <option>Super Admin</option>
                        <option>Admin</option>
                        <option>Moderator</option>
                        <option>Support</option>
                        <option>User</option>
                    </select>

                    <button className="flex items-center gap-2 px-3.5 py-2 bg-[#16181C] border border-[#2F3336] rounded-full text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] transition-colors">
                        <Filter className="w-[14px] h-[14px] text-[#71767B]" /> Advanced
                    </button>
                </div>
            </div>

            {/* Main Data Table Area */}
            <div className="flex-1 overflow-hidden relative flex flex-col">
                <div className="flex-1 overflow-auto bg-[#000000]">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        paginationPerPage={15}
                        paginationRowsPerPageOptions={[15, 30, 50, 100]}
                        selectableRows
                        onSelectedRowsChange={handleRowSelected}
                        customStyles={customStyles}
                        highlightOnHover
                        pointerOnHover
                        onRowClicked={(row) => setSelectedUser(row)}
                        noDataComponent={
                            <div className="p-12 text-center text-[#71767B] flex flex-col items-center">
                                <Search className="w-10 h-10 mb-4 opacity-50" />
                                <p className="text-[15px] font-bold text-[#E7E9EA] mb-1">No users found</p>
                                <p className="text-[13px]">Try adjusting your search or filters.</p>
                            </div>
                        }
                    />
                </div>

                {/* Sticky Bulk Action Bottom Bar */}
                {selectedRows.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-[#16181C] border border-[#2F3336] shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-full px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in z-40">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-[#E7E9EA]">
                            <span className="flex items-center justify-center bg-[#1D9BF0] text-white w-6 h-6 rounded-full text-[12px]">{selectedRows.length}</span>
                            Selected
                        </div>
                        <div className="h-5 w-[1px] bg-[#2F3336]"></div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 hover:bg-[#FFD400]/10 text-[#71767B] hover:text-[#FFD400] rounded-full text-[13px] font-bold transition-colors">
                                Suspend All
                            </button>
                            <button className="px-4 py-1.5 hover:bg-[#F91880]/10 text-[#71767B] hover:text-[#F91880] rounded-full text-[13px] font-bold transition-colors">
                                Ban All
                            </button>
                            <button className="px-4 py-1.5 bg-[#E7E9EA] text-black hover:bg-white rounded-full text-[13px] font-bold transition-colors ml-2 shadow-sm">
                                Export Data
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-over Profile Drawer */}
            <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
        </div>
    );
}
