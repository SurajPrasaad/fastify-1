"use client";

import React, { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

type DateRange = "24h" | "7d" | "30d" | "90d";

interface ModeratorRow {
  name: string;
  team: string;
  casesReviewed: number;
  avgReviewTime: string;
  accuracy: number;
  escalationRate: number;
  slaCompliance: number;
  activeCases: number;
}

const MODERATOR_ROWS: ModeratorRow[] = [
  {
    name: "Alex Morgan",
    team: "US-West",
    casesReviewed: 320,
    avgReviewTime: "3m 10s",
    accuracy: 97.4,
    escalationRate: 6.1,
    slaCompliance: 99.2,
    activeCases: 4,
  },
  {
    name: "Priya Shah",
    team: "APAC",
    casesReviewed: 298,
    avgReviewTime: "3m 52s",
    accuracy: 95.8,
    escalationRate: 9.3,
    slaCompliance: 97.9,
    activeCases: 7,
  },
  {
    name: "Jordan Lee",
    team: "EMEA",
    casesReviewed: 274,
    avgReviewTime: "4m 12s",
    accuracy: 93.6,
    escalationRate: 12.7,
    slaCompliance: 95.1,
    activeCases: 5,
  },
  {
    name: "Taylor Kim",
    team: "US-East",
    casesReviewed: 190,
    avgReviewTime: "5m 05s",
    accuracy: 89.3,
    escalationRate: 18.4,
    slaCompliance: 90.6,
    activeCases: 9,
  },
];

const KPI_CONFIG = [
  {
    key: "totalCases",
    label: "Total Cases Reviewed",
    value: "1,082",
    trend: "+8.2% vs last week",
    positive: true,
  },
  {
    key: "avgTime",
    label: "Average Review Time",
    value: "3m 47s",
    trend: "-12s vs last week",
    positive: true,
  },
  {
    key: "accuracy",
    label: "Accuracy Score",
    value: "95.9%",
    trend: "-1.1pts vs benchmark",
    positive: false,
  },
  {
    key: "escalation",
    label: "Escalation Rate",
    value: "8.4%",
    trend: "+0.6pts vs last week",
    positive: false,
  },
  {
    key: "sla",
    label: "SLA Compliance",
    value: "97.8%",
    trend: "+0.9pts vs target",
    positive: true,
  },
  {
    key: "reopened",
    label: "Reopened Case Rate",
    value: "3.2%",
    trend: "-0.4pts vs last week",
    positive: true,
  },
] as const;

const barCasesReviewed = {
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
      itemStyle: { color: "#22c55e", borderRadius: [4, 4, 0, 0] },
      data: [142, 166, 158, 172, 190, 128, 126],
    },
  ],
};

const lineReviewTime = {
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
    axisLabel: {
      color: "#6b7280",
      fontSize: 10,
      formatter: (v: number) => `${v.toFixed(1)}m`,
    },
  },
  series: [
    {
      type: "line",
      smooth: true,
      symbolSize: 4,
      itemStyle: { color: "#38bdf8" },
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(56,189,248,0.35)" },
            { offset: 1, color: "rgba(15,23,42,0)" },
          ],
        },
      },
      data: [4.1, 3.9, 3.7, 3.5],
    },
  ],
};

const areaWorkload = {
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
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 3,
      itemStyle: { color: "#6366f1" },
      lineStyle: { width: 2 },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(99,102,241,0.4)" },
            { offset: 1, color: "rgba(15,23,42,0)" },
          ],
        },
      },
      data: [680, 740, 720, 810],
    },
  ],
};

const pieDecision = {
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
        { value: 54, name: "Approved", itemStyle: { color: "#22c55e" } },
        { value: 26, name: "Rejected", itemStyle: { color: "#f97373" } },
        { value: 12, name: "Escalated", itemStyle: { color: "#38bdf8" } },
        { value: 8, name: "Dismissed", itemStyle: { color: "#e5e7eb" } },
      ],
    },
  ],
};

const gaugeAccuracy = {
  backgroundColor: "transparent",
  series: [
    {
      type: "gauge",
      radius: "95%",
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          width: 10,
          color: [
            [0.6, "#b91c1c"],
            [0.85, "#facc15"],
            [1, "#22c55e"],
          ],
        },
      },
      pointer: { show: true, length: "60%", width: 3 },
      detail: {
        valueAnimation: true,
        formatter: "{value}%",
        color: "#e5e7eb",
        fontSize: 18,
      },
      data: [{ value: 95.9 }],
      axisLabel: { color: "#9ca3af", fontSize: 9 },
      splitLine: { length: 8, lineStyle: { color: "#1f2937" } },
      axisTick: { length: 4, lineStyle: { color: "#1f2937" } },
    },
  ],
};

