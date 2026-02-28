"use client";

import React, { useState, useMemo } from "react";
import {
    Shield, Search, Plus, MoreVertical, ShieldAlert,
    Users, Clock, Copy, Edit2, Trash2, Eye, Lock,
    CheckCircle2, AlertTriangle, Info, ChevronDown, ChevronRight,
    Save, X, StopCircle, CornerDownRight
} from "lucide-react";

// ==========================================
// MOCK DATA & TYPES
// ==========================================

const ROLES = [
    { id: 'r1', name: 'Super Admin', isSystem: true, users: 2, risk: 'High', desc: 'Absolute access to all configurations and data.', lastModified: '2026-02-20' },
    { id: 'r2', name: 'Application Admin', isSystem: true, users: 5, risk: 'High', desc: 'Manage core features, skipping billing/security.', lastModified: '2026-02-01' },
    { id: 'r3', name: 'Moderator', isSystem: true, users: 42, risk: 'Medium', desc: 'Content filtering and user safety enforcement.', lastModified: '2026-01-15' },
    { id: 'r4', name: 'Support Spec.', isSystem: true, users: 120, risk: 'Low', desc: 'Read-only access for troubleshooting.', lastModified: '2025-11-10' },
    { id: 'r5', name: 'Marketing Manager', isSystem: false, users: 8, risk: 'Low', desc: 'Manage push notifications and global campaigns.', lastModified: '2026-02-25' },
    { id: 'r6', name: 'Financial Auditor', isSystem: false, users: 3, risk: 'Medium', desc: 'View billing reports and export revenue data.', lastModified: '2026-02-26' },
];

const PERMISSION_CATEGORIES = [
    {
        id: 'cat_users', name: 'User Management', risk: 'High',
        permissions: [
            { id: 'usr_view', name: 'View Users', type: 'Read', dependsOn: null },
            { id: 'usr_create', name: 'Create Users', type: 'Write', dependsOn: 'usr_view' },
            { id: 'usr_edit', name: 'Edit Users', type: 'Update', dependsOn: 'usr_view' },
            { id: 'usr_delete', name: 'Delete Users', type: 'Delete', dependsOn: 'usr_view' },
            { id: 'usr_suspend', name: 'Suspend/Ban', type: 'Update', dependsOn: 'usr_view' },
            { id: 'usr_export', name: 'Export Data', type: 'Export', dependsOn: 'usr_view' },
        ]
    },
    {
        id: 'cat_posts', name: 'Content Moderation', risk: 'Medium',
        permissions: [
            { id: 'pst_view', name: 'View Posts', type: 'Read', dependsOn: null },
            { id: 'pst_edit', name: 'Edit Content', type: 'Update', dependsOn: 'pst_view' },
            { id: 'pst_delete', name: 'Delete Posts', type: 'Delete', dependsOn: 'pst_view' },
            { id: 'pst_approve', name: 'Approve Pending', type: 'Approve', dependsOn: 'pst_view' },
        ]
    },
    {
        id: 'cat_security', name: 'Security & Access', risk: 'High',
        permissions: [
            { id: 'sec_view', name: 'View Audit Logs', type: 'Read', dependsOn: null },
            { id: 'sec_roles', name: 'Manage Roles', type: 'Configure', dependsOn: 'sec_view' },
            { id: 'sec_policy', name: 'Security Policies', type: 'Configure', dependsOn: 'sec_view' },
        ]
    },
    {
        id: 'cat_billing', name: 'Billing & Subscriptions', risk: 'High',
        permissions: [
            { id: 'bil_view', name: 'View Revenue', type: 'Read', dependsOn: null },
            { id: 'bil_edit', name: 'Modify Plans', type: 'Update', dependsOn: 'bil_view' },
            { id: 'bil_export', name: 'Export Reports', type: 'Export', dependsOn: 'bil_view' },
        ]
    }
];

