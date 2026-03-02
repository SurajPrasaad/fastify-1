"use client";

import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Clock,
  Download,
  Filter,
  Flag,
  MessageCircle,
  RefreshCw,
  Shield,
  ShieldAlert,
  User,
  X,
} from "lucide-react";

type Severity = "Medium" | "High" | "Critical";
type Status = "Pending" | "In Review" | "Resolved" | "Dismissed";

interface EscalatedCase {
  id: string;
  contentType: "Post" | "Comment" | "User";
  category: string;
  severity: Severity;
  escalatedBy: string;
  reason: string;
  aiRisk: number;
  escalatedAt: string;
  slaStatus: "Within" | "At Risk" | "Breached";
  status: Status;
}

const MOCK_ESCALATED: EscalatedCase[] = [
  {
    id: "ESC-9012",
    contentType: "Post",
    category: "Violence / Threats",
    severity: "Critical",
    escalatedBy: "Alex (US-West)",
    reason: "Threat involving real-world harm and location reference.",
    aiRisk: 0.97,
    escalatedAt: "18m ago",
    slaStatus: "At Risk",
    status: "Pending",
  },
  {
    id: "ESC-8974",
    contentType: "User",
    category: "Hate Speech",
    severity: "High",
    escalatedBy: "Jordan (EMEA)",
    reason: "Coordinated harassment targeting protected class.",
    aiRisk: 0.92,
    escalatedAt: "54m ago",
    slaStatus: "Within",
    status: "In Review",
  },
  {
    id: "ESC-8841",
    contentType: "Comment",
    category: "Self-Harm / Safety",
    severity: "High",
    escalatedBy: "Priya (APAC)",
    reason: "Ambiguous self-harm language; needs policy confirmation.",
    aiRisk: 0.88,
    escalatedAt: "2h 13m ago",
    slaStatus: "Breached",
    status: "Pending",
  },
];

const barEscalationVolume = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
    backgroundColor: "#020617",
    borderColor: "#1f2937",
    textStyle: { color: "#e5e7eb", fontSize: 11 },
  },
  grid: { top: 20, left: 30, right: 10, bottom: 20, containLabel: false },
  xAxis: {
    type: "category",
    data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    axisLine: { lineStyle: { color: "#374151" } },
    axisLabel: { color: "#9ca3af", fontSize: 10 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
    axisLabel: { color: "#6b7280", fontSize: 10 },
  },
  series: [
    {
      type: "bar",
      barWidth: "45%",
      itemStyle: { color: "#38bdf8", borderRadius: [4, 4, 0, 0] },
      data: [28, 34, 31, 40, 44, 26, 22],
    },
  ],
};

const stackedEscalationOutcome = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    backgroundColor: "#020617",
    borderColor: "#1f2937",
    textStyle: { color: "#e5e7eb", fontSize: 11 },
  },
  grid: { top: 20, left: 40, right: 10, bottom: 20, containLabel: false },
  xAxis: {
    type: "category",
    data: ["Week 1", "Week 2", "Week 3", "Week 4"],
    axisLine: { lineStyle: { color: "#374151" } },
    axisLabel: { color: "#9ca3af", fontSize: 10 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
    axisLabel: { color: "#6b7280", fontSize: 10 },
  },
  series: [
    {
      name: "Approved",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#22c55e" },
      barWidth: 16,
      data: [22, 24, 18, 26],
    },
    {
      name: "Overturned",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#f97373" },
      barWidth: 16,
      data: [8, 9, 7, 10],
    },
    {
      name: "Escalated Further",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#facc15" },
      barWidth: 16,
      data: [3, 4, 2, 3],
    },
    {
      name: "Dismissed",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#e5e7eb" },
      barWidth: 16,
      data: [2, 3, 1, 2],
    },
  ],
};

const pieEscalationReasons = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "item",
    backgroundColor: "#020617",
    borderColor: "#1f2937",
    textStyle: { color: "#e5e7eb", fontSize: 11 },
  },
  series: [
    {
      type: "pie",
      radius: ["55%", "80%"],
      avoidLabelOverlap: false,
      label: { show: false },
      itemStyle: { borderColor: "#020617", borderWidth: 2 },
      data: [
        { value: 32, name: "Policy Ambiguity", itemStyle: { color: "#38bdf8" } },
        { value: 24, name: "Severity / Safety", itemStyle: { color: "#f97373" } },
        { value: 18, name: "Legal / Compliance", itemStyle: { color: "#facc15" } },
        { value: 12, name: "Repeat Offender", itemStyle: { color: "#22c55e" } },
        { value: 8, name: "Other", itemStyle: { color: "#a855f7" } },
      ],
    },
  ],
};

