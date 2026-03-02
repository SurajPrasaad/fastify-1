"use client";

import React, { useMemo, useState } from "react";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  User,
  UserCheck,
  UserCog,
  UserMinus,
  Users,
  X,
} from "lucide-react";

type Role = "User" | "Moderator" | "Admin" | "Super Admin";
type Status = "Active" | "Suspended";
type RiskLevel = "Low" | "Medium" | "High";

interface RoleAssignment {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignedBy: string;
  assignedAt: string;
  lastChangedAt: string;
  risk: RiskLevel;
  status: Status;
}

const MOCK_ASSIGNMENTS: RoleAssignment[] = [
  {
    id: "USR-0001",
    name: "Alex Morgan",
    email: "alex.m@company.com",
    role: "Super Admin",
    assignedBy: "SYSTEM",
    assignedAt: "2023-01-10",
    lastChangedAt: "2023-01-10",
    risk: "Low",
    status: "Active",
  },
  {
    id: "USR-0242",
    name: "Priya Shah",
    email: "priya.shah@company.com",
    role: "Admin",
    assignedBy: "Alex Morgan",
    assignedAt: "2024-02-01",
    lastChangedAt: "2025-01-18",
    risk: "Medium",
    status: "Active",
  },
  {
    id: "USR-0789",
    name: "Jordan Lee",
    email: "jordan.lee@company.com",
    role: "Moderator",
    assignedBy: "Priya Shah",
    assignedAt: "2025-06-12",
    lastChangedAt: "2025-06-12",
    risk: "Low",
    status: "Active",
  },
  {
    id: "USR-1123",
    name: "Taylor Kim",
    email: "taylor.kim@example.com",
    role: "User",
    assignedBy: "SYSTEM",
    assignedAt: "2025-07-01",
    lastChangedAt: "2025-07-01",
    risk: "High",
    status: "Suspended",
  },
];

while (MOCK_ASSIGNMENTS.length < 32) {
  const base = MOCK_ASSIGNMENTS[MOCK_ASSIGNMENTS.length % 4]!;
  MOCK_ASSIGNMENTS.push({
    ...base,
    id: `USR-${1000 + MOCK_ASSIGNMENTS.length}`,
    email: base.email.replace("@", `+${MOCK_ASSIGNMENTS.length}@`),
  });
}

const tableStyles: TableStyles = {
  table: { style: { backgroundColor: "transparent" } },
  tableWrapper: { style: { backgroundColor: "transparent" } },
  headRow: {
    style: {
      backgroundColor: "#16181C",
      borderBottomColor: "#2F3336",
      borderBottomWidth: "1px",
      minHeight: "44px",
    },
  },
  headCells: {
    style: {
      fontSize: "11px",
      fontWeight: 700,
      color: "#71767B",
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      paddingLeft: "14px",
      paddingRight: "14px",
    },
  },
  rows: {
    style: {
      backgroundColor: "#000000",
      color: "#E7E9EA",
      borderBottomColor: "#2F3336",
      minHeight: "56px",
      fontFamily: "inherit",
      cursor: "pointer",
    },
    highlightOnHoverStyle: {
      backgroundColor: "#16181C",
      borderBottomColor: "#2F3336",
      outline: "none",
      transition: "all 0.15s ease",
    },
  },
  cells: {
    style: {
      paddingLeft: "14px",
      paddingRight: "14px",
    },
  },
  pagination: {
    style: {
      backgroundColor: "#000000",
      color: "#71767B",
      borderTopColor: "#2F3336",
      borderTopWidth: "1px",
      borderTopStyle: "solid",
      minHeight: "56px",
      fontFamily: "inherit",
      fontSize: "13px",
    },
  },
};

const roleBadgeClasses: Record<Role, string> = {
  User: "bg-[#111827] text-[#9CA3AF] border-[#1F2937]",
  Moderator: "bg-[#0B1120] text-[#38BDF8] border-[#1D4ED8]/50",
  Admin: "bg-[#111827] text-[#6366F1] border-[#4F46E5]/60",
  "Super Admin": "bg-[#1F2937] text-[#F97373] border-[#DC2626]/70",
};

