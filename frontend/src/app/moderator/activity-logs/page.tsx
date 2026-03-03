"use client";

import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ChevronDown, ChevronRight } from "lucide-react";

export default function ModeratorActivityLogsPage() {
  const [actorId, setActorId] = useState("");
  const [actionType, setActionType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const query = trpc.admin.auditLogs.query.useQuery(
    {
      limit: 50,
      offset: 0,
      ...(actorId ? { actorId } : {}),
      ...(actionType ? { actionType } : {}),
      ...(startDate ? { startDate: new Date(startDate).toISOString() } : {}),
      ...(endDate ? { endDate: new Date(endDate).toISOString() } : {}),
    },
    { retry: (_, err) => (err as { data?: { code?: string } })?.data?.code !== "FORBIDDEN" }
  );

  const logs = (query.data?.data ?? []) as Array<{
    id: string;
    adminId: string;
    actionType: string;
    resourceType: string;
    resourceId: string;
    reason?: string;
    createdAt: string;
    ipAddress?: string;
    userAgent?: string;
  }>;
  const isForbidden = (query.error as { data?: { code?: string } })?.data?.code === "FORBIDDEN";

  const exportCsv = () => {
    const headers = ["id", "actorId", "actionType", "resourceType", "resourceId", "reason", "createdAt", "ipAddress"];
    const rows = logs.map((l) =>
      [l.id, l.adminId, l.actionType, l.resourceType, l.resourceId, l.reason ?? "", l.createdAt, l.ipAddress ?? ""].map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Activity Logs</h1>
          <p className="text-sm text-muted-foreground">Append-only audit trail</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Actor ID"
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="w-40"
          />
          <Input
            placeholder="Action type"
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="w-36"
          />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-36" />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-36" />
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Apply
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={logs.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isForbidden && (
          <div className="rounded-lg border border-mod-warning bg-mod-warning/10 p-4 text-center text-sm text-muted-foreground">
            You don’t have permission to view activity logs. Contact an administrator.
          </div>
        )}
        {!isForbidden && query.isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}
        {!isForbidden && !query.isLoading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <FileText className="h-12 w-12 opacity-50" aria-hidden />
            <p className="text-sm font-medium">No logs match the filter</p>
          </div>
        )}
        {!isForbidden && !query.isLoading && logs.length > 0 && (
          <div className="space-y-1">
            {logs.map((log) => (
              <div key={log.id} className="rounded-lg border border-border bg-card">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 p-3 text-left hover:bg-muted/30"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <span className="shrink-0">
                    {expandedId === log.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">
                    Immutable
                  </Badge>
                  <span className="font-medium">{log.actionType}</span>
                  <span className="text-muted-foreground">{log.resourceType}/{log.resourceId?.slice(0, 8)}…</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </button>
                {expandedId === log.id && (
                  <div className="border-t border-border px-3 pb-3 pt-1 text-xs text-muted-foreground">
                    <p><strong>Actor:</strong> {log.adminId}</p>
                    {log.reason && <p><strong>Reason:</strong> {log.reason}</p>}
                    {log.ipAddress && <p><strong>IP:</strong> {log.ipAddress}</p>}
                    {log.userAgent && <p><strong>Device:</strong> {log.userAgent}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
