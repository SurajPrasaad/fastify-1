"use client";

import React, { useMemo, useState } from "react";
import DataTable, { TableColumn, TableStyles } from "react-data-table-component";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronDown,
  Download,
  Lock,
  RefreshCw,
  Filter,
  Search,
  Shield,
  ShieldAlert,
  User,
  X,
} from "lucide-react";

type RiskLevel = "Low" | "Medium" | "High";

interface BannedUser {
  id: string;
  name: string;
  email: string;
  handle: string;
  role: "User" | "Moderator" | "Admin" | "Super Admin";
  risk: RiskLevel;
  bannedAt: string;
  bannedBy: string;
  reasonCategory:
    | "Fraud"
    | "Hate Speech"
    | "Violence"
    | "Sexual Misconduct"
    | "Repeated Policy Violations"
    | "Bot / Automation Abuse"
    | "Security Breach"
    | "Other";
  contentHandling: "Retain" | "Remove" | "Anonymize";
  appealAllowed: boolean;
}

const MOCK_BANNED: BannedUser[] = [
  {
    id: "USR-9001",
    name: "System Service Account",
    email: "service+ml@company.internal",
    handle: "@ml_pipeline",
    role: "Admin",
    risk: "High",
    bannedAt: "2026-02-28 09:14 UTC",
    bannedBy: "Alex Morgan",
    reasonCategory: "Fraud",
    contentHandling: "Retain",
    appealAllowed: false,
  },
  {
    id: "USR-7777",
    name: "John Doe",
    email: "j.doe@example.com",
    handle: "@johndoe",
    role: "User",
    risk: "High",
    bannedAt: "2026-02-15 18:03 UTC",
    bannedBy: "Trust & Safety Bot",
    reasonCategory: "Repeated Policy Violations",
    contentHandling: "Remove",
    appealAllowed: true,
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
      backgroundColor: "#111827",
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

const BannedBadge = () => (
  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[#7F1D1D] bg-[#450A0A]/80 text-[11px] font-semibold text-[#FECACA]">
    <ShieldAlert className="w-3 h-3" />
    Banned
  </span>
);

const BanMultiStepModal = ({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: BannedUser | null;
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [reasonCategory, setReasonCategory] =
    useState<BannedUser["reasonCategory"]>("Fraud");
  const [contentHandling, setContentHandling] =
    useState<BannedUser["contentHandling"]>("Retain");
  const [appealAllowed, setAppealAllowed] = useState(true);
  const [notifyUser, setNotifyUser] = useState(true);
  const [ackPermanent, setAckPermanent] = useState(false);
  const [ackPolicy, setAckPolicy] = useState(false);
  const [emailConfirm, setEmailConfirm] = useState("");

  React.useEffect(() => {
    if (open && user) {
      setStep(1);
      setReasonCategory("Fraud");
      setContentHandling("Retain");
      setAppealAllowed(true);
      setNotifyUser(true);
      setAckPermanent(false);
      setAckPolicy(false);
      setEmailConfirm("");
    }
  }, [open, user]);

  if (!open || !user) return null;

  const elevated = user.role === "Admin" || user.role === "Super Admin";
  const critical = user.role === "Super Admin";

  const canConfirm =
    step === 4 &&
    ackPermanent &&
    ackPolicy &&
    emailConfirm.trim().toLowerCase() === user.email.toLowerCase();

  const goNext = () => {
    setStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
  };

  const goPrev = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl bg-black border border-[#1F2937] rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1F2937] bg-[#020617] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F97373]" />
              <h2 className="text-[16px] font-semibold text-[#FECACA]">
                Permanent Ban
              </h2>
            </div>
            <p className="text-[12px] text-[#9CA3AF]">
              Final enforcement action for{" "}
              <span className="text-[#E5E7EB]">{user.name}</span> ({user.email})
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

        <div className="px-6 py-3 border-b border-[#111827] bg-[#020617] flex items-center gap-2 text-[11px] text-[#9CA3AF]">
          <span
            className={`px-2 py-1 rounded-full ${
              step === 1 ? "bg-[#450A0A] text-[#FECACA]" : "bg-[#111827]"
            }`}
          >
            1. Review
          </span>
          <ArrowRight className="w-3 h-3" />
          <span
            className={`px-2 py-1 rounded-full ${
              step === 2 ? "bg-[#450A0A] text-[#FECACA]" : "bg-[#111827]"
            }`}
          >
            2. Configuration
          </span>
          <ArrowRight className="w-3 h-3" />
          <span
            className={`px-2 py-1 rounded-full ${
              step === 3 ? "bg-[#450A0A] text-[#FECACA]" : "bg-[#111827]"
            }`}
          >
            3. Data & Legal
          </span>
          <ArrowRight className="w-3 h-3" />
          <span
            className={`px-2 py-1 rounded-full ${
              step === 4 ? "bg-[#450A0A] text-[#FECACA]" : "bg-[#111827]"
            }`}
          >
            4. Final Confirm
          </span>
        </div>

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-5 gap-4 max-h-[430px] overflow-y-auto">
          {step === 1 && (
            <>
              <div className="md:col-span-3 space-y-3">
                <div className="border border-[#7F1D1D] bg-[#450A0A]/60 rounded-xl p-3 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#FECACA] mt-0.5" />
                  <div>
                    <p className="text-[12px] font-semibold text-[#FECACA]">
                      This action permanently terminates access.
                    </p>
                    <p className="text-[11px] text-[#FCA5A5]">
                      Banned accounts cannot log in, register with the same
                      identity, or regain access without a separate appeal
                      workflow.
                    </p>
                  </div>
                </div>
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#111827] border border-[#1F2937] flex items-center justify-center">
                    <User className="w-5 h-5 text-[#E5E7EB]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#E5E7EB] truncate">
                      {user.name} <span className="text-[#9CA3AF]">({user.handle})</span>
                    </p>
                    <p className="text-[11px] text-[#9CA3AF] truncate">
                      {user.email}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[#9CA3AF]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#111827] border border-[#1F2937]">
                        {user.role}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        Risk:{" "}
                        <span className="font-semibold text-[#FECACA]">
                          {user.risk}
                        </span>
                      </span>
                    </div>
                  </div>
                  <RiskBadge risk={user.risk} />
                </div>
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                    Violation History
                  </p>
                  <ul className="text-[11px] text-[#D1D5DB] space-y-1.5">
                    <li>• 4 major policy violations in the last 90 days</li>
                    <li>• 2 prior suspensions (7d, 30d)</li>
                    <li>• 3 escalated fraud investigations linked to this account</li>
                  </ul>
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                    Linked Signals
                  </p>
                  <ul className="text-[11px] text-[#D1D5DB] space-y-1.5">
                    <li>• 3 linked accounts via device fingerprint</li>
                    <li>• 2 shared payment methods flagged for chargebacks</li>
                    <li>• IP cluster associated with known abuse patterns</li>
                  </ul>
                </div>
                {elevated && (
                  <div className="border border-[#7F1D1D] rounded-xl bg-[#450A0A]/70 p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#F97373] mt-0.5" />
                    <p className="text-[11px] text-[#FECACA]">
                      You are banning a{" "}
                      <span className="font-semibold">{user.role}</span>{" "}
                      account. Elevated accounts can impact moderation,
                      configuration, or security posture.
                    </p>
                  </div>
                )}
                {critical && (
                  <div className="border border-[#B91C1C] rounded-xl bg-[#7F1D1D] p-3 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-white mt-0.5" />
                    <p className="text-[11px] text-white">
                      This appears to be a Super Admin. Banning the last active
                      Super Admin may compromise platform governance.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="md:col-span-3 space-y-3">
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                    Ban Configuration
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-[#9CA3AF]">
                        Ban policy (always permanent)
                      </p>
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] text-[#D1D5DB]">
                          <input type="radio" checked readOnly />
                          Permanent account ban
                        </label>
                        <label className="flex items-center gap-2 text-[11px] text-[#D1D5DB]">
                          <input type="checkbox" defaultChecked />
                          Block device fingerprint
                        </label>
                        <label className="flex items-center gap-2 text-[11px] text-[#D1D5DB]">
                          <input type="checkbox" defaultChecked />
                          Block IP cluster associated with this account
                        </label>
                        <label className="flex items-center gap-2 text-[11px] text-[#D1D5DB]">
                          <input type="checkbox" defaultChecked />
                          Flag linked accounts for review
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] text-[#9CA3AF]">
                        Reason category <span className="text-[#F97373]">*</span>
                      </p>
                      <select
                        value={reasonCategory}
                        onChange={(e) =>
                          setReasonCategory(
                            e.target.value as BannedUser["reasonCategory"],
                          )
                        }
                        className="w-full bg-[#020617] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
                      >
                        <option>Fraud</option>
                        <option>Hate Speech</option>
                        <option>Violence</option>
                        <option>Sexual Misconduct</option>
                        <option>Repeated Policy Violations</option>
                        <option>Bot / Automation Abuse</option>
                        <option>Security Breach</option>
                        <option>Other</option>
                      </select>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[11px] text-[#D1D5DB]">
                          <input
                            type="checkbox"
                            checked={appealAllowed}
                            onChange={(e) => setAppealAllowed(e.target.checked)}
                          />
                          Allow future appeal request
                        </label>
                        <label className="flex items-center gap-2 text-[11px] text-[#D1D5DB]">
                          <input
                            type="checkbox"
                            checked={notifyUser}
                            onChange={(e) => setNotifyUser(e.target.checked)}
                          />
                          Notify user via email
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-[#9CA3AF] mb-1">
                      Detailed explanation{" "}
                      <span className="text-[#F97373]">*</span>
                    </p>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
                      placeholder="Summarize the violation, evidence, and policy mapping. This text is visible to enforcement and compliance teams."
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#9CA3AF] mb-1">
                      Internal compliance notes
                    </p>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl bg-[#020617] border border-[#1F2937] text-[12px] text-[#E5E7EB] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1D9BF0]"
                      placeholder="Optional notes for legal/compliance. Not visible to user."
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                    Impact Preview
                  </p>
                  <ul className="text-[11px] text-[#FECACA] space-y-1.5">
                    <li>• Permanently disable login and registration</li>
                    <li>• Revoke API tokens and invalidate all sessions</li>
                    <li>• Prevent re-registration using same email/identity</li>
                    <li>• Flag associated accounts for enhanced monitoring</li>
                  </ul>
                  {elevated && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#7F1D1D] bg-[#450A0A]/70 px-3 py-2">
                      <AlertTriangle className="w-4 h-4 text-[#F97373] mt-0.5" />
                      <p className="text-[11px] text-[#FECACA]">
                        You are banning a privileged account ({user.role}). This
                        may affect moderation tooling and configuration access.
                      </p>
                    </div>
                  )}
                  {critical && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-[#B91C1C] bg-[#7F1D1D] px-3 py-2">
                      <ShieldAlert className="w-4 h-4 text-white mt-0.5" />
                      <p className="text-[11px] text-white">
                        Critical system warning: ensure at least one other Super
                        Admin remains active before proceeding.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="md:col-span-3 space-y-3">
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                    Content & Data Handling
                  </p>
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-[#9CA3AF]">
                      Content visibility
                    </p>
                    <div className="space-y-1.5">
                      {(["Retain", "Remove", "Anonymize"] as const).map((opt) => (
                        <label
                          key={opt}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] cursor-pointer ${
                            contentHandling === opt
                              ? "border-[#F97373] bg-[#111827]"
                              : "border-[#1F2937] bg-[#020617] hover:bg-[#020617]/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="radio"
                              checked={contentHandling === opt}
                              onChange={() =>
                                setContentHandling(opt as BannedUser["contentHandling"])
                              }
                            />
                            {opt === "Retain" && "Retain content (admin only)"}
                            {opt === "Remove" && "Remove public content"}
                            {opt === "Anonymize" && "Anonymize content"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-[#9CA3AF]">
                    User data will be retained according to platform data
                    retention and local compliance policies.
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                    Legal & Compliance
                  </p>
                  <p className="text-[11px] text-[#D1D5DB]">
                    This ban will be logged with:
                  </p>
                  <ul className="text-[11px] text-[#D1D5DB] space-y-1.5">
                    <li>• Banned user ID and admin ID</li>
                    <li>• Timestamp, admin IP, and device fingerprint</li>
                    <li>• Ban type, reason, content handling choice</li>
                    <li>• Appeal policy and linked account actions</li>
                  </ul>
                  <div className="mt-2 border border-[#1F2937] rounded-lg bg-[#020617] px-3 py-2 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-[#E5E7EB] mt-0.5" />
                    <div className="text-[11px] text-[#D1D5DB]">
                      In GDPR/CCPA regions, user data will be processed
                      according to your configured retention and erasure policies.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="md:col-span-3 space-y-3">
                <div className="border border-[#7F1D1D] rounded-xl bg-[#450A0A]/80 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#FECACA] mt-0.5" />
                    <div>
                      <p className="text-[12px] font-semibold text-[#FECACA]">
                        Final confirmation
                      </p>
                      <p className="text-[11px] text-[#FCA5A5]">
                        This action is irreversible in the system. Any future
                        access must go through a separate appeal and
                        reinstatement process.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <label className="flex items-start gap-2 text-[11px] text-[#D1D5DB]">
                    <input
                      type="checkbox"
                      checked={ackPermanent}
                      onChange={(e) => setAckPermanent(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      I understand this action is permanent and the account
                      cannot be restored without a separate governance decision.
                    </span>
                  </label>
                  <label className="flex items-start gap-2 text-[11px] text-[#D1D5DB]">
                    <input
                      type="checkbox"
                      checked={ackPolicy}
                      onChange={(e) => setAckPolicy(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      I confirm that the policy violation review has been
                      completed and documented.
                    </span>
                  </label>
                  <div className="mt-2 space-y-1">
                    <p className="text-[11px] text-[#FECACA]">
                      Type the user email to confirm:
                    </p>
                    <input
                      type="text"
                      value={emailConfirm}
                      onChange={(e) => setEmailConfirm(e.target.value)}
                      className="w-full rounded-full bg-[#020617] border border-[#7F1D1D] text-[12px] text-[#FECACA] px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F97373]"
                      placeholder={user.email}
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 space-y-2">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                    Enforcement Snapshot
                  </p>
                  <ul className="text-[11px] text-[#D1D5DB] space-y-1.5">
                    <li>• Ban reason: {reasonCategory}</li>
                    <li>• Content handling: {contentHandling}</li>
                    <li>• Appeal allowed: {appealAllowed ? "Yes" : "No"}</li>
                    <li>• Notify user: {notifyUser ? "Yes" : "No"}</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-[#111827] bg-[#020617] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#9CA3AF] hover:bg-[#020617]"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937]"
              >
                Back
              </button>
            )}
            {step < 4 && (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#111827] border border-[#4B5563] text-[#E5E7EB] hover:bg-[#1F2937]"
              >
                Continue
              </button>
            )}
            {step === 4 && (
              <button
                type="button"
                disabled={!canConfirm}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#B91C1C] text-white hover:bg-[#DC2626] disabled:bg-[#1F2937] disabled:text-[#6B7280]"
              >
                <ShieldAlert className="w-4 h-4" />
                Confirm Permanent Ban
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SuperAdminUsersBanned() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BannedUser | null>(null);

  const filtered = useMemo(
    () =>
      MOCK_BANNED.filter((row) => {
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

  const columns: TableColumn<BannedUser>[] = [
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
      name: "Status",
      selector: () => "Banned",
      sortable: false,
      cell: () => <BannedBadge />,
      minWidth: "100px",
    },
    {
      name: "Banned At",
      selector: (row) => row.bannedAt,
      sortable: true,
      cell: (row) => (
        <span className="text-[12px] text-[#9CA3AF] font-mono">
          {row.bannedAt}
        </span>
      ),
      minWidth: "160px",
    },
    {
      name: "Reason",
      selector: (row) => row.reasonCategory,
      sortable: true,
      cell: (row) => (
        <span className="text-[12px] text-[#E5E7EB]">{row.reasonCategory}</span>
      ),
      minWidth: "180px",
    },
    {
      name: "Risk",
      selector: (row) => row.risk,
      sortable: true,
      cell: (row) => <RiskBadge risk={row.risk} />,
      minWidth: "120px",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(row);
            }}
            className="px-2 py-1 rounded-full text-[11px] text-[#FECACA] bg-[#450A0A] border border-[#7F1D1D] hover:bg-[#7F1D1D]"
          >
            View Ban Details
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded-full text-[11px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937]"
          >
            Export Record
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
            <ShieldAlert className="w-5 h-5 text-[#F97373]" />
            Banned Users
          </h1>
          <p className="text-[13px] text-[#71767B] mt-0.5">
            View and audit permanently banned accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#111827] border border-[#1F2937] hover:bg-[#1F2937]"
          >
            <Download className="w-4 h-4 text-[#9CA3AF]" />
            Export All
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Refresh
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#020617] border border-[#7F1D1D] text-[11px] font-mono text-[#FECACA]">
            {MOCK_BANNED.length.toString().padStart(2, "0")} banned
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="bg-[#050816] border border-[#1F2937] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#F97373]" />
            <span className="text-[12px] text-[#FECACA]">
              Bans are permanent enforcement actions. All decisions are logged
              in Security → Enforcement Logs.
            </span>
          </div>
          <button
            type="button"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-[#E5E7EB] bg-[#111827] border border-[#374151] hover:bg-[#1F2937]"
          >
            <Activity className="w-3.5 h-3.5 text-[#9CA3AF]" />
            Open Enforcement Logs
          </button>
        </div>

        <div className="bg-[#050816] border border-[#1F2937] rounded-xl">
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-[#1F2937]">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                Permanently Banned Accounts
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Irreversible actions with full audit trail.
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
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] text-[#9CA3AF] bg-[#020617] border border-[#1F2937] hover:bg-[#111827]"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                <ChevronDown className="w-3 h-3" />
              </button>
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
              onRowClicked={(row) => setSelected(row)}
              noDataComponent={
                <div className="py-10 text-center text-[#6B7280] flex flex-col items-center gap-2">
                  <Shield className="w-8 h-8 opacity-40" />
                  <p className="text-[13px]">
                    No banned users match the current filters.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </div>

      <BanMultiStepModal
        open={!!selected}
        onClose={() => setSelected(null)}
        user={selected}
      />
    </div>
  );
}