const riskBadgeClasses: Record<RiskLevel, string> = {
  Low: "bg-[#064E3B] text-[#6EE7B7] border-[#10B981]/40",
  Medium: "bg-[#451A03] text-[#FBBF24] border-[#FBBF24]/40",
  High: "bg-[#450A0A] text-[#FCA5A5] border-[#EF4444]/60",
};

const RoleBadge = ({ role }: { role: Role }) => (
  <span
    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${roleBadgeClasses[role]}`}
  >
    {role === "User" && <User className="w-3 h-3" />}
    {role === "Moderator" && <Shield className="w-3 h-3" />}
    {role === "Admin" && <UserCog className="w-3 h-3" />}
    {role === "Super Admin" && <ShieldAlert className="w-3 h-3" />}
    {role}
  </span>
);

const RiskBadge = ({ risk }: { risk: RiskLevel }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${riskBadgeClasses[risk]}`}
  >
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 bg-current" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
    </span>
    {risk}
  </span>
);

const RoleOverviewCards = ({ data }: { data: RoleAssignment[] }) => {
  const totals = data.reduce(
    (acc, row) => {
      acc.total += 1;
      acc.byRole[row.role] += 1;
      return acc;
    },
    {
      total: 0,
      byRole: {
        User: 0,
        Moderator: 0,
        Admin: 0,
        "Super Admin": 0,
      } as Record<Role, number>,
    },
  );

  const cards = [
    {
      title: "Users",
      role: "User" as Role,
      icon: Users,
      color: "text-[#9CA3AF]",
    },
    {
      title: "Moderators",
      role: "Moderator" as Role,
      icon: Shield,
      color: "text-[#38BDF8]",
    },
    {
      title: "Admins",
      role: "Admin" as Role,
      icon: UserCog,
      color: "text-[#6366F1]",
    },
    {
      title: "Super Admins",
      role: "Super Admin" as Role,
      icon: ShieldAlert,
      color: "text-[#F97373]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-lg bg-[#020617] border border-[#1F2937] flex items-center justify-center ${card.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[24px] font-bold text-[#E5E7EB]">
                {totals.byRole[card.role]}
              </span>
              <span className="text-[11px] text-[#6B7280]">
                of {totals.total} accounts
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PermissionMatrix = () => {
  const rows = [
    {
      feature: "User Management",
      user: false,
      moderator: false,
      admin: true,
      superAdmin: true,
    },
    {
      feature: "Content Moderation",
      user: false,
      moderator: true,
      admin: true,
      superAdmin: true,
    },
    {
      feature: "Risk Settings",
      user: false,
      moderator: false,
      admin: false,
      superAdmin: true,
    },
    {
      feature: "System Settings",
      user: false,
      moderator: false,
      admin: true,
      superAdmin: true,
    },
    {
      feature: "Security & Audit Logs",
      user: false,
      moderator: false,
      admin: false,
      superAdmin: true,
    },
  ];

  const cell = (allowed: boolean, accent: string) =>
    allowed ? (
      <div className="flex items-center justify-center">
        <div
          className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-opacity-10 border ${accent}`}
        >
          <Check className="w-3 h-3" />
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-center text-[#4B5563]">
        <Lock className="w-3 h-3" />
      </div>
    );

  return (
    <div className="bg-[#050816] border border-[#1F2937] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-[#E5E7EB]">
            Permission Matrix
          </h3>
          <p className="text-[12px] text-[#9CA3AF]">
            High-level RBAC view by feature and role.
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-[12px]">
          <thead>
            <tr className="bg-[#020617] border-b border-[#1F2937]">
              <th className="px-4 py-2 text-[#9CA3AF] font-semibold min-w-[180px]">
                Feature
              </th>
              <th className="px-4 py-2 text-center text-[#9CA3AF] font-semibold">
                User
              </th>
              <th className="px-4 py-2 text-center text-[#38BDF8] font-semibold">
                Moderator
              </th>
              <th className="px-4 py-2 text-center text-[#6366F1] font-semibold">
                Admin
              </th>
              <th className="px-4 py-2 text-center text-[#F97373] font-semibold">
                Super Admin
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.feature}
                className="border-b border-[#111827] hover:bg-[#020617]"
              >
                <td className="px-4 py-2 text-[#E5E7EB]">{row.feature}</td>
                <td className="px-4 py-2">
                  {cell(row.user, "border-[#374151] bg-[#111827] text-[#9CA3AF]")}
                </td>
                <td className="px-4 py-2">
                  {cell(
                    row.moderator,
                    "border-[#0EA5E9]/70 bg-[#0B1120] text-[#38BDF8]",
                  )}
                </td>
                <td className="px-4 py-2">
                  {cell(
                    row.admin,
                    "border-[#4F46E5]/70 bg-[#020617] text-[#6366F1]",
                  )}
                </td>
                <td className="px-4 py-2">
                  {cell(
                    row.superAdmin,
                    "border-[#DC2626]/70 bg-[#1F2937] text-[#F97373]",
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RoleHistoryModal = ({
  open,
  onClose,
  assignment,
}: {
  open: boolean;
  onClose: () => void;
  assignment: RoleAssignment | null;
}) => {
  if (!open || !assignment) return null;

  const history = [
    {
      from: "Moderator",
      to: "Admin",
      by: "Alex Morgan",
      at: "2025-01-18 09:24 UTC",
      justification: "Elevated to admin for APAC trust & safety program.",
      ip: "52.14.120.11",
      device: "MacOS • Chrome",
      severity: "Medium",
    },
    {
      from: "User",
      to: "Moderator",
      by: "Priya Shah",
      at: "2024-05-03 14:02 UTC",
      justification: "Joined pilot moderator cohort.",
      ip: "10.12.4.23",
      device: "Windows • Edge",
      severity: "Low",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-black border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-[#E5E7EB]">
              Role History
            </h2>
            <p className="text-[12px] text-[#9CA3AF]">
              {assignment.name} • {assignment.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6B7280] hover:text-[#E5E7EB] hover:bg-[#111827]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[380px] overflow-y-auto space-y-4">
          {history.map((item) => (
            <div
              key={`${item.at}-${item.to}`}
              className="border border-[#1F2937] rounded-xl p-3 bg-[#020617]"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <RoleBadge role={item.from as Role} />
                  <ArrowUpRight className="w-3 h-3 text-[#6B7280]" />
                  <RoleBadge role={item.to as Role} />
                </div>
                <span className="text-[11px] text-[#9CA3AF] font-mono">
                  {item.at}
                </span>
              </div>
              <p className="text-[12px] text-[#9CA3AF] mb-2">
                Changed by <span className="text-[#E5E7EB]">{item.by}</span>
              </p>
              <p className="text-[12px] text-[#D1D5DB] mb-2 italic">
                “{item.justification}”
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                <span>
                  IP: <span className="font-mono">{item.ip}</span>
                </span>
                <span>{item.device}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#111827] border border-[#374151] text-[10px]">
                  <Shield className="w-3 h-3 text-[#9CA3AF]" />
                  Severity {item.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-[#111827] flex items-center justify-between">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
          >
            <Download className="w-3.5 h-3.5" />
            Export history
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#111827] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#1F2937]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const RoleAssignmentDrawer = ({
  open,
  onClose,
  assignment,
}: {
  open: boolean;
  onClose: () => void;
  assignment: RoleAssignment | null;
}) => {
  const [targetRole, setTargetRole] = useState<Role>("User");
  const [ack, setAck] = useState(false);

  React.useEffect(() => {
    if (assignment) {
      setTargetRole(assignment.role);
      setAck(false);
    }
  }, [assignment]);

  if (!open || !assignment) return null;

  const elevatingToHighPrivilege =
    targetRole === "Admin" || targetRole === "Super Admin";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="w-full max-w-[460px] bg-black border-l border-[#1F2937] h-full shadow-2xl relative flex flex-col">
        <div className="px-6 py-4 border-b border-[#1F2937] flex items-center justify-between bg-[#020617]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#E5E7EB] flex items-center gap-2">
              Change Role
              <span className="text-[11px] font-mono text-[#9CA3AF]">
                {assignment.id}
              </span>
            </h2>
            <p className="text-[12px] text-[#9CA3AF]">
              {assignment.name} • {assignment.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6B7280] hover:text-[#E5E7EB] hover:bg-[#111827]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[#111827] bg-[#020617] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center">
              <User className="w-5 h-5 text-[#E5E7EB]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#E5E7EB]">
                  {assignment.name}
                </span>
                <span className="text-[11px] text-[#9CA3AF]">
                  {assignment.status}
                </span>
              </div>
              <div className="mt-1">
                <RoleBadge role={assignment.role} />
              </div>
            </div>
          </div>
          <RiskBadge risk={assignment.risk} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <h3 className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em] mb-2">
              Select Role
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(["User", "Moderator", "Admin", "Super Admin"] as Role[]).map(
                (role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-[12px] ${
                      targetRole === role
                        ? "border-[#1D9BF0] bg-[#020617]"
                        : "border-[#1F2937] bg-[#020617] hover:bg-[#020617]/80"
                    }`}
                  >
                    <RoleBadge role={role} />
                    {targetRole === role && (
                      <Check className="w-3.5 h-3.5 text-[#1D9BF0]" />
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          {elevatingToHighPrivilege && (
            <div className="border border-[#7F1D1D] bg-[#450A0A]/60 rounded-xl p-3 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F97373] mt-0.5" />
                <div>
                  <p className="text-[12px] font-semibold text-[#FECACA]">
                    Privilege escalation warning
                  </p>
                  <p className="text-[11px] text-[#FCA5A5]">
                    Granting {targetRole} access includes sensitive controls.
                    Double‑check identity and business justification.
                  </p>
                </div>
              </div>
              <label className="flex items-start gap-2 text-[11px] text-[#FECACA]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                />
                <span>I understand this grants elevated system access.</span>
              </label>
            </div>
          )}

          <div>
            <h3 className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em] mb-2">
              Justification (required for Admin / Super Admin)
            </h3>
            <textarea
              rows={4}
              className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
              placeholder="Document why this user needs elevated access. This will be stored in the security audit log."
            />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#111827] bg-[#020617] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={elevatingToHighPrivilege && !ack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#1D9BF0] text-white hover:bg-[#3B82F6] disabled:bg-[#1F2937] disabled:text-[#6B7280]"
          >
            <ArrowUpRight className="w-4 h-4" />
            Confirm Change
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SuperAdminUsersRolesMatrix() {
  const [activeTab, setActiveTab] = useState<"assignments" | "matrix">(
    "assignments",
  );
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | Role>("All");
  const [selectedAssignment, setSelectedAssignment] =
    useState<RoleAssignment | null>(null);
  const [historyFor, setHistoryFor] = useState<RoleAssignment | null>(null);

  const filtered = useMemo(
    () =>
      MOCK_ASSIGNMENTS.filter((row) => {
        const matchesSearch =
          !search ||
          row.name.toLowerCase().includes(search.toLowerCase()) ||
          row.email.toLowerCase().includes(search.toLowerCase());
        const matchesRole =
          roleFilter === "All" || row.role === roleFilter;
        return matchesSearch && matchesRole;
      }),
    [search, roleFilter],
  );

  const columns: TableColumn<RoleAssignment>[] = [
    {
      name: "User",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col py-1 min-w-0">
          <span className="text-[13px] font-semibold text-[#E5E7EB] truncate">
            {row.name}
          </span>
          <span className="text-[11px] text-[#9CA3AF] truncate">
            {row.id}
          </span>
        </div>
      ),
      minWidth: "180px",
    },
    {
      name: "Email",
      selector: (row) => row.email,
      sortable: true,
      cell: (row) => (
        <span className="text-[12px] text-[#E5E7EB]">{row.email}</span>
      ),
      minWidth: "220px",
    },
    {
      name: "Current Role",
      selector: (row) => row.role,
      sortable: true,
      cell: (row) => <RoleBadge role={row.role} />,
      minWidth: "150px",
    },
    {
      name: "Assigned By",
      selector: (row) => row.assignedBy,
      sortable: true,
      cell: (row) => (
        <span className="text-[12px] text-[#E5E7EB]">{row.assignedBy}</span>
      ),
      minWidth: "140px",
    },
    {
      name: "Assigned Date",
      selector: (row) => row.assignedAt,
      sortable: true,
      cell: (row) => (
        <span className="text-[12px] text-[#9CA3AF] font-mono">
          {row.assignedAt}
        </span>
      ),
      minWidth: "120px",
    },
    {
      name: "Last Role Change",
      selector: (row) => row.lastChangedAt,
      sortable: true,
      cell: (row) => (
        <span className="text-[12px] text-[#9CA3AF] font-mono">
          {row.lastChangedAt}
        </span>
      ),
      minWidth: "120px",
    },
    {
      name: "Risk",
      selector: (row) => row.risk,
      sortable: true,
      cell: (row) => <RiskBadge risk={row.risk} />,
      minWidth: "120px",
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] border ${
            row.status === "Active"
              ? "bg-[#022C22] text-[#6EE7B7] border-[#10B981]/40"
              : "bg-[#450A0A] text-[#FCA5A5] border-[#EF4444]/50"
          }`}
        >
          {row.status === "Active" ? (
            <UserCheck className="w-3 h-3" />
          ) : (
            <UserMinus className="w-3 h-3" />
          )}
          {row.status}
        </span>
      ),
      minWidth: "110px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAssignment(row);
            }}
            className="px-2 py-1 rounded-full text-[11px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937]"
          >
            Change Role
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHistoryFor(row);
            }}
            className="px-2 py-1 rounded-full text-[11px] text-[#9CA3AF] hover:bg-[#111827]"
          >
            History
          </button>
          <button
            type="button"
            className="p-1 rounded-full text-[#9CA3AF] hover:text-[#F97373] hover:bg-[#111827]"
          >
            <UserMinus className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
      minWidth: "210px",
    },
  ];

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
            <Shield className="w-5 h-5 text-[#6366F1]" />
            Role Assignments
          </h1>
          <p className="text-[13px] text-[#71767B] mt-0.5">
            Manage platform access and administrative privileges.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-[#111827] border border-[#1F2937] text-[#E5E7EB] hover:bg-[#1F2937]"
          >
            <Users className="w-4 h-4 text-[#9CA3AF]" />
            Create Role
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937]"
          >
            <Download className="w-4 h-4 text-[#9CA3AF]" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Refresh
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#020617] border border-[#1F2937] text-[11px] font-mono text-[#9CA3AF]">
            {MOCK_ASSIGNMENTS.length.toString().padStart(3, "0")} assignments
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <RoleOverviewCards data={MOCK_ASSIGNMENTS} />

        <div className="bg-[#050816] border border-[#1F2937] rounded-xl">
          <div className="px-4 pt-3 flex items-center justify-between">
            <div className="inline-flex rounded-full bg-[#020617] border border-[#1F2937] p-1">
              <button
                type="button"
                onClick={() => setActiveTab("assignments")}
                className={`px-3 py-1 text-[12px] font-semibold rounded-full ${
                  activeTab === "assignments"
                    ? "bg-[#111827] text-[#E5E7EB]"
                    : "text-[#9CA3AF]"
                }`}
              >
                Role Assignment Table
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("matrix")}
                className={`px-3 py-1 text-[12px] font-semibold rounded-full ${
                  activeTab === "matrix"
                    ? "bg-[#111827] text-[#E5E7EB]"
                    : "text-[#9CA3AF]"
                }`}
              >
                Permission Matrix
              </button>
            </div>
            {activeTab === "assignments" && (
              <div className="flex items-center gap-2 py-2">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-[#6B7280]" />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="block w-52 pl-9 pr-3 py-1.5 bg-[#020617] border border-[#1F2937] rounded-full text-[12px] text-[#E5E7EB] placeholder-[#6B7280] focus:ring-1 focus:ring-[#1D9BF0] focus:border-[#1D9BF0] outline-none"
                    placeholder="Search name or email…"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter(e.target.value as "All" | Role)
                  }
                  className="bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                >
                  <option value="All">All roles</option>
                  <option value="User">User</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>
            )}
          </div>

          <div className="p-4">
            {activeTab === "assignments" ? (
              <DataTable
                columns={columns}
                data={filtered}
                customStyles={tableStyles}
                highlightOnHover
                pointerOnHover
                pagination
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 25, 50]}
                onRowClicked={(row) => setSelectedAssignment(row)}
                noDataComponent={
                  <div className="py-10 text-center text-[#6B7280] flex flex-col items-center gap-2">
                    <Shield className="w-8 h-8 opacity-40" />
                    <p className="text-[13px]">
                      No assignments match the current filters.
                    </p>
                  </div>
                }
              />
            ) : (
              <PermissionMatrix />
            )}
          </div>
        </div>
      </div>

      <RoleAssignmentDrawer
        open={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment}
      />
      <RoleHistoryModal
        open={!!historyFor}
        onClose={() => setHistoryFor(null)}
        assignment={historyFor}
      />
    </div>
  );
}