const areaSeverityTrend = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
    backgroundColor: "#020617",
    borderColor: "#1f2937",
    textStyle: { color: "#e5e7eb", fontSize: 11 },
  },
  grid: { top: 20, left: 32, right: 10, bottom: 20, containLabel: false },
  xAxis: {
    type: "category",
    data: ["Week 1", "Week 2", "Week 3", "Week 4"],
    axisLine: { lineStyle: { color: "#374151" } },
    axisLabel: { color: "#9ca3af", fontSize: 10 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
    axisLabel: { color: "#6b7280", fontSize: 10 },
  },
  series: [
    {
      name: "Critical",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 3,
      itemStyle: { color: "#f97373" },
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(248,113,113,0.45)" },
            { offset: 1, color: "rgba(15,23,42,0)" },
          ],
        },
      },
      data: [18, 20, 17, 22],
    },
    {
      name: "High",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 3,
      itemStyle: { color: "#facc15" },
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(250,204,21,0.4)" },
            { offset: 1, color: "rgba(15,23,42,0)" },
          ],
        },
      },
      data: [24, 26, 28, 25],
    },
  ],
};

export default function SuperAdminModeratorsEscalated() {
  const [priorityFilter, setPriorityFilter] = useState<"All" | Severity>(
    "All",
  );
  const [statusFilter, setStatusFilter] = useState<"All" | Status>("All");

  const filteredCases = useMemo(
    () =>
      MOCK_ESCALATED.filter((c) => {
        const matchesPriority =
          priorityFilter === "All" || c.severity === priorityFilter;
        const matchesStatus =
          statusFilter === "All" || c.status === statusFilter;
        return matchesPriority && matchesStatus;
      }),
    [priorityFilter, statusFilter],
  );

  const [selectedCase, setSelectedCase] = useState<EscalatedCase | null>(
    filteredCases[0] ?? null,
  );

  const activeCount = filteredCases.length;

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
            <ShieldAlert className="w-5 h-5 text-[#f97373]" />
            Escalated Cases
          </h1>
          <p className="text-[13px] text-[#71767B] mt-0.5">
            High-priority moderation cases requiring Admin/Super Admin review.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(
                e.target.value as "All" | Severity,
              )
            }
            className="bg-[#050816] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
          >
            <option value="All">All Severity</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "All" | Status)
            }
            className="bg-[#050816] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#050816] border border-[#1F2937] hover:bg-[#111827]"
          >
            <Filter className="w-4 h-4 text-[#9CA3AF]" />
            Date Range
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-black bg-[#E5E7EB] hover:bg-white"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#1F2937] text-[#9CA3AF] hover:bg-[#111827]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#451a03]/60 border border-[#f97316]/50 text-[11px] font-mono text-[#fed7aa]">
            Active Escalations: {activeCount}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                Total Escalations
              </span>
              <Shield className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#E5E7EB] leading-tight">
                132
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                +12.4% vs previous period
              </p>
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                Pending Review
              </span>
              <Clock className="w-4 h-4 text-[#facc15]" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#E5E7EB] leading-tight">
                27
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                6 within 15 minutes of SLA
              </p>
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                Critical Severity
              </span>
              <ShieldAlert className="w-4 h-4 text-[#f97373]" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#E5E7EB] leading-tight">
                14
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                5 flagged as legal/compliance
              </p>
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                Avg Resolution Time
              </span>
              <Clock className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#E5E7EB] leading-tight">
                2h 31m
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                -18m vs last week
              </p>
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                Approval Rate
              </span>
              <Activity className="w-4 h-4 text-[#22c55e]" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#E5E7EB] leading-tight">
                72.3%
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                vs 75% policy benchmark
              </p>
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                Overdue (SLA Breach)
              </span>
              <AlertTriangle className="w-4 h-4 text-[#f97373]" />
            </div>
            <div>
              <p className="text-[22px] font-bold text-[#E5E7EB] leading-tight">
                9
              </p>
              <p className="text-[11px] text-[#9CA3AF] mt-1">
                Auto-prioritized in queue
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 h-[520px] max-h-[70vh]">
          <div className="xl:w-7/12 w-full flex flex-col bg-[#050816] border border-[#1F2937] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Escalated Case Queue
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Sorted by SLA risk and severity.
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="min-w-full text-left text-[12px] border-collapse">
                <thead>
                  <tr className="border-b border-[#1F2937] bg-[#020617] sticky top-0 z-10">
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      Case ID
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      Type
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      Category
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      Severity
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      Escalated By
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      AI Risk
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      Since
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      SLA
                    </th>
                    <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c) => {
                    const borderColor =
                      c.severity === "Critical"
                        ? "border-l-2 border-l-[#f97373]"
                        : c.severity === "High"
                        ? "border-l-2 border-l-[#facc15]"
                        : "border-l border-l-[#1F2937]";
                    const slaColor =
                      c.slaStatus === "Breached"
                        ? "text-[#f97373]"
                        : c.slaStatus === "At Risk"
                        ? "text-[#facc15]"
                        : "text-[#22c55e]";
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-[#111827] hover:bg-[#020617] cursor-pointer ${borderColor}`}
                        onClick={() => setSelectedCase(c)}
                      >
                        <td className="px-3 py-2 text-[#E5E7EB] font-mono">
                          {c.id}
                        </td>
                        <td className="px-3 py-2 text-[#E5E7EB]">
                          {c.contentType}
                        </td>
                        <td className="px-3 py-2 text-[#E5E7EB]">
                          {c.category}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-[#374151] text-[#E5E7EB]">
                            {c.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-[#E5E7EB]">
                          {c.escalatedBy}
                        </td>
                        <td className="px-3 py-2 text-[#E5E7EB]">
                          {(c.aiRisk * 100).toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-[#E5E7EB]">
                          {c.escalatedAt}
                        </td>
                        <td className={`px-3 py-2 font-semibold ${slaColor}`}>
                          {c.slaStatus}
                        </td>
                        <td className="px-3 py-2 text-[#E5E7EB]">
                          {c.status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xl:w-5/12 w-full flex flex-col bg-[#050816] border border-[#1F2937] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1F2937] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Case Review Workspace
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Structured 3-panel view for high-risk decisions.
                </p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 divide-x divide-[#1F2937] min-h-[260px]">
              <div className="col-span-1 p-3 space-y-2 overflow-y-auto">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                  Case Metadata
                </p>
                {selectedCase ? (
                  <div className="space-y-2 text-[12px] text-[#D1D5DB]">
                    <p className="font-mono text-[#E5E7EB]">
                      {selectedCase.id}
                    </p>
                    <p>Escalated by: {selectedCase.escalatedBy}</p>
                    <p>Escalated at: {selectedCase.escalatedAt}</p>
                    <p>Previous decision: Reject &amp; Remove</p>
                    <p>Report history: 14 reports</p>
                    <p>User violations: 3 prior strikes</p>
                    <p>Linked accounts: 2 suspected matches</p>
                    <p>Repeat offender: Yes</p>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#6B7280] mt-4">
                    Select a case from the table to load details.
                  </p>
                )}
              </div>
              <div className="col-span-1 p-3 space-y-2 overflow-y-auto">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                  Content &amp; Context
                </p>
                {selectedCase ? (
                  <div className="space-y-2 text-[12px] text-[#D1D5DB]">
                    <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-2">
                      <p className="text-[13px]">
                        “Example escalated content with highlighted violation segment
                        for review…”
                      </p>
                    </div>
                    <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-2">
                      <p className="text-[11px] text-[#9CA3AF] mb-1">
                        Reporter notes
                      </p>
                      <p>
                        Multiple users reported this as threatening and targeted
                        harassment involving real identity.
                      </p>
                    </div>
                    <div className="border border-[#1F2937] rounded-lg bg-[#020617] p-2">
                      <p className="text-[11px] text-[#9CA3AF] mb-1">
                        AI explanation
                      </p>
                      <p>
                        Model identified patterns consistent with real-world threat
                        language and historical abuse.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-[#6B7280] gap-2">
                    <MessageCircle className="w-7 h-7 opacity-40" />
                    <p className="text-[12px]">
                      Content context appears here when a case is selected.
                    </p>
                  </div>
                )}
              </div>
              <div className="col-span-1 p-3 space-y-2 overflow-y-auto">
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.16em]">
                  Decision Actions
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#022c22] text-[#6ee7b7] border border-[#10b981]/40 hover:bg-[#064e3b]"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Approve Moderator Decision
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#450a0a] text-[#fecaca] border border-[#7f1d1d] hover:bg-[#7f1d1d]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Override &amp; Remove Content
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#020617] text-[#e5e7eb] border border-[#1f2937] hover:bg-[#111827]"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Temporary Suspend User
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#7f1d1d] text-[#fee2e2] border border-[#b91c1c] hover:bg-[#b91c1c]"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Permanently Ban User
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] font-semibold bg-[#111827] text-[#e5e7eb] border border-[#1f2937] hover:bg-[#1f2937]"
                  >
                    <X className="w-3.5 h-3.5" />
                    Dismiss Escalation
                  </button>
                </div>
                <div className="border border-[#1f2937] rounded-xl bg-[#020617] p-3 space-y-2 text-[11px] text-[#9ca3af]">
                  <p className="font-semibold uppercase tracking-[0.16em]">
                    Final Classification
                  </p>
                  <select className="w-full bg-[#020617] border border-[#1f2937] rounded-full px-3 py-1.5 text-[12px] text-[#e5e7eb] focus:ring-1 focus:ring-[#1d9bf0] outline-none">
                    <option>Hate / Harassment</option>
                    <option>Violence / Threats</option>
                    <option>Self-harm / Safety</option>
                    <option>Fraud / Scam</option>
                    <option>Other Policy</option>
                  </select>
                  <p className="mt-2">Internal justification</p>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl bg-[#020617] border border-[#1f2937] text-[12px] text-[#e5e7eb] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1d9bf0]"
                    placeholder="Explain your final decision and rationale. Required when overriding moderator actions."
                  />
                  <p className="mt-2">Compliance notes (sensitive)</p>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl bg-[#020617] border border-[#1f2937] text-[12px] text-[#e5e7eb] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1d9bf0]"
                    placeholder="Optional notes for legal/compliance teams."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Escalation Volume
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Escalations per day
                </p>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ReactECharts
                option={barEscalationVolume}
                style={{ height: "100%", width: "100%", position: "absolute" }}
              />
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Outcome Breakdown
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Approved, overturned, further escalated, dismissed
                </p>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ReactECharts
                option={stackedEscalationOutcome}
                style={{ height: "100%", width: "100%", position: "absolute" }}
              />
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Reasons & Severity
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Why cases are escalated and how severe they are.
                </p>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="relative">
                <ReactECharts
                  option={pieEscalationReasons}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  }}
                />
              </div>
              <div className="relative">
                <ReactECharts
                  option={areaSeverityTrend}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-semibold text-[#E5E7EB]">
                Decision Audit Trail
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                Full lifecycle of escalated decisions for compliance review.
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
          <div className="border border-[#1F2937] rounded-xl bg-[#020617] p-3 text-[11px] text-[#D1D5DB]">
            <div className="relative pl-4 space-y-2">
              <div className="absolute left-1 top-1 bottom-1 w-px bg-[#1F2937]" />
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#38bdf8] mt-1" />
                <div>
                  <p className="font-semibold text-[#E5E7EB]">
                    Report submitted
                  </p>
                  <p className="text-[#9CA3AF]">
                    Reporter user_1432 · 2026-03-02 08:21 UTC · IP 52.14.120.11
                    · Device iOS / Safari
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] mt-1" />
                <div>
                  <p className="font-semibold text-[#E5E7EB]">
                    Moderator action
                  </p>
                  <p className="text-[#9CA3AF]">
                    Alex (US-West) · Soft reject &amp; warn · IP 10.12.4.23 ·
                    Chrome / macOS
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#facc15] mt-1" />
                <div>
                  <p className="font-semibold text-[#E5E7EB]">
                    Escalation created
                  </p>
                  <p className="text-[#9CA3AF]">
                    Reason: Ambiguous threat involving real-world location.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f97373] mt-1" />
                <div>
                  <p className="font-semibold text-[#E5E7EB]">
                    Admin / Super Admin review
                  </p>
                  <p className="text-[#9CA3AF]">
                    Final decision, enforcement action, and compliance notes
                    appear here once completed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