const lineSlaCompliance = {
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
    data: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    axisLine: { lineStyle: { color: "#374151" } },
    axisLabel: { color: "#9ca3af", fontSize: 10 },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    min: 80,
    max: 100,
    splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
    axisLabel: {
      color: "#6b7280",
      fontSize: 10,
      formatter: (v: number) => `${v}%`,
    },
  },
  series: [
    {
      type: "line",
      smooth: true,
      symbolSize: 4,
      itemStyle: { color: "#22c55e" },
      lineStyle: { width: 2 },
      data: [96.8, 97.2, 97.9, 98.1, 97.8],
    },
    {
      type: "line",
      smooth: true,
      symbol: "none",
      itemStyle: { color: "#facc15" },
      lineStyle: { width: 1, type: "dashed" },
      data: [95, 95, 95, 95, 95],
    },
  ],
};

const barResponseBySeverity = {
  backgroundColor: "transparent",
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    backgroundColor: "#020617",
    borderColor: "#1f2937",
    textStyle: { color: "#e5e7eb", fontSize: 11 },
  },
  grid: { top: 10, left: 80, right: 10, bottom: 20, containLabel: false },
  xAxis: {
    type: "value",
    axisLine: { lineStyle: { color: "#374151" } },
    splitLine: { lineStyle: { color: "#111827", type: "dashed" } },
    axisLabel: {
      color: "#6b7280",
      fontSize: 10,
      formatter: (v: number) => `${v.toFixed(1)}m`,
    },
  },
  yAxis: {
    type: "category",
    data: ["High", "Medium", "Low"],
    axisLine: { lineStyle: { color: "#374151" } },
    axisLabel: { color: "#9ca3af", fontSize: 10 },
  },
  series: [
    {
      type: "bar",
      barWidth: 12,
      itemStyle: { color: "#f97373", borderRadius: [4, 4, 4, 4] },
      data: [2.1, 3.4, 4.7],
    },
  ],
};

const barEscalationOutcomes = {
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
      name: "Rejected",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#f97373" },
      barWidth: 16,
      data: [8, 9, 7, 10],
    },
    {
      name: "Returned",
      type: "bar",
      stack: "total",
      itemStyle: { color: "#e5e7eb" },
      barWidth: 16,
      data: [3, 4, 2, 5],
    },
  ],
};

const lineEscalationTrend = {
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
    axisLabel: {
      color: "#6b7280",
      fontSize: 10,
      formatter: (v: number) => `${v}%`,
    },
  },
  series: [
    {
      type: "line",
      smooth: true,
      symbolSize: 4,
      itemStyle: { color: "#38bdf8" },
      lineStyle: { width: 2 },
      data: [7.2, 7.9, 8.5, 8.4],
    },
  ],
};