// Provide some pre-checked mock configurations for the matrix based on Role
const ROLE_PERMISSIONS: Record<string, string[]> = {
    'r1': ['usr_view', 'usr_create', 'usr_edit', 'usr_delete', 'usr_suspend', 'usr_export', 'pst_view', 'pst_edit', 'pst_delete', 'pst_approve', 'sec_view', 'sec_roles', 'sec_policy', 'bil_view', 'bil_edit', 'bil_export'],
    'r3': ['usr_view', 'usr_suspend', 'pst_view', 'pst_edit', 'pst_delete', 'pst_approve'],
    'r5': ['usr_view', 'usr_export', 'pst_view'],
};

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const RiskBadge = ({ risk }: { risk: string }) => {
    switch (risk) {
        case 'High': return <span className="px-2 py-0.5 bg-[#F91880]/10 text-[#F91880] border border-[#F91880]/20 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> High Risk</span>;
        case 'Medium': return <span className="px-2 py-0.5 bg-[#FFD400]/10 text-[#FFD400] border border-[#FFD400]/20 rounded text-[11px] font-bold uppercase tracking-wider">Medium Risk</span>;
        default: return <span className="px-2 py-0.5 bg-[#00BA7C]/10 text-[#00BA7C] border border-[#00BA7C]/20 rounded text-[11px] font-bold uppercase tracking-wider">Low Risk</span>;
    }
};

