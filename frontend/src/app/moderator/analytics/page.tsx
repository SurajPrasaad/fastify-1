"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Clock, CheckCircle2, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export default function ModeratorAnalyticsPage() {
  const statsQuery = trpc.moderation.getQueueStats.useQuery(undefined, { refetchInterval: 60_000 });
  const appealsPendingQuery = trpc.appeals.getPendingCount.useQuery(undefined, { refetchInterval: 60_000 });
  const appealsListQuery = trpc.appeals.list.useQuery(
    { limit: 100, offset: 0 },
    { refetchInterval: 60_000 }
  );

  const stats = statsQuery.data;
  const pendingCount = typeof appealsPendingQuery.data === "number" ? appealsPendingQuery.data : 0;
  const appeals = (appealsListQuery.data?.items ?? []) as Array<{ status: string }>;
  const approvedAppeals = appeals.filter((a) => a.status === "APPROVED").length;
  const rejectedAppeals = appeals.filter((a) => a.status === "REJECTED").length;
  const totalReviewed = approvedAppeals + rejectedAppeals + appeals.filter((a) => a.status === "MODIFIED").length;
  const reversalRate = totalReviewed > 0 ? (approvedAppeals / totalReviewed) * 100 : 0;

  const volumeOption = useMemo(() => {
    const approved = stats?.approvedToday ?? 0;
    const rejected = stats?.rejectedToday ?? 0;
    const pending = stats?.pendingCount ?? 0;
    return {
      tooltip: { trigger: "axis" },
      legend: { data: ["Approved", "Rejected", "Pending"], bottom: 0 },
      grid: { left: "12%", right: "8%", top: "12%", bottom: "20%" },
      xAxis: { type: "category", data: ["Today"] },
      yAxis: { type: "value" },
      series: [
        { name: "Approved", type: "bar", data: [approved], itemStyle: { color: "hsl(var(--mod-approved))" } },
        { name: "Rejected", type: "bar", data: [rejected], itemStyle: { color: "hsl(var(--mod-rejected))" } },
        { name: "Pending", type: "bar", data: [pending], itemStyle: { color: "hsl(var(--mod-info))" } },
      ],
    };
  }, [stats?.approvedToday, stats?.rejectedToday, stats?.pendingCount]);

  const rateOption = useMemo(() => {
    const approved = stats?.approvedToday ?? 0;
    const rejected = stats?.rejectedToday ?? 0;
    const total = approved + rejected || 1;
    return {
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          label: { show: true, formatter: "{b}: {d}%" },
          data: [
            { value: Math.round((approved / total) * 100), name: "Approval rate", itemStyle: { color: "hsl(var(--mod-approved))" } },
            { value: Math.round((rejected / total) * 100), name: "Rejection rate", itemStyle: { color: "hsl(var(--mod-rejected))" } },
          ],
        },
      ],
    };
  }, [stats?.approvedToday, stats?.rejectedToday]);

  const isLoading = statsQuery.isLoading;

  return (
    <div className="flex h-full flex-col overflow-auto bg-background p-4">
      <h1 className="text-lg font-semibold tracking-tight">Moderation Analytics</h1>
      <p className="text-sm text-muted-foreground">Queue and appeal metrics</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending queue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{stats?.pendingCount ?? 0}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg review time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">
                {stats?.avgWaitTimeSeconds != null ? `${Math.round(stats.avgWaitTimeSeconds)}s` : "—"}
              </span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appeals pending</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {appealsPendingQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{pendingCount}</span>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Appeal reversal rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {appealsListQuery.isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{reversalRate.toFixed(1)}%</span>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Moderation volume (today)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ReactECharts option={volumeOption} style={{ height: 280 }} opts={{ renderer: "canvas" }} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Approval vs rejection rate</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ReactECharts option={rateOption} style={{ height: 280 }} opts={{ renderer: "canvas" }} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
