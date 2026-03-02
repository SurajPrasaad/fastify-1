"use client";

import React, { useMemo, useState } from "react";
import {
    AlertTriangle,
    ArrowUpRight,
    Check,
    Download,
    Info,
    Lock,
    RefreshCw,
    Shield,
    ShieldAlert,
    User,
} from "lucide-react";

type CoreRole = "User" | "Moderator" | "Admin" | "Super Admin";

type PermissionFeature =
    | "User Management"
    | "Content Moderation"
    | "Content Override"
    | "Suspension Control"
    | "Permanent Ban"
    | "Appeals Management"
    | "Risk Configuration"
    | "Analytics Access"
    | "System Settings"
    | "Security & Compliance"
    | "API Management"
    | "Role Management";

type PermissionAction =
    | "View"
    | "Create"
    | "Edit"
    | "Delete"
    | "Approve"
    | "Override"
    | "Export";

interface PermissionCellMeta {
    feature: PermissionFeature;
    action: PermissionAction;
    risk: "Safe" | "Sensitive" | "Critical";
    description: string;
}

const FEATURES: PermissionFeature[] = [
    "User Management",
    "Content Moderation",
    "Content Override",
    "Suspension Control",
    "Permanent Ban",
    "Appeals Management",
    "Risk Configuration",
    "Analytics Access",
    "System Settings",
    "Security & Compliance",
    "API Management",
    "Role Management",
];

const ACTIONS: PermissionAction[] = [
    "View",
    "Create",
    "Edit",
    "Delete",
    "Approve",
    "Override",
    "Export",
];

const RISK_COLORS: Record<PermissionCellMeta["risk"], string> = {
    Safe: "border-[#16a34a]/40 bg-[#022c22] text-[#bbf7d0]",
    Sensitive: "border-[#eab308]/40 bg-[#422006] text-[#fef9c3]",
    Critical: "border-[#b91c1c]/60 bg-[#450a0a] text-[#fecaca]",
};

const ROLE_BADGE_COLORS: Record<CoreRole, string> = {
    User: "bg-[#111827] text-[#9ca3af] border-[#1f2937]",
    Moderator: "bg-[#0b1120] text-[#38bdf8] border-[#1d4ed8]",
    Admin: "bg-[#111827] text-[#6366f1] border-[#4f46e5]",
    "Super Admin": "bg-[#1f2937] text-[#f97373] border-[#b91c1c]",
};

const CELL_META: PermissionCellMeta[] = [
    {
        feature: "User Management",
        action: "View",
        risk: "Safe",
        description: "View user profiles, basic metadata, and status.",
    },
    {
        feature: "User Management",
        action: "Edit",
        risk: "Sensitive",
        description: "Modify user attributes such as profile flags or labels.",
    },
    {
        feature: "Permanent Ban",
        action: "Approve",
        risk: "Critical",
        description:
            "Authorize permanent account bans and irreversible enforcement actions.",
    },
    {
        feature: "Role Management",
        action: "Override",
        risk: "Critical",
        description:
            "Override inherited role permissions and create custom capability mappings.",
    },
];

const AUDIT_ROWS = [
    {
        role: "Moderator",
        permission: "Content Moderation → Override",
        oldValue: "Disabled",
        newValue: "Enabled",
        modifiedBy: "Alex (Super Admin)",
        timestamp: "2026-03-02 09:14 UTC",
        ip: "10.12.4.23",
        device: "macOS • Chrome",
    },
    {
        role: "Admin",
        permission: "Permanent Ban → Approve",
        oldValue: "Enabled",
        newValue: "Disabled",
        modifiedBy: "Alex (Super Admin)",
        timestamp: "2026-03-01 17:03 UTC",
        ip: "10.12.4.11",
        device: "Windows • Edge",
    },
];

function getCellMeta(feature: PermissionFeature, action: PermissionAction) {
    return (
        CELL_META.find(
            (m) => m.feature === feature && m.action === action,
        ) ?? {
            feature,
            action,
            risk: "Safe" as const,
            description: `${action} access for ${feature}.`,
        }
    );
}

