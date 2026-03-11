/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search,
    Filter,
    Download,
    MoreVertical,
    Shield,
    ShieldAlert,
    Ban,
    CheckCircle,
    X,
    Mail,
    Calendar,
    MapPin,
    Smartphone,
    AlertTriangle,
    Activity,
    Lock,
    UserX,
    UserCheck,
    RefreshCw,
    ChevronRight,
    TrendingUp,
    MessageSquare,
    Flag,
    Globe,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
} from "lucide-react";
import DataTable, { TableColumn, TableStyles, createTheme } from "react-data-table-component";
import { AdminApi, type AdminUserListItem } from "@/features/admin/api";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// ==========================================
// 1. TYPES & MOCK DATA
// ==========================================

type UserRole = "Super Admin" | "Admin" | "Moderator" | "Support" | "User";
type UserStatus = "Active" | "Suspended" | "Banned";
type RiskLevel = 'Low' | 'Medium' | 'High';

interface UserData {
    id: string;
    avatar: string | null;
    cover: string | null;
    name: string;
    handle: string;
    email: string;
    bio: string;
    role: UserRole;
    status: UserStatus;
    verified: boolean;
    followers: number;
    following: number;
    posts: number;
    risk: RiskLevel;
    joined: string;
    lastActive: string;
    region: string;
    location: string;
    website: string;
    techStack: string[];
    subscription: string;
    reports: number;
    warnings: number;
}

const mapBackendUserToRow = (user: AdminUserListItem): UserData => {
    const roleMap: Record<AdminUserListItem["role"], UserRole> = {
        SUPER_ADMIN: "Super Admin",
        ADMIN: "Admin",
        MODERATOR: "Moderator",
        RISK_ANALYST: "Support",
        VIEWER: "Support",
        USER: "User",
    };

    const statusMap: Record<AdminUserListItem["status"], UserStatus> = {
        ACTIVE: "Active",
        DEACTIVATED: "Suspended",
        SUSPENDED: "Suspended",
        DELETED: "Banned",
    };

    return {
        id: user.id,
        avatar: user.avatarUrl || null,
        cover: user.coverUrl || null,
        name: user.name,
        handle: `@${user.username}`,
        email: user.email,
        bio: user.bio || "No bio set",
        role: roleMap[user.role],
        status: statusMap[user.status],
        verified: false,
        followers: user.followersCount ?? 0,
        following: user.followingCount ?? 0,
        posts: user.postsCount ?? 0,
        risk: "Low",
        joined: new Date(user.createdAt).toLocaleDateString(),
        lastActive: "–",
        region: user.regionAffinity || "Unknown",
        location: user.location || "Unknown",
        website: user.website || "–",
        techStack: user.techStack || [],
        subscription: user.subscriptionPlan || "FREE",
        reports: 0,
        warnings: 0,
    };
};