export default function SuperAdminModeratorsPerformance() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [teamFilter, setTeamFilter] = useState("All Teams");

  const filteredRows = useMemo(
    () =>
      MODERATOR_ROWS.filter(
        (row) => teamFilter === "All Teams" || row.team === teamFilter,
      ),
    [teamFilter],
  );

  const accuracyBelowThreshold = 95.9 < 94;

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
            <BarChart3 className="w-5 h-5 text-[#38bdf8]" />
            Performance Metrics
          </h1>
          <p className="text-[13px] text-[#71767B] mt-0.5">
            Moderation efficiency and quality insights.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#050816] border border-[#1F2937] rounded-md p-1">
            {(["24h", "7d", "30d", "90d"] as DateRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-[12px] font-semibold rounded-sm transition-colors ${
                  dateRange === range
                    ? "bg-[#111827] text-[#E5E7EB] shadow-sm"
                    : "text-[#9CA3AF] hover:text-[#E5E7EB]"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="bg-[#050816] border border-[#1F2937] rounded-full px-3 py-1.5 text-[12px] text-[#E5E7EB] focus:ring-1 focus:ring-[#1D9BF0] outline-none"
          >
            <option>All Teams</option>
            <option>US-West</option>
            <option>US-East</option>
            <option>EMEA</option>
            <option>APAC</option>
          </select>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-[#E5E7EB] bg-[#050816] border border-[#1F2937] hover:bg-[#111827]"
          >
            <Filter className="w-4 h-4 text-[#9CA3AF]" />
            Advanced
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] text-black bg-[#E5E7EB] hover:bg-white"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#1F2937] text-[#9CA3AF] hover:bg-[#111827]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {KPI_CONFIG.map((kpi) => {
            const Icon = kpi.positive ? TrendingUp : TrendingDown;
            const color =
              kpi.key === "accuracy" || kpi.key === "sla"
                ? kpi.positive
                  ? "text-[#22c55e]"
                  : "text-[#f97373]"
                : kpi.positive
                ? "text-[#22c55e]"
                : "text-[#facc15]";
            return (
              <div
                key={kpi.key}
                className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-[0.14em]">
                    {kpi.label}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg bg-[#020617] border border-[#1F2937] flex items-center justify-center ${color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-[22px] font-bold text-[#E5E7EB] leading-tight">
                    {kpi.value}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">{kpi.trend}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Daily Cases Reviewed
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Volume of decisions by day
                </p>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ReactECharts
                option={barCasesReviewed}
                style={{ height: "100%", width: "100%", position: "absolute" }}
              />
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Review Time Trend
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Average review time by week
                </p>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ReactECharts
                option={lineReviewTime}
                style={{ height: "100%", width: "100%", position: "absolute" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Weekly Workload
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Total cases assigned over time
                </p>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ReactECharts
                option={areaWorkload}
                style={{ height: "100%", width: "100%", position: "absolute" }}
              />
            </div>
          </div>
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Decision Distribution
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Approvals, rejects, escalations, and dismissals
                </p>
              </div>
            </div>
            <div className="flex-1 w-full relative flex items-center justify-center">
              <ReactECharts
                option={pieDecision}
                style={{ height: "100%", width: "100%", position: "absolute" }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Decision Accuracy
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Compared to target benchmark
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-40 h-40 relative">
                <ReactECharts
                  option={gaugeAccuracy}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  }}
                />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#9CA3AF]">
              <div>
                <p>False positive rate</p>
                <p className="text-[#E5E7EB] font-semibold">2.1%</p>
              </div>
              <div>
                <p>False negative rate</p>
                <p className="text-[#E5E7EB] font-semibold">1.9%</p>
              </div>
              <div>
                <p>Appeal overturn rate</p>
                <p className="text-[#E5E7EB] font-semibold">3.4%</p>
              </div>
              <div>
                <p>AI override rate</p>
                <p className="text-[#E5E7EB] font-semibold">11.8%</p>
              </div>
            </div>
            {accuracyBelowThreshold && (
              <div className="mt-3 border border-[#713f12] bg-[#451a03]/70 rounded-lg px-3 py-2 flex items-start gap-2 text-[11px] text-[#fef9c3]">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <p>
                  Accuracy trending below target benchmark. Consider calibration,
                  training, or reviewing edge-case policies.
                </p>
              </div>
            )}
          </div>

          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  SLA & Response Time
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Target: respond within 2 hours
                </p>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-28 w-full relative">
                <ReactECharts
                  option={lineSlaCompliance}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  }}
                />
              </div>
              <div className="h-24 w-full relative">
                <ReactECharts
                  option={barResponseBySeverity}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[12px] font-semibold text-[#E5E7EB]">
                  Escalation Analysis
                </p>
                <p className="text-[11px] text-[#9CA3AF]">
                  Outcomes and trend over time
                </p>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-24 w-full relative">
                <ReactECharts
                  option={barEscalationOutcomes}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  }}
                />
              </div>
              <div className="h-24 w-full relative">
                <ReactECharts
                  option={lineEscalationTrend}
                  style={{
                    height: "100%",
                    width: "100%",
                    position: "absolute",
                  }}
                />
              </div>
              <p className="text-[11px] text-[#9CA3AF]">
                High escalation rates may indicate uncertainty, insufficient
                policy clarity, or higher-risk queues.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#050816] border border-[#1F2937] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] font-semibold text-[#E5E7EB]">
                Workload Distribution
              </p>
              <p className="text-[11px] text-[#9CA3AF]">
                Moderator-level performance overview (team-filtered).
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#9CA3AF]">
              <Users className="w-4 h-4" />
              {filteredRows.length} moderators
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-[#1F2937] bg-[#020617]">
                  <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                    Moderator
                  </th>
                  <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                    Cases
                  </th>
                  <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                    Avg Review
                  </th>
                  <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                    Accuracy
                  </th>
                  <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                    Escalation
                  </th>
                  <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                    SLA
                  </th>
                  <th className="px-3 py-2 text-[#9CA3AF] font-semibold">
                    Active
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const accuracyColor =
                    row.accuracy >= 96
                      ? "text-[#22c55e]"
                      : row.accuracy >= 92
                      ? "text-[#facc15]"
                      : "text-[#f97373]";
                  const slaColor =
                    row.slaCompliance >= 97
                      ? "text-[#22c55e]"
                      : row.slaCompliance >= 93
                      ? "text-[#facc15]"
                      : "text-[#f97373]";
                  return (
                    <tr
                      key={row.name}
                      className="border-b border-[#111827] hover:bg-[#020617]"
                    >
                      <td className="px-3 py-2 text-[#E5E7EB]">
                        <div className="flex flex-col">
                          <span className="font-semibold">{row.name}</span>
                          <span className="text-[11px] text-[#9CA3AF]">
                            {row.team}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-[#E5E7EB]">
                        {row.casesReviewed.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-[#E5E7EB]">
                        {row.avgReviewTime}
                      </td>
                      <td className={`px-3 py-2 font-semibold ${accuracyColor}`}>
                        {row.accuracy.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-[#E5E7EB]">
                        {row.escalationRate.toFixed(1)}%
                      </td>
                      <td className={`px-3 py-2 font-semibold ${slaColor}`}>
                        {row.slaCompliance.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2 text-[#E5E7EB]">
                        {row.activeCases}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}   

