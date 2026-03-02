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
  UserMinus,
  Users,
  X,
} from "lucide-react";

type SuspensionType = "Temporary" | "Indefinite" | "Permanent Ban";

type RiskLevel = "Low" | "Medium" | "High";

interface SuspendedUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: "User" | "Moderator" | "Admin" | "Super Admin";
  risk: RiskLevel;
  suspensionType: SuspensionType;
  startDate: string;
  endDate?: string;
  reasonCategory:
    | "Spam"
    | "Harassment"
    | "Policy Violation"
    | "Fraud"
    | "Security Risk"
    | "Repeat Offender"
    | "Other";
  suspendedBy: string;
  lastActivity: string;
}

const MOCK_SUSPENDED: SuspendedUser[] = [
  {
    id: "USR-1123",
    name: "Taylor Kim",
    email: "taylor.kim@example.com",
    handle: "@taylor_k",
    role: "User",
    risk: "High",
    suspensionType: "Temporary",
    startDate: "2026-03-01",
    endDate: "2026-03-08",
    reasonCategory: "Repeat Offender",
    suspendedBy: "Alex Morgan",
    lastActivity: "2h ago",
  },
  {
    id: "USR-0042",
    name: "Carlos Ruiz",
    email: "c.ruiz@example.com",
    handle: "@cruiz",
    role: "Moderator",
    risk: "High",
    suspensionType: "Indefinite",
    startDate: "2026-02-22",
    reasonCategory: "Security Risk",
    suspendedBy: "Security Automation",
    lastActivity: "8d ago",
  },
  {
    id: "USR-9001",
    name: "System Service Account",
    email: "service+ml@company.internal",
    handle: "@ml_pipeline",
    role: "Admin",
    risk: "Medium",
    suspensionType: "Permanent Ban",
    startDate: "2026-01-15",
    reasonCategory: "Fraud",
    suspendedBy: "Alex Morgan",
    lastActivity: "30d ago",
  },
];

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

const riskBadgeClasses: Record<RiskLevel, string> = {
  Low: "bg-[#064E3B] text-[#6EE7B7] border-[#10B981]/40",
  Medium: "bg-[#451A03] text-[#FBBF24] border-[#FBBF24]/40",
  High: "bg-[#450A0A] text-[#FCA5A5] border-[#EF4444]/60",
};

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