export default function SuperAdminModeratorsPermissions() {
    const [selectedRole, setSelectedRole] = useState<CoreRole>("Moderator");
    const [selectedCell, setSelectedCell] = useState<PermissionCellMeta | null>(
        null,
    );

    const [pendingChanges] = useState(3);

    const effectiveRiskSummary = useMemo(
        () => ({
            affectedUsers: selectedRole === "User" ? 124_200 : 34,
            elevatedPrivileges: selectedRole === "Moderator" ? 4 : 12,
            enforcementControls: selectedRole === "Super Admin" ? 7 : 3,
        }),
        [selectedRole],
    );

    return (
        <div className="flex-1 flex flex-col bg-black text-[#E7E9EA] h-screen font-display overflow-hidden">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #2F3336; border-radius: 4px; }
          ::-webkit-scrollbar-thumb:hover { background: #71767B; }
        `,
                }}
            />

            <div className="px-6 py-4 border-b border-[#2F3336] bg-black/90 backdrop-blur-md shrink-0 sticky top-0 z-20 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-[20px] font-bold tracking-[-0.02em] flex items-center gap-2">
                        <Shield className="w-5 h-5 text-[#38bdf8]" />
                        Assign Permissions
                    </h1>
                    <p className="text-[13px] text-[#71767B] mt-0.5">
                        Manage role-based access control (RBAC) across the moderation stack.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#050816] border border-[#1F2937] hover:bg-[#111827]"
                    >
                        <Shield className="w-4 h-4 text-[#9CA3AF]" />
                        Create Custom Role
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#050816] border border-[#1F2937] hover:bg-[#111827]"
                    >
                        <ArrowUpRight className="w-4 h-4 text-[#9CA3AF]" />
                        Clone Role
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#050816] border border-[#1F2937] hover:bg-[#111827]"
                    >
                        <Download className="w-4 h-4 text-[#9CA3AF]" />
                        Export Permissions
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#22c55e] text-black hover:bg-[#4ade80]"
                    >
                        Save Changes
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#1F2937] text-[#9CA3AF] hover:bg-[#111827]"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#451a03]/60 border border-[#f97316]/50 text-[11px] font-mono text-[#fed7aa]">
                        System-Level Access Configuration
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                    Role Selection
                                </p>
                                <p className="text-[11px] text-[#9CA3AF]">
                                    Choose the role you want to configure.
                                </p>
                            </div>
                        </div>
                        <select
                            value={selectedRole}
                            onChange={(e) =>
                                setSelectedRole(e.target.value as CoreRole)
                            }
                            className="mt-1 w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                        >
                            <option>User</option>
                            <option>Moderator</option>
                            <option>Admin</option>
                            <option>Super Admin</option>
                        </select>
                        <div className="mt-2 border border-[#1F2937] rounded-xl bg-[#020617] p-3 flex items-center gap-3">
                            <div
                                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_BADGE_COLORS[selectedRole]}`}
                            >
                                {selectedRole}
                            </div>
                            <div className="flex-1 text-[11px] text-[#9CA3AF] space-y-1">
                                <p>
                                    Assigned users:{" "}
                                    <span className="text-[#E5E7EB]">
                                        {selectedRole === "User"
                                            ? "124,203"
                                            : selectedRole === "Moderator"
                                            ? "42"
                                            : selectedRole === "Admin"
                                            ? "9"
                                            : "3"}
                                    </span>
                                </p>
                                <p>
                                    Privilege level:{" "}
                                    <span className="text-[#E5E7EB]">
                                        {selectedRole === "User"
                                            ? "Minimal"
                                            : selectedRole === "Moderator"
                                            ? "Operational enforcement"
                                            : selectedRole === "Admin"
                                            ? "Organizational control"
                                            : "System-wide authority"}
                                    </span>
                                </p>
                            </div>
                            <ShieldAlert className="w-4 h-4 text-[#f97373]" />
                        </div>
                    </div>

                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[#E5E7EB]">
                            Permission Inheritance
                        </p>
                        <p className="text-[11px] text-[#9CA3AF] mb-1">
                            Roles inherit from lower tiers; overrides are highlighted.
                        </p>
                        <div className="mt-1 border border-[#1F2937] rounded-xl bg-[#020617] p-3 text-[11px] text-[#E5E7EB]">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                    <ShieldAlert className="w-3.5 h-3.5 text-[#f97373]" />
                                    <span>Super Admin</span>
                                </div>
                                <div className="ml-5 border-l border-dashed border-[#1F2937] pl-3 py-1">
                                    <div className="flex items-center gap-1">
                                        <Shield className="w-3.5 h-3.5 text-[#6366f1]" />
                                        <span>Admin</span>
                                    </div>
                                    <div className="ml-5 border-l border-dashed border-[#1F2937] pl-3 py-1">
                                        <div className="flex items-center gap-1">
                                            <Shield className="w-3.5 h-3.5 text-[#38bdf8]" />
                                            <span>Moderator</span>
                                        </div>
                                        <div className="ml-5 border-l border-dashed border-[#1F2937] pl-3 py-1">
                                            <div className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-[#9ca3af]" />
                                                <span>User</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col gap-2">
                        <p className="text-[12px] font-semibold text-[#E5E7EB]">
                            Change Impact Preview
                        </p>
                        <p className="text-[11px] text-[#9CA3AF]">
                            Summary of how pending changes affect the system.
                        </p>
                        <div className="mt-2 border border-[#1F2937] rounded-xl bg-[#020617] p-3 text-[11px] text-[#D1D5DB] space-y-1.5">
                            <p>
                                This update will affect{" "}
                                <span className="font-semibold">
                                    {effectiveRiskSummary.affectedUsers.toLocaleString()}
                                </span>{" "}
                                users of role {selectedRole}.
                            </p>
                            <p>
                                Elevated privileges changed:{" "}
                                <span className="font-semibold">
                                    {effectiveRiskSummary.elevatedPrivileges}
                                </span>
                                .
                            </p>
                            <p>
                                Enforcement controls touched:{" "}
                                <span className="font-semibold">
                                    {effectiveRiskSummary.enforcementControls}
                                </span>
                                .
                            </p>
                            <p className="pt-1 text-[#fef9c3] flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                                <span>
                                    All RBAC changes are logged with IP, device fingerprint, and
                                    actor identity.
                                </span>
                            </p>
                        </div>
                        <p className="mt-1 text-[11px] text-[#9CA3AF]">
                            Pending changes:{" "}
                            <span className="font-semibold text-[#E5E7EB]">
                                {pendingChanges}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="bg-[#050816] border border-[#1F2937] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                Permission Matrix
                            </p>
                            <p className="text-[11px] text-[#9CA3AF]">
                                Toggle capabilities per feature and action. Some critical
                                permissions are locked.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#16a34a]/40 bg-[#022c22] text-[#bbf7d0]">
                                <Check className="w-3 h-3" />
                                Safe
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#eab308]/40 bg-[#422006] text-[#fef9c3]">
                                <AlertTriangle className="w-3 h-3" />
                                Sensitive
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#b91c1c]/60 bg-[#450a0a] text-[#fecaca]">
                                <ShieldAlert className="w-3 h-3" />
                                Critical
                            </span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-[11px] border-collapse">
                            <thead>
                                <tr className="bg-[#020617] border-b border-[#1F2937]">
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold min-w-[180px]">
                                        Feature
                                    </th>
                                    {ACTIONS.map((action) => (
                                        <th
                                            key={action}
                                            className="px-3 py-2 text-center text-[#9CA3AF] font-semibold"
                                        >
                                            {action}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {FEATURES.map((feature) => (
                                    <tr
                                        key={feature}
                                        className="border-b border-[#111827] hover:bg-[#020617]"
                                    >
                                        <td className="px-3 py-2 text-[#E5E7EB] text-left">
                                            {feature}
                                        </td>
                                        {ACTIONS.map((action) => {
                                            const meta = getCellMeta(feature, action);
                                            const isLocked =
                                                selectedRole === "Super Admin" ||
                                                (meta.risk === "Critical" &&
                                                    selectedRole !== "Admin");
                                            const baseAllowed =
                                                selectedRole === "Super Admin"
                                                    ? true
                                                    : selectedRole === "Admin"
                                                    ? meta.risk !== "Critical"
                                                    : selectedRole === "Moderator"
                                                    ? feature === "Content Moderation" &&
                                                      (action === "View" ||
                                                          action === "Approve")
                                                    : action === "View" &&
                                                      (feature === "Analytics Access" ||
                                                          feature === "Content Moderation");

                                            return (
                                                <td
                                                    key={action}
                                                    className="px-3 py-2 text-center align-middle"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            !isLocked &&
                                                            setSelectedCell(meta)
                                                        }
                                                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md border text-[10px] ${
                                                            baseAllowed
                                                                ? RISK_COLORS[meta.risk]
                                                                : "bg-[#020617] border-[#1f2937] text-[#4b5563]"
                                                        } ${isLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-[#e5e7eb]/60"}`}
                                                        title={
                                                            isLocked
                                                                ? "Locked by system or higher role."
                                                                : `${meta.feature} → ${meta.action}`
                                                        }
                                                    >
                                                        {baseAllowed ? (
                                                            <Check className="w-3 h-3" />
                                                        ) : (
                                                            <Lock className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedCell && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSelectedCell(null)}
                        />
                        <div className="relative w-full max-w-[420px] bg-black border-l border-[#1F2937] h-full shadow-2xl flex flex-col">
                            <div className="px-5 py-4 border-b border-[#1F2937] bg-[#020617] flex items-center justify-between">
                                <div>
                                    <p className="text-[13px] font-semibold text-[#E5E7EB]">
                                        Permission Details
                                    </p>
                                    <p className="text-[11px] text-[#9CA3AF]">
                                        {selectedCell.feature} → {selectedCell.action}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCell(null)}
                                    className="w-7 h-7 rounded-full border border-[#1F2937] text-[#9CA3AF] hover:bg-[#111827]"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-[11px] text-[#D1D5DB]">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${RISK_COLORS[selectedCell.risk]}`}>
                                    <ShieldAlert className="w-3 h-3" />
                                    Risk level: {selectedCell.risk}
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">
                                        Permission description
                                    </p>
                                    <p>{selectedCell.description}</p>
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">
                                        Security impact
                                    </p>
                                    <p>
                                        Modifying this permission changes how the role interacts
                                        with{" "}
                                        <span className="font-semibold">
                                            {selectedCell.feature}
                                        </span>{" "}
                                        capabilities.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold mb-1">
                                        Related modules
                                    </p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        <li>Moderation service</li>
                                        <li>RBAC gateway</li>
                                        <li>Audit logging pipeline</li>
                                    </ul>
                                </div>
                                <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-3 flex gap-2">
                                    <Info className="w-4 h-4 text-[#38bdf8] mt-0.5" />
                                    <p>
                                        All changes to this permission will be written to Security
                                        &amp; Compliance → Audit Logs with actor, timestamp, IP, and
                                        device fingerprint.
                                    </p>
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-[#111827] bg-[#020617] flex items-center justify-between text-[11px] text-[#9CA3AF]">
                                <p className="flex items-start gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 text-[#f97373]" />
                                    <span>
                                        Granting critical permissions may impact platform governance
                                        and legal obligations.
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-[12px] font-semibold text-[#E5E7EB]">
                                Audit &amp; Change History
                            </p>
                            <p className="text-[11px] text-[#9CA3AF]">
                                RBAC modifications for roles and permissions.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937]"
                        >
                            <Download className="w-4 h-4" />
                            Export Audit Log
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-[11px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#1F2937] bg-[#020617]">
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        Role
                                    </th>
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        Permission Changed
                                    </th>
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        Old
                                    </th>
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        New
                                    </th>
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        Modified By
                                    </th>
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        Timestamp
                                    </th>
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        IP
                                    </th>
                                    <th className="px-3 py-2 text-left text-[#9CA3AF] font-semibold">
                                        Device
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {AUDIT_ROWS.map((row) => (
                                    <tr
                                        key={`${row.role}-${row.permission}-${row.timestamp}`}
                                        className="border-b border-[#111827] hover:bg-[#020617]"
                                    >
                                        <td className="px-3 py-2 text-[#E5E7EB]">{row.role}</td>
                                        <td className="px-3 py-2 text-[#E5E7EB]">
                                            {row.permission}
                                        </td>
                                        <td className="px-3 py-2 text-[#9CA3AF]">{row.oldValue}</td>
                                        <td className="px-3 py-2 text-[#E5E7EB]">{row.newValue}</td>
                                        <td className="px-3 py-2 text-[#E5E7EB]">
                                            {row.modifiedBy}
                                        </td>
                                        <td className="px-3 py-2 text-[#9CA3AF]">
                                            {row.timestamp}
                                        </td>
                                        <td className="px-3 py-2 text-[#9CA3AF]">{row.ip}</td>
                                        <td className="px-3 py-2 text-[#9CA3AF]">{row.device}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}