// ==========================================
// 2. DESIGN TOKENS & STYLES (DevAtlas Dark)
// ==========================================

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
            minHeight: '40px',
        },
    },
    headCells: {
        style: {
            fontSize: '11px',
            fontWeight: '700',
            color: 'hsl(var(--foreground))',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            paddingLeft: '12px',
            paddingRight: '12px',
        },
    },
    cells: {
        style: {
            paddingLeft: '12px',
            paddingRight: '12px',
        },
    },
    rows: {
        style: {
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderBottomColor: 'hsl(var(--border))',
            minHeight: '52px',
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
        'User': 'text-muted-foreground bg-muted border-border'
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

const ActivityList = ({ userId }: { userId: string }) => {
    const { data: logs, isLoading } = trpc.admin.users.getActivityLogs.useQuery({
        userId,
        limit: 20
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-secondary/50 shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-secondary/50 rounded w-3/4" />
                            <div className="h-3 bg-secondary/50 rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                <Activity className="w-8 h-8 opacity-20 mb-3" />
                <p className="text-[14px] font-medium">No activity found for this user.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {logs.map((log: any) => (
                <div key={log.id} className="flex gap-3 group">
                    <div className="relative flex flex-col items-center shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-border bg-secondary transition-colors ${log.status === 'SUCCESS' ? 'text-[#00BA7C] group-hover:border-[#00BA7C]/50' : 'text-[#F91880] group-hover:border-[#F91880]/50'}`}>
                            {log.status === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </div>
                        <div className="absolute top-8 bottom-[-24px] w-[1px] bg-border last:hidden" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 pb-6">
                        <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="text-[14px] font-bold text-foreground truncate uppercase tracking-tight">
                                {log.action.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap bg-secondary px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                                <Clock className="w-3 h-3" />
                                {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        {log.ipAddress && (
                            <div className="text-[12px] text-muted-foreground/70 mb-2 font-mono bg-secondary/30 px-2 py-0.5 rounded w-fit">
                                {log.ipAddress}
                            </div>
                        )}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="bg-secondary/30 border border-border rounded-lg p-3 mt-2">
                                <pre className="text-[11px] text-muted-foreground font-mono overflow-auto max-h-[100px] scrollbar-hide">
                                    {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

// ==========================================
// 4. DRAWER COMPONENT
// ==========================================

const UserDrawer = ({
    user,
    onClose,
    onSuspend,
    onReactivate,
    onBan,
}: {
    user: UserData | null;
    onClose: () => void;
    onSuspend: (user: UserData) => void;
    onReactivate: (user: UserData) => void;
    onBan: (user: UserData) => void;
}) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Activity' | 'Moderation' | 'Security'>('Overview');

    if (!user) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="w-full max-w-[480px] bg-background border-l border-border h-full shadow-2xl relative flex flex-col transform transition-transform duration-300 animate-in slide-in-from-right">

                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-border flex items-center justify-between shrink-0 bg-background">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-[18px] font-bold text-foreground">User Details</h2>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-muted-foreground hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10 rounded-full transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="px-6 py-6 border-b border-border bg-secondary/30 shrink-0">
                    <div className="flex items-start gap-4">
                        <div className="relative">
                            <img src={user.avatar || "/avatar-placeholder.png"} alt={user.name} className="w-16 h-16 rounded-2xl border border-border object-cover" />
                            {user.verified && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-[#1D9BF0] rounded-full p-0.5 border-[2px] border-background">
                                    <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-[20px] font-bold text-foreground leading-none truncate">{user.name}</h3>
                                <StatusBadge status={user.status} />
                            </div>
                            <p className="text-[14px] text-muted-foreground mb-2">{user.handle}</p>
                            <div className="flex gap-2">
                                <RoleBadge role={user.role} />
                                <span className="bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20 px-2 py-0.5 rounded-md text-[11px] font-bold">
                                    {user.subscription}
                                </span>
                            </div>
                        </div>
                    </div>
                    {user.bio && (
                        <p className="mt-4 text-[13px] text-foreground line-clamp-3 leading-relaxed">
                            {user.bio}
                        </p>
                    )}
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-border px-2 shrink-0">
                    {(['Overview', 'Activity', 'Moderation', 'Security'] as const).map(tab => (
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
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {activeTab === 'Overview' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Identity</h4>
                                <div className="bg-secondary/30 rounded-[8px] border border-border divide-y divide-border">
                                    <div className="flex items-center justify-between p-3.5">
                                        <div className="flex items-center gap-3 text-foreground text-[14px]">
                                            <Mail className="w-4 h-4 text-muted-foreground" /> Email
                                        </div>
                                        <span className="text-[14px] text-muted-foreground">{user.email}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5">
                                        <div className="flex items-center gap-3 text-foreground text-[14px]">
                                            <Calendar className="w-4 h-4 text-muted-foreground" /> Joined
                                        </div>
                                        <span className="text-[14px] text-muted-foreground">{user.joined}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5">
                                        <div className="flex items-center gap-3 text-foreground text-[14px]">
                                            <MapPin className="w-4 h-4 text-muted-foreground" /> Location
                                        </div>
                                        <span className="text-[14px] text-muted-foreground">{user.location}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5">
                                        <div className="flex items-center gap-3 text-foreground text-[14px]">
                                            <Globe className="w-4 h-4 text-muted-foreground" /> Website
                                        </div>
                                        <a href={user.website} target="_blank" rel="noreferrer" className="text-[14px] text-[#1D9BF0] hover:underline truncate max-w-[200px]">{user.website}</a>
                                    </div>
                                </div>
                            </div>

                            {user.techStack.length > 0 && (
                                <div>
                                    <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Tech Stack</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {user.techStack.map(tech => (
                                            <span key={tech} className="px-2.5 py-1 bg-secondary border border-border rounded-lg text-[12px] text-foreground font-medium">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Metrics</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-secondary border border-border rounded-[8px] p-4 text-center">
                                        <div className="text-[20px] font-bold text-foreground mb-0.5">{user.followers.toLocaleString()}</div>
                                        <div className="text-[12px] font-medium text-muted-foreground">Followers</div>
                                    </div>
                                    <div className="bg-secondary border border-border rounded-[8px] p-4 text-center">
                                        <div className="text-[20px] font-bold text-foreground mb-0.5">{user.following.toLocaleString()}</div>
                                        <div className="text-[12px] font-medium text-muted-foreground">Following</div>
                                    </div>
                                    <div className="bg-secondary border border-border rounded-[8px] p-4 text-center">
                                        <div className="text-[20px] font-bold text-foreground mb-0.5">{user.posts.toLocaleString()}</div>
                                        <div className="text-[12px] font-medium text-muted-foreground">Posts</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Moderation' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between bg-secondary/30 rounded-[8px] border border-border p-4">
                                <div>
                                    <div className="text-[14px] font-bold text-foreground mb-0.5">Automated Risk Score</div>
                                    <div className="text-[12px] text-muted-foreground">Based on recent activity and reports</div>
                                </div>
                                <RiskIndicator risk={user.risk} />
                            </div>

                            <div className="bg-secondary/30 rounded-[8px] border border-border p-1">
                                <div className="flex items-center gap-3 p-3">
                                    <div className="w-8 h-8 rounded-full bg-[#F91880]/10 flex items-center justify-center shrink-0">
                                        <Flag className="w-4 h-4 text-[#F91880]" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-foreground">{user.reports} Reports Generated</div>
                                        <div className="text-[12px] text-muted-foreground">Past 30 days</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 border-t border-border">
                                    <div className="w-8 h-8 rounded-full bg-[#FFD400]/10 flex items-center justify-center shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-[#FFD400]" />
                                    </div>
                                    <div>
                                        <div className="text-[14px] font-bold text-foreground">{user.warnings} Warnings Issued</div>
                                        <div className="text-[12px] text-muted-foreground">Lifetime</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Activity' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                            <ActivityList userId={user.id} />
                        </div>
                    )}

                    {activeTab === 'Security' && (
                        <div className="flex flex-col items-center justify-center h-48 text-center animate-in fade-in duration-200">
                            <Activity className="w-8 h-8 text-muted-foreground opacity-20 mb-3" />
                            <p className="text-[14px] text-muted-foreground font-medium">Detailed security logs coming soon.</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-background shrink-0 grid grid-cols-2 gap-3">
                    {user.status === "Active" ? (
                        <button
                            onClick={() => onSuspend(user)}
                            className="flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-[#FFD400]/10 text-[#FFD400] border border-border hover:border-[#FFD400]/50 rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer"
                        >
                            <UserX className="w-4 h-4" /> Suspend
                        </button>
                    ) : (
                        <button
                            onClick={() => onReactivate(user)}
                            className="flex items-center justify-center gap-2 py-2.5 bg-secondary hover:bg-[#00BA7C]/10 text-[#00BA7C] border border-border hover:border-[#00BA7C]/50 rounded-[8px] text-[13px] font-bold transition-colors cursor-pointer"
                        >
                            <UserCheck className="w-4 h-4" /> Reactivate
                        </button>
                    )}
                    <button
                        className="flex items-center justify-center gap-2 py-2.5 bg-[#F91880] hover:bg-[#F91880]/80 text-white rounded-[8px] text-[13px] font-bold transition-colors shadow-[0_0_15px_rgba(249,24,128,0.3)] cursor-pointer"
                        onClick={() => onBan(user)}
                    >
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

const LoadingComponent = () => (
    <div className="flex flex-col items-center justify-center p-20 bg-background w-full min-h-[400px]">
        <div className="relative">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <div className="absolute inset-0 w-10 h-10 border-4 border-primary/20 rounded-full"></div>
        </div>
        <div className="mt-4 text-[15px] font-bold text-foreground animate-pulse tracking-tight">
            Syncing Database...
        </div>
    </div>
);

export default function UsersManagementPage() {
    const [filterText, setFilterText] = useState("");
    const [selectedRows, setSelectedRows] = useState<UserData[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>("All Roles");
    const [users, setUsers] = useState<UserData[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                setIsFetching(true);
                const items = await AdminApi.listUsers();
                setUsers(items.map(mapBackendUserToRow));
            } catch {
                toast.error("Failed to load users");
            } finally {
                setIsFetching(false);
            }
        };
        load();
    }, []);

    const filteredData = useMemo(() => {
        return users.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(filterText.toLowerCase()) ||
                item.email.toLowerCase().includes(filterText.toLowerCase()) ||
                item.handle.toLowerCase().includes(filterText.toLowerCase());
            const matchesRole = roleFilter === "All Roles" || item.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [filterText, roleFilter, users]);

    const handleRowSelected = ({ selectedRows }: { selectedRows: UserData[] }) => {
        setSelectedRows(selectedRows);
    };

    const suspendMutation = trpc.admin.users.suspend.useMutation();
    const unsuspendMutation = trpc.admin.users.unsuspend.useMutation();
    const banMutation = trpc.admin.users.ban.useMutation();

    const handleSuspend = (user: UserData) => {
        suspendMutation.mutate({ userId: user.id, reason: "Suspended from admin dashboard" });
        toast.success("User suspended");
        setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: "Suspended" as UserStatus } : u)),
        );
    };

    const handleReactivate = (user: UserData) => {
        unsuspendMutation.mutate({ userId: user.id, reason: "Reactivated from admin dashboard" });
        toast.success("User reactivated");
        setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: "Active" as UserStatus } : u)),
        );
    };

    const handleBan = (user: UserData) => {
        banMutation.mutate({ userId: user.id, reason: "Banned from admin dashboard" });
        toast.success("User banned");
        setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, status: "Banned" as UserStatus } : u)),
        );
    };

    const columns: TableColumn<UserData>[] = [
        {
            name: 'User',
            selector: row => row.name,
            sortable: true,
            grow: 1.5,
            width: '180px',
            cell: row => (
                <div className="flex items-center gap-3 py-2 w-full truncate">
                    <div className="relative shrink-0">
                        <img className="w-8 h-8 rounded-full border border-border object-cover" src={row.avatar || "/avatar-placeholder.png"} alt={row.name} />
                        {row.verified && (
                            <div className="absolute -bottom-1 -right-1 bg-[#1D9BF0] rounded-full p-[1px] border-[2px] border-black">
                                <CheckCircle className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-foreground truncate">{row.name}</div>
                        <div className="text-[12px] text-muted-foreground truncate">{row.handle}</div>
                    </div>
                </div>
            ),
        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true,
            grow: 1.5,
            width: '180px',
            cell: row => (
                <div className="text-[13px] text-foreground font-medium truncate w-full">{row.email}</div>
            ),
        },
        {
            name: 'Role',
            selector: row => row.role,
            sortable: true,
            grow: 1,
            cell: row => <RoleBadge role={row.role} />,
        },
        {
            name: 'Location',
            selector: row => row.location,
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[12px] text-muted-foreground truncate">{row.location}</div>,
        },
        {
            name: 'Website',
            selector: row => row.website,
            sortable: true,
            grow: 1,
            cell: row => (
                <Link href={row.website} target="_blank" rel="noreferrer" className="text-[12px] text-[#1D9BF0] hover:underline truncate">
                    {row.website.replace(/^https?:\/\/(www\.)?/, '')}
                </Link>
            ),
        },
        {
            name: 'Status',
            selector: row => row.status,
            sortable: true,
            grow: 1,
            cell: row => <StatusBadge status={row.status} />,
        },
        {
            name: <div className="w-full text-center">Followers</div>,
            selector: row => row.followers,
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[13px] font-semibold text-foreground w-full text-center">{row.followers > 1000 ? (row.followers / 1000).toFixed(1) + 'k' : row.followers}</div>,
        },
        {
            name: <div className="w-full text-center">Following</div>,
            selector: row => row.following,
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[13px] font-semibold text-foreground w-full text-center">{row.following > 1000 ? (row.following / 1000).toFixed(1) + 'k' : row.following}</div>,
        },
        {
            name: <div className="w-full text-center">Posts</div>,
            selector: row => row.posts,
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[13px] font-semibold text-foreground w-full text-center">{row.posts > 1000 ? (row.posts / 1000).toFixed(1) + 'k' : row.posts}</div>,
        },
        {
            name: 'Risk',
            selector: row => row.risk,
            sortable: true,
            grow: 1,
            cell: row => <RiskIndicator risk={row.risk} />,
        },
        {
            name: 'Joined',
            selector: row => row.joined,
            sortable: true,
            grow: 1,
            cell: row => <div className="text-[13px] font-medium text-muted-foreground">{row.joined}</div>,
        },
        {
            name: '',
            cell: row => (
                <button
                    onClick={(e) => { e.stopPropagation(); setSelectedUser(row); }}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors ml-auto"
                >
                    <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2} />
                </button>
            ),
            width: '48px'
        }
    ];

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-background text-foreground min-h-screen font-display">
            {/* Top Toolbar / Header */}
            <div className="px-6 py-5 border-b border-border bg-background/90 backdrop-blur-md z-10 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] text-foreground flex items-center gap-2">
                        User Management
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-0.5">Manage accounts, roles, and moderation actions.</p>
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
                    <div className="relative w-full max-w-[520px]">
                        <Input
                            type="text"
                            value={filterText}
                            onChange={e => setFilterText(e.target.value)}
                            placeholder="Search name, email, or @handle..."
                        />
                    </div>

                    <div className="h-6 w-[1px] bg-border hidden sm:block"></div>

                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px] bg-secondary border border-border h-10 px-4 rounded-[8px] text-[13px] font-bold text-foreground focus:ring-1 focus:ring-primary transition-colors">
                            <SelectValue placeholder="All Roles" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="All Roles">All Roles</SelectItem>
                            <SelectItem value="Super Admin">Super Admin</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Moderator">Moderator</SelectItem>
                            <SelectItem value="User">User</SelectItem>
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
                        progressPending={isFetching}
                        pagination
                        paginationPerPage={15}
                        paginationRowsPerPageOptions={[15, 30, 50, 100]}
                        selectableRows
                        onSelectedRowsChange={handleRowSelected}
                        customStyles={customStyles}
                        theme="devatlas"
                        highlightOnHover
                        pointerOnHover
                        onRowClicked={(row) => setSelectedUser(row)}
                        progressComponent={<LoadingComponent />}
                        noDataComponent={
                            <div className="flex flex-col items-center justify-center p-20 bg-background w-full min-h-[400px]">
                                <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-6">
                                    <Search className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                                <h3 className="text-[17px] font-bold text-foreground mb-2">No users found</h3>
                                <p className="text-[14px] text-muted-foreground max-w-[280px] text-center leading-relaxed">
                                    We couldn't find any accounts matching your current search or filters.
                                </p>
                            </div>
                        }
                    />
                </div>

                {/* Sticky Bulk Action Bottom Bar */}
                {selectedRows.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-secondary border border-border shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-full px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in z-40">
                        <div className="flex items-center gap-2 text-[14px] font-bold text-foreground">
                            <span className="flex items-center justify-center bg-primary text-white w-6 h-6 rounded-full text-[12px]">{selectedRows.length}</span>
                            Selected
                        </div>
                        <div className="h-5 w-[1px] bg-border"></div>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-1.5 hover:bg-[#FFD400]/10 text-muted-foreground hover:text-[#FFD400] rounded-full text-[13px] font-bold transition-colors">
                                Suspend All
                            </button>
                            <button className="px-4 py-1.5 hover:bg-[#F91880]/10 text-muted-foreground hover:text-[#F91880] rounded-full text-[13px] font-bold transition-colors">
                                Ban All
                            </button>
                            <button className="px-4 py-1.5 bg-foreground text-background hover:bg-foreground/90 rounded-full text-[13px] font-bold transition-colors ml-2 shadow-sm">
                                Export Data
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Slide-over Profile Drawer */}
            <UserDrawer
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onSuspend={handleSuspend}
                onReactivate={handleReactivate}
                onBan={handleBan}
            />
        </div>
    );
}