const TypeBadge = ({ type }: { type: string }) => {
    const colors: Record<string, string> = {
        'Read': 'text-[#1D9BF0] bg-[#1D9BF0]/10 border-[#1D9BF0]/20',
        'Write': 'text-[#00BA7C] bg-[#00BA7C]/10 border-[#00BA7C]/20',
        'Update': 'text-[#FFD400] bg-[#FFD400]/10 border-[#FFD400]/20',
        'Delete': 'text-[#F91880] bg-[#F91880]/10 border-[#F91880]/20',
        'Approve': 'text-[#8247E5] bg-[#8247E5]/10 border-[#8247E5]/20',
        'Export': 'text-[#E7E9EA] bg-[#333639] border-[#71767B]',
        'Configure': 'text-[#F91880] bg-[#F91880]/10 border-[#F91880]/20',
    };
    return <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${colors[type] || 'text-[#71767B] bg-[#16181C] border-[#2F3336]'}`}>{type}</span>;
}

// ==========================================
// MAIN PAGE CONTENT
// ==========================================

export default function RBACConsolePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<string>('r3'); // Moderator default
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['cat_users', 'cat_posts', 'cat_security']);

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState(1);

    // Matrix State
    const [matrixState, setMatrixState] = useState<Record<string, boolean>>(
        ROLE_PERMISSIONS['r3'].reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
    );
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const activeRole = ROLES.find(r => r.id === selectedRoleId);
    const isEditingSystemRole = activeRole?.isSystem;

    // Handlers
    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const handlePermissionToggle = (permId: string, checked: boolean, categoryId: string) => {
        if (isEditingSystemRole && selectedRoleId === 'r1') return; // Super Admin locked

        const newState = { ...matrixState };
        newState[permId] = checked;

        // Auto-enable dependencies if checking
        if (checked) {
            const perm = PERMISSION_CATEGORIES.find(c => c.id === categoryId)?.permissions.find(p => p.id === permId);
            if (perm?.dependsOn) {
                newState[perm.dependsOn] = true;
            }
        } else {
            // If unchecking, uncheck all that depend on this
            const category = PERMISSION_CATEGORIES.find(c => c.id === categoryId);
            category?.permissions.forEach(p => {
                if (p.dependsOn === permId) newState[p.id] = false;
            });
        }

        setMatrixState(newState);
        setHasUnsavedChanges(true);
    };

    const loadRole = (id: string) => {
        if (hasUnsavedChanges && !confirm("You have unsaved changes. Discard?")) return;

        setSelectedRoleId(id);
        const permSet = ROLE_PERMISSIONS[id] || [];
        setMatrixState(permSet.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}));
        setHasUnsavedChanges(false);
    };

    // ==========================================
    // MODAL COMPONENTS
    // ==========================================
    const CreateRoleWizard = () => {
        if (!isCreateModalOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-[600px] bg-[#16181C] border border-[#2F3336] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#000000]">
                        <h3 className="text-[18px] font-bold text-[#E7E9EA]">Create Custom Role</h3>
                        <button onClick={() => setIsCreateModalOpen(false)} className="text-[#71767B] hover:text-[#E7E9EA]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 flex-1 bg-[#16181C]">
                        {createStep === 1 ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div>
                                    <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Role Name</label>
                                    <input type="text" placeholder="e.g. Content Reviewer" className="w-full bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D9BF0]" />
                                </div>
                                <div>
                                    <label className="block text-[13px] font-bold text-[#E7E9EA] mb-2">Description</label>
                                    <textarea rows={3} placeholder="What can this role do?" className="w-full bg-[#000000] border border-[#2F3336] text-[#E7E9EA] rounded-lg px-4 py-2.5 outline-none focus:border-[#1D9BF0]"></textarea>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 animate-in fade-in slide-in-from-right-4 text-center">
                                <CheckCircle2 className="w-16 h-16 text-[#00BA7C] mb-4" />
                                <h4 className="text-[18px] font-bold text-[#E7E9EA] mb-2">Role Initialized</h4>
                                <p className="text-[14px] text-[#71767B]">The core structure has been created. Continuing will open the Permission Matrix so you can explicitly define access limits for this new custom role.</p>
                            </div>
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-[#2F3336] flex justify-between bg-[#000000]">
                        <button onClick={() => createStep === 2 ? setCreateStep(1) : setIsCreateModalOpen(false)} className="px-5 py-2 text-[#E7E9EA] font-bold text-[13px] hover:bg-[#2F3336] rounded-full">
                            {createStep === 2 ? 'Back' : 'Cancel'}
                        </button>
                        <button onClick={() => createStep === 1 ? setCreateStep(2) : setIsCreateModalOpen(false)} className="px-6 py-2 bg-[#E7E9EA] text-black font-bold text-[13px] hover:bg-white rounded-full">
                            {createStep === 1 ? 'Next: Define Permissions' : 'Go to Permission Matrix'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const AuditLogsModal = () => {
        if (!isAuditModalOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-[80vw] max-w-[1000px] h-[80vh] bg-[#16181C] border border-[#2F3336] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#000000]">
                        <div>
                            <h3 className="text-[18px] font-bold text-[#E7E9EA]">RBAC Audit Logs</h3>
                            <p className="text-[13px] text-[#71767B]">Immutable ledger of permission boundaries and role assignments.</p>
                        </div>
                        <button onClick={() => setIsAuditModalOpen(false)} className="text-[#71767B] hover:text-[#E7E9EA]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#16181C]">
                        <table className="w-full text-left text-[13px] whitespace-nowrap">
                            <thead className="bg-[#000000] text-[#71767B] font-bold text-[11px] uppercase tracking-wider border-b border-[#2F3336] sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-3">Timestamp</th>
                                    <th className="px-5 py-3">Admin</th>
                                    <th className="px-5 py-3">Action Type</th>
                                    <th className="px-5 py-3">Role Affected</th>
                                    <th className="px-5 py-3">Delta / Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2F3336]">
                                <tr className="hover:bg-[#202327] transition-colors">
                                    <td className="px-5 py-3 font-mono text-[#71767B]">2026-02-27 10:14</td>
                                    <td className="px-5 py-3 font-semibold text-[#E7E9EA]">Sarah C.</td>
                                    <td className="px-5 py-3"><span className="px-2 py-0.5 bg-[#FFD400]/10 text-[#FFD400] border border-[#FFD400]/20 rounded text-[10px] font-bold uppercase tracking-wider">Update Perm</span></td>
                                    <td className="px-5 py-3 text-[#E7E9EA]">Moderator</td>
                                    <td className="px-5 py-3 font-mono text-[11px] text-[#00BA7C]">+ pst_delete, + pst_edit</td>
                                </tr>
                                <tr className="hover:bg-[#202327] transition-colors">
                                    <td className="px-5 py-3 font-mono text-[#71767B]">2026-02-26 14:02</td>
                                    <td className="px-5 py-3 font-semibold text-[#E7E9EA]">System</td>
                                    <td className="px-5 py-3"><span className="px-2 py-0.5 bg-[#1D9BF0]/10 text-[#1D9BF0] border border-[#1D9BF0]/20 rounded text-[10px] font-bold uppercase tracking-wider">Assign Role</span></td>
                                    <td className="px-5 py-3 text-[#E7E9EA]">Support Spec.</td>
                                    <td className="px-5 py-3 font-mono text-[11px] text-[#E7E9EA]">Granted to User ID: 49921</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const UserAssignmentModal = () => {
        if (!isAssignModalOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-[500px] bg-[#16181C] border border-[#2F3336] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#2F3336] flex items-center justify-between bg-[#000000]">
                        <div>
                            <h3 className="text-[18px] font-bold text-[#E7E9EA]">Assign Users to Role</h3>
                            <p className="text-[13px] text-[#71767B]">Role: {activeRole?.name}</p>
                        </div>
                        <button onClick={() => setIsAssignModalOpen(false)} className="text-[#71767B] hover:text-[#E7E9EA]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 flex-1">
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71767B]" />
                            <input type="text" placeholder="Search by name, email, or user ID..." className="w-full bg-[#000000] border border-[#2F3336] text-[13px] text-[#E7E9EA] rounded-md py-2.5 pl-9 pr-3 outline-none focus:border-[#1D9BF0] transition-colors" />
                        </div>
                        <div className="border border-[#2F3336] rounded-md overflow-hidden bg-[#000000]">
                            <div className="flex items-center justify-between p-3 border-b border-[#2F3336] hover:bg-[#16181C] cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="accent-[#1D9BF0] w-4 h-4" />
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-[#E7E9EA]">David Chen</span>
                                        <span className="text-[11px] text-[#71767B]">david.chen@devatlas.com</span>
                                    </div>
                                </div>
                                <span className="bg-[#2F3336] text-[#71767B] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Current: User</span>
                            </div>
                            <div className="flex items-center justify-between p-3 border-b border-[#2F3336] hover:bg-[#16181C] cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" className="accent-[#1D9BF0] w-4 h-4" />
                                    <div className="flex flex-col">
                                        <span className="text-[13px] font-bold text-[#E7E9EA]">Emily R.</span>
                                        <span className="text-[11px] text-[#71767B]">emily@devatlas.com</span>
                                    </div>
                                </div>
                                <span className="bg-[#2F3336] text-[#71767B] text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Current: User</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-[#FFD400]/10 border border-[#FFD400]/20 rounded-md flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-[#FFD400] shrink-0 mt-0.5" />
                            <p className="text-[12px] text-[#FFD400] leading-snug">Note: If a user currently holds another high-privilege role, assigning this will <strong>replace</strong> their previous primary role.</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 border-t border-[#2F3336] flex justify-end gap-3 bg-[#000000]">
                        <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-[#E7E9EA] font-bold text-[13px] hover:bg-[#2F3336] rounded-full">Cancel</button>
                        <button onClick={() => setIsAssignModalOpen(false)} className="px-5 py-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white font-bold text-[13px] rounded-full transition-colors shadow-sm">Confirm Assignment</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[100vh] bg-[#000000] text-[#E7E9EA] overflow-hidden font-display">

            <style dangerouslySetInnerHTML={{
                __html: `
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #2F3336; border-radius: 4px; }
                ::-webkit-scrollbar-thumb:hover { background: #71767B; }
                `
            }} />

            {isCreateModalOpen && <CreateRoleWizard />}
            {isAuditModalOpen && <AuditLogsModal />}
            {isAssignModalOpen && <UserAssignmentModal />}

            {/* TOP HEADER */}
            <div className="h-[72px] px-6 border-b border-[#2F3336] bg-[#000000] z-20 shrink-0 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[#1D9BF0]" />
                        <h1 className="text-[20px] font-bold tracking-tight text-[#E7E9EA]">Access Control (RBAC)</h1>
                        <span className="px-2 py-0.5 bg-[#00BA7C]/10 text-[#00BA7C] border border-[#00BA7C]/20 rounded-full text-[11px] font-bold uppercase tracking-wider ml-2">Production</span>
                    </div>
                    <p className="text-[#71767B] text-[13px] mt-0.5 font-medium">Manage enterprise roles and granular permission sets.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsAuditModalOpen(true)} className="flex items-center gap-2 text-[#71767B] hover:text-[#E7E9EA] text-[13px] font-semibold transition-colors">
                        <Eye className="w-4 h-4" /> Audit Logs
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white rounded-md text-[13px] font-bold transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> Create Custom Role
                    </button>
                </div>
            </div>

            {/* THREE PANEL LAYOUT */}
            <div className="flex-1 flex overflow-hidden">

                {/* 1. LEFT PANEL - ROLES LIST */}
                <div className="w-[300px] border-r border-[#2F3336] bg-[#16181C] flex flex-col shrink-0 z-10">
                    <div className="p-4 border-b border-[#2F3336]">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71767B]" />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-[#000000] border border-[#2F3336] text-[13px] text-[#E7E9EA] rounded-md py-2 pl-9 pr-3 outline-none focus:border-[#1D9BF0] transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto py-2">
                        {ROLES.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())).map(role => (
                            <button
                                key={role.id}
                                onClick={() => loadRole(role.id)}
                                className={`w-full text-left px-4 py-3 border-l-2 transition-all group ${selectedRoleId === role.id
                                    ? 'bg-[#1D9BF0]/10 border-[#1D9BF0]'
                                    : 'border-transparent hover:bg-[#202327]'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-1.5">
                                        {role.isSystem && <Lock className="w-3 h-3 text-[#71767B]" />}
                                        <span className={`text-[14px] font-bold ${selectedRoleId === role.id ? 'text-[#1D9BF0]' : 'text-[#E7E9EA]'}`}>{role.name}</span>
                                    </div>
                                    {role.risk === 'High' && <div className="w-2 h-2 rounded-full bg-[#F91880] mt-1.5"></div>}
                                </div>
                                <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#71767B]">
                                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {role.users} assigned</span>
                                    {!role.isSystem && <span className="bg-[#2F3336] px-1.5 rounded text-[10px] uppercase font-bold text-[#E7E9EA]">Custom</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. CENTER PANEL - PERMISSION MATRIX */}
                <div className="flex-1 overflow-y-auto bg-[#000000] relative">
                    <div className="p-8 pb-32 max-w-auto mx-auto">

                        <div className="mb-6 flex flex-col gap-2">
                            <h2 className="text-[18px] font-bold text-[#E7E9EA] flex items-center gap-2">
                                Permission Matrix: <span className="text-[#1D9BF0]">{activeRole?.name}</span>
                                {activeRole?.id === 'r1' && <span className="text-[#F91880] text-[12px] ml-2 px-2 py-0.5 bg-[#F91880]/10 border border-[#F91880]/20 rounded font-mono">LOCKED</span>}
                            </h2>
                            {isEditingSystemRole && activeRole?.id !== 'r1' && (
                                <div className="p-3 bg-[#1D9BF0]/5 border border-[#1D9BF0]/20 rounded-md flex items-start gap-2">
                                    <Info className="w-4 h-4 text-[#1D9BF0] shrink-0 mt-0.5" />
                                    <p className="text-[13px] text-[#E7E9EA]">This is a <strong className="text-[#1D9BF0]">System Role</strong>. Core permissions cannot be removed, but additional custom privileges can be granted.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {PERMISSION_CATEGORIES.map(category => {
                                const isExpanded = expandedCategories.includes(category.id);
                                const checkCount = category.permissions.filter(p => matrixState[p.id]).length;

                                return (
                                    <div key={category.id} className="border border-[#2F3336] bg-[#16181C] rounded-xl overflow-hidden shadow-sm">
                                        <div
                                            className="px-5 py-3.5 bg-[#16181C] flex items-center justify-between cursor-pointer hover:bg-[#202327] transition-colors"
                                            onClick={() => toggleCategory(category.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? <ChevronDown className="w-4 h-4 text-[#71767B]" /> : <ChevronRight className="w-4 h-4 text-[#71767B]" />}
                                                <span className="text-[14px] font-bold text-[#E7E9EA]">{category.name}</span>
                                                {category.risk === 'High' && <span className="w-2 h-2 rounded-full bg-[#F91880]" title="Contains high-risk operations"></span>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[12px] font-mono text-[#71767B]">{checkCount} / {category.permissions.length}</span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="border-t border-[#2F3336] bg-[#000000]">
                                                <table className="w-full text-left text-[13px]">
                                                    <thead className="text-[#71767B] font-bold text-[11px] uppercase tracking-wider border-b border-[#2F3336]">
                                                        <tr>
                                                            <th className="px-5 py-2 w-[40px]"></th>
                                                            <th className="px-5 py-2">Permission ID</th>
                                                            <th className="px-5 py-2">Capability</th>
                                                            <th className="px-5 py-2">Type</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#2F3336]">
                                                        {category.permissions.map(perm => {
                                                            const isChecked = !!matrixState[perm.id];
                                                            // Super Admin is rigidly locked
                                                            const isDisabled = activeRole?.id === 'r1';

                                                            return (
                                                                <tr key={perm.id} className={`hover:bg-[#16181C]/50 transition-colors ${isChecked ? 'bg-[#1D9BF0]/5' : ''}`}>
                                                                    <td className="px-5 py-3 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="accent-[#1D9BF0] w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            checked={isChecked}
                                                                            disabled={isDisabled}
                                                                            onChange={(e) => handlePermissionToggle(perm.id, e.target.checked, category.id)}
                                                                        />
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-[#E7E9EA]">{perm.name}</span>
                                                                            {perm.dependsOn && (
                                                                                <div className="flex items-center gap-1 text-[11px] text-[#71767B] mt-0.5 font-mono">
                                                                                    <CornerDownRight className="w-3 h-3" /> Req: {perm.dependsOn}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <span className="font-mono text-[11px] text-[#71767B] bg-[#2F3336]/50 px-2 py-1 rounded">{perm.id}</span>
                                                                    </td>
                                                                    <td className="px-5 py-3">
                                                                        <TypeBadge type={perm.type} />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. RIGHT PANEL - ROLE DETAILS */}
                <div className="w-[320px] bg-[#16181C] border-l border-[#2F3336] flex flex-col shrink-0 z-10">
                    <div className="p-6 border-b border-[#2F3336]">
                        <h3 className="text-[16px] font-bold text-[#E7E9EA] mb-4">Role Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-[#71767B] uppercase tracking-wider mb-1">Role Name</label>
                                <div className="text-[15px] font-bold text-[#E7E9EA] flex items-center justify-between">
                                    {activeRole?.name}
                                    {!activeRole?.isSystem && <button className="text-[#1D9BF0] hover:underline text-[12px]">Edit</button>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-[#71767B] uppercase tracking-wider mb-1">Description</label>
                                <p className="text-[13px] text-[#E7E9EA] leading-snug">{activeRole?.desc}</p>
                            </div>

                            <div className="pt-2">
                                <label className="block text-[11px] font-bold text-[#71767B] uppercase tracking-wider mb-2">Privilege Risk</label>
                                <RiskBadge risk={activeRole?.risk || 'Low'} />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[14px] font-bold text-[#E7E9EA]">Assigned Users ({activeRole?.users})</h3>
                            <button onClick={() => setIsAssignModalOpen(true)} className="text-[#1D9BF0] hover:underline text-[13px] font-bold">Manage</button>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 border border-[#2F3336] rounded-md bg-[#000000]">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#1D9BF0]/20 flex items-center justify-center text-[10px] font-bold text-[#1D9BF0]">AJ</div>
                                    <div className="text-[13px] text-[#E7E9EA] font-medium">Alan Jones</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-[#2F3336] rounded-md bg-[#000000]">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-[#00BA7C]/20 flex items-center justify-center text-[10px] font-bold text-[#00BA7C]">MS</div>
                                    <div className="text-[13px] text-[#E7E9EA] font-medium">Maria S.</div>
                                </div>
                            </div>
                            {activeRole?.users && activeRole.users > 2 && (
                                <button className="w-full py-2 text-center text-[#71767B] text-[12px] font-bold hover:text-[#E7E9EA]">View all {activeRole.users} users...</button>
                            )}
                        </div>

                        <div className="border-t border-[#2F3336] mt-6 pt-6 space-y-3">
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#000000] border border-[#2F3336] rounded-md text-[13px] font-bold text-[#E7E9EA] hover:bg-[#202327] transition-colors">
                                <Eye className="w-4 h-4 text-[#71767B]" /> Preview as Role
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#000000] border border-[#2F3336] rounded-md text-[13px] font-bold text-[#E7E9EA] hover:bg-[#202327] transition-colors">
                                <Copy className="w-4 h-4 text-[#71767B]" /> Duplicate Role
                            </button>
                            {!activeRole?.isSystem && (
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#F91880]/5 border border-[#F91880]/20 rounded-md text-[13px] font-bold text-[#F91880] hover:bg-[#F91880]/10 transition-colors mt-2">
                                    <Trash2 className="w-4 h-4" /> Delete Role
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* STICKY SAVE BAR */}
                {hasUnsavedChanges && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#16181C] border border-[#2F3336] px-6 py-4 rounded-full shadow-2xl flex items-center justify-between gap-8 min-w-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300 z-50">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="w-5 h-5 text-[#FFD400]" />
                            <div>
                                <span className="block text-[14px] font-bold text-[#E7E9EA]">Unsaved permission changes</span>
                                <span className="block text-[12px] text-[#71767B]">Review capabilities carefully before saving.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => loadRole(selectedRoleId)} className="px-4 py-2 text-[13px] font-bold text-[#E7E9EA] hover:bg-[#2F3336] rounded-full transition-colors">Discard</button>
                            <button onClick={() => setHasUnsavedChanges(false)} className="px-6 py-2 bg-[#1D9BF0] text-white text-[13px] font-bold rounded-full flex items-center gap-2 hover:bg-[#1A8CD8] shadow-[0_0_15px_rgba(29,155,240,0.3)] transition-all">
                                <Save className="w-4 h-4" /> Commit Matrix
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