const SuspensionTypeBadge = ({ type }: { type: SuspensionType }) => {
  const base =
    type === "Temporary"
      ? "bg-[#111827] text-[#BFDBFE] border-[#1D4ED8]/50"
      : type === "Indefinite"
        ? "bg-[#0F172A] text-[#FCD34D] border-[#F59E0B]/50"
        : "bg-[#450A0A] text-[#FCA5A5] border-[#EF4444]/70";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${base}`}
    >
      {type === "Temporary" && <Calendar className="w-3 h-3" />}
      {type === "Indefinite" && <Lock className="w-3 h-3" />}
      {type === "Permanent Ban" && <ShieldAlert className="w-3 h-3" />}
      {type}
    </span>
  );
};

const ImpactPreview = ({ user }: { user: SuspendedUser | null }) => {
  if (!user) return null;
  const elevated = user.role === "Admin" || user.role === "Super Admin";

  return (
    <div className="mt-4 border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
      <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
        Impact Preview
      </p>
      <ul className="text-[12px] text-[#D1D5DB] space-y-1.5">
        <li>• Disable login access</li>
        <li>• Hide all published posts</li>
        <li>• Block new content creation</li>
        <li>• Freeze active appeals</li>
        <li>• Restrict API access</li>
      </ul>
      {elevated && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#7F1D1D] bg-[#450A0A]/70 px-3 py-2">
          <ShieldAlert className="w-4 h-4 text-[#F97373] mt-0.5" />
          <p className="text-[11px] text-[#FECACA]">
            Suspending this account will immediately remove{" "}
            <span className="font-semibold">{user.role}</span> privileges.
          </p>
        </div>
      )}
    </div>
  );
};

const SuspendUserModal = ({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: SuspendedUser | null;
}) => {
  const [type, setType] = useState<SuspensionType>("Temporary");
  const [duration, setDuration] = useState("7d");
  const [reason, setReason] =
    useState<SuspendedUser["reasonCategory"]>("Policy Violation");
  const [notify, setNotify] = useState(true);
  const [ack, setAck] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState("");

  React.useEffect(() => {
    if (user) {
      setType("Temporary");
      setDuration("7d");
      setReason("Policy Violation");
      setNotify(true);
      setAck(false);
      setEmailConfirm("");
    }
  }, [user]);

  if (!open || !user) return null;

  const isPermanent = type === "Permanent Ban";
  const canConfirm =
    ack &&
    (!isPermanent ||
      emailConfirm.trim().toLowerCase() === user.email.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-black border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between bg-[#020617]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#E5E7EB] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F97373]" />
              Suspend User
            </h2>
            <p className="text-[12px] text-[#9CA3AF]">
              Enforcement action against{" "}
              <span className="text-[#E5E7EB]">{user.name}</span> (
              {user.email})
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

        <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-5 gap-4 max-h-[440px] overflow-y-auto">
          <div className="md:col-span-3 space-y-4">
            <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center">
                <User className="w-5 h-5 text-[#E5E7EB]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#E5E7EB] truncate">
                      {user.name} <span className="text-[#9CA3AF]">({user.handle})</span>
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#111827] border border-[#1F2937]">
                    {user.role}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Account age: 2.4y
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    Last activity: {user.lastActivity}
                  </span>
                </div>
              </div>
              <RiskBadge risk={user.risk} />
            </div>

            <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-3">
              <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                Suspension Configuration
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-[#9CA3AF] mb-1">Suspension type</p>
                  <div className="flex flex-col gap-1.5">
                    {(["Temporary", "Indefinite", "Permanent Ban"] as SuspensionType[]).map(
                      (option) => (
                        <label
                          key={option}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer ${
                            type === option
                              ? "border-[#F97373] bg-[#111827]"
                              : "border-[#1F2937] bg-[#020617] hover:bg-[#020617]/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              className="h-3 w-3"
                              checked={type === option}
                              onChange={() => setType(option)}
                            />
                            {option}
                          </span>
                          {option === "Permanent Ban" && (
                            <AlertTriangle className="w-3 h-3 text-[#F97373]" />
                          )}
                        </label>
                      ),
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-[#9CA3AF] mb-1">Duration</p>
                  <select
                    disabled={type !== "Temporary"}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none disabled:opacity-50"
                  >
                    <option value="24h">24 hours</option>
                    <option value="3d">3 days</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="custom">Custom…</option>
                  </select>
                  {type === "Temporary" && duration === "custom" && (
                    <input
                      type="date"
                      className="mt-2 w-full bg-[#020617] border border-[#1F2937] rounded-lg px-2 py-1.5 text-[12px] text-[#E5E7EB]"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-[#9CA3AF] mb-1">
                    Reason category <span className="text-[#F97373]">*</span>
                  </p>
                  <select
                    value={reason}
                    onChange={(e) =>
                      setReason(
                        e.target.value as SuspendedUser["reasonCategory"],
                      )
                    }
                    className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                  >
                    <option>Spam</option>
                    <option>Harassment</option>
                    <option>Policy Violation</option>
                    <option>Fraud</option>
                    <option>Security Risk</option>
                    <option>Repeat Offender</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <label className="flex items-center gap-2 text-[11px] text-[#D1D5DB]">
                    <input
                      type="checkbox"
                      checked={notify}
                      onChange={(e) => setNotify(e.target.checked)}
                    />
                    Notify user via email
                  </label>
                  <span className="text-[11px] text-[#6B7280]">
                    Notification template configured in Policy Settings.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-[#9CA3AF] mb-1">
                    Detailed explanation{" "}
                    <span className="text-[#F97373]">*</span>
                  </p>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
                    placeholder="Summarize the violation and enforcement rationale. Visible in internal audit logs."
                  />
                </div>
                <div>
                  <p className="text-[11px] text-[#9CA3AF] mb-1">
                    Internal notes (staff only)
                  </p>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
                    placeholder="Optional context for future reviewers. Not visible to the user."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <ImpactPreview user={user} />

            <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                Behavioral Signals
              </p>
              <ul className="text-[11px] text-[#D1D5DB] space-y-1.5">
                <li>• Risk spike in last 24h (3x baseline reports)</li>
                <li>• 4 prior policy violations in 90d window</li>
                <li>• Possible linked device cluster: 3 accounts</li>
                <li>• Recent suspicious login from new country</li>
              </ul>
            </div>

            <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
              <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                Confirmation
              </p>
              <label className="flex items-start gap-2 text-[11px] text-[#D1D5DB]">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I understand this action restricts platform access and will be
                  recorded in the security audit log.
                </span>
              </label>
              {isPermanent && (
                <div className="mt-2 space-y-1">
                  <p className="text-[11px] text-[#FECACA]">
                    Type the user email to confirm permanent ban:
                  </p>
                  <input
                    type="text"
                    value={emailConfirm}
                    onChange={(e) => setEmailConfirm(e.target.value)}
                    className="w-full rounded-full bg-[#020617] border border-[#7F1D1D] text-[12px] text-[#FECACA] px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F97373]"
                    placeholder={user.email}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#111827] bg-[#020617] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#B91C1C] text-white hover:bg-[#DC2626] disabled:bg-[#1F2937] disabled:text-[#6B7280]"
          >
            <ShieldAlert className="w-4 h-4" />
            Confirm Suspension
          </button>
        </div>
      </div>
    </div>
  );
};

const ReinstateModal = ({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: SuspendedUser | null;
}) => {
  const [ack, setAck] = useState(false);

  React.useEffect(() => {
    if (user) setAck(false);
  }, [user]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-black border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between bg-[#020617]">
          <div>
            <h2 className="text-[16px] font-semibold text-[#E5E7EB]">
              Reinstate User
            </h2>
            <p className="text-[12px] text-[#9CA3AF]">
              {user.name} • {user.email}
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
        <div className="px-5 py-4 space-y-3 max-h-[320px] overflow-y-auto">
          <p className="text-[12px] text-[#D1D5DB]">
            Reinstating this account will restore access and re-enable content
            visibility according to current policies.
          </p>
          <div>
            <p className="text-[11px] text-[#9CA3AF] mb-1">
              Optional explanation
            </p>
            <textarea
              rows={3}
              className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
              placeholder="Document why this suspension is being lifted. This will be logged for compliance review."
            />
          </div>
          <label className="flex items-start gap-2 text-[11px] text-[#D1D5DB]">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I confirm this reinstatement complies with platform policies and
              local regulations.
            </span>
          </label>
        </div>
        <div className="px-5 py-3 border-t border-[#111827] bg-[#020617] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!ack}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#10B981] text-white hover:bg-[#22C55E] disabled:bg-[#1F2937] disabled:text-[#6B7280]"
          >
            <UserCheck className="w-4 h-4" />
            Reinstate User
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SuperAdminUsersSuspended() {
  const [search, setSearch] = useState("");
  const [activeUser, setActiveUser] = useState<SuspendedUser | null>(null);
  const [reinstatingUser, setReinstatingUser] =
    useState<SuspendedUser | null>(null);

  const filtered = useMemo(
    () =>
      MOCK_SUSPENDED.filter((row) => {
        const s = search.toLowerCase();
        return (
          !s ||
          row.name.toLowerCase().includes(s) ||
          row.email.toLowerCase().includes(s) ||
          row.id.toLowerCase().includes(s)
        );
      }),
    [search],
  );

  const columns: TableColumn<SuspendedUser>[] = [
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
            {row.handle} • {row.id}
          </span>
        </div>
      ),
      minWidth: "200px",
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
      name: "Role",
      selector: (row) => row.role,
      sortable: true,
      cell: (row) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937]">
          {row.role}
        </span>
      ),
      minWidth: "120px",
    },
    {
      name: "Suspension",
      selector: (row) => row.suspensionType,
      sortable: true,
      cell: (row) => <SuspensionTypeBadge type={row.suspensionType} />,
      minWidth: "150px",
    },
    {
      name: "Window",
      selector: (row) => row.startDate,
      sortable: true,
      cell: (row) => (
        <div className="flex flex-col py-1">
          <span className="text-[12px] text-[#E5E7EB]">
            From {row.startDate}
          </span>
          <span className="text-[11px] text-[#9CA3AF]">
            {row.endDate ? `Until ${row.endDate}` : "Until manually lifted"}
          </span>
        </div>
      ),
      minWidth: "160px",
    },
    {
      name: "Risk",
      selector: (row) => row.risk,
      sortable: true,
      cell: (row) => <RiskBadge risk={row.risk} />,
      minWidth: "120px",
    },
    {
      name: "Suspended By",
      selector: (row) => row.suspendedBy,
      sortable: true,
      cell: (row) => (
        <span className="text-[12px] text-[#E5E7EB]">{row.suspendedBy}</span>
      ),
      minWidth: "150px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveUser(row);
            }}
            className="px-2 py-1 rounded-full text-[11px] text-[#F97373] bg-[#111827] border border-[#7F1D1D] hover:bg-[#450A0A]/60"
          >
            View / Edit Suspension
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setReinstatingUser(row);
            }}
            className="px-2 py-1 rounded-full text-[11px] text-[#6EE7B7] bg-[#022C22] border border-[#10B981]/40 hover:bg-[#064E3B]"
          >
            Reinstate
          </button>
        </div>
      ),
      minWidth: "220px",
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
            <ShieldAlert className="w-5 h-5 text-[#F97373]" />
            Suspended Users
          </h1>
          <p className="text-[13px] text-[#71767B] mt-0.5">
            Monitor and manage temporarily suspended accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937]"
          >
            <Download className="w-4 h-4 text-[#9CA3AF]" />
            Export List
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Refresh
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#020617] border border-[#1F2937] text-[11px] font-mono text-[#F97373]">
            {MOCK_SUSPENDED.length.toString().padStart(2, "0")} suspended
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="bg-[#050816] border border-[#1F2937] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#F97373]" />
            <span className="text-[12px] text-[#FECACA]">
              Suspensions are high-impact enforcement actions. All changes are
              logged in Security &amp; Compliance → Audit Logs.
            </span>
          </div>
          <button
            type="button"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-[#E5E7EB] bg-[#111827] border border-[#374151] hover:bg-[#1F2937]"
          >
            <Activity className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Open Audit Trail
          </button>
        </div>

        <div className="bg-[#050816] border border-[#1F2937] rounded-xl">
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                Suspended Accounts
              </span>
              <span className="text-[11px] text-[#6B7280]">
                All active suspensions across the platform.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-[#6B7280]" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-52 pl-9 pr-3 py-1.5 bg-[#020617] border border-[#1F2937] rounded-full text-[12px] text-[#E5E7EB] placeholder-[#6B7280] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                  placeholder="Search name, email, or ID…"
                />
              </div>
            </div>
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={filtered}
              customStyles={tableStyles}
              highlightOnHover
              pointerOnHover
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              onRowClicked={(row) => setActiveUser(row)}
              noDataComponent={
                <div className="py-10 text-center text-[#6B7280] flex flex-col items-center gap-2">
                  <Shield className="w-8 h-8 opacity-40" />
                  <p className="text-[13px]">
                    No active suspensions match the current filters.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      <SuspendUserModal
        open={!!activeUser}
        onClose={() => setActiveUser(null)}
        user={activeUser}
      />
      <ReinstateModal
        open={!!reinstatingUser}
        onClose={() => setReinstatingUser(null)}
        user={reinstatingUser}
      />
    </div>
  );
}


